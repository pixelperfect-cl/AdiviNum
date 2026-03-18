import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { NotificationService } from '../notification/notification.service';
import { CurrencyType } from '@prisma/client';

/**
 * Tournament formats:
 * - SINGLE_ELIMINATION: Standard bracket, lose = out
 * - ROUND_ROBIN: Everyone plays everyone, most wins advances
 */
type TournamentFormat = 'SINGLE_ELIMINATION' | 'ROUND_ROBIN';

interface CreateTournamentDto {
    name: string;
    description?: string;
    format: TournamentFormat;
    maxPlayers: number; // Must be power of 2 for SINGLE_ELIMINATION
    entryFee: number;
    currencyType: CurrencyType;
    level: number;
    prizeDistribution: number[]; // Percentages: [50, 25, 15, 10] = top 4
    startsAt: Date;
    registrationDeadline: Date;
}

@Injectable()
export class TournamentService {
    private readonly logger = new Logger(TournamentService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly wallet: WalletService,
        private readonly notifications: NotificationService,
    ) { }

    /**
     * Create a new tournament
     */
    async createTournament(dto: CreateTournamentDto) {
        // Validate format constraints
        if (dto.format === 'SINGLE_ELIMINATION') {
            if (!this.isPowerOf2(dto.maxPlayers)) {
                throw new BadRequestException('Single elimination requires power of 2 players');
            }
        }

        if (dto.prizeDistribution.reduce((a, b) => a + b, 0) > 100) {
            throw new BadRequestException('Prize distribution cannot exceed 100%');
        }

        const tournament = await this.prisma.tournament.create({
            data: {
                name: dto.name,
                description: dto.description,
                format: dto.format,
                maxPlayers: dto.maxPlayers,
                entryFee: dto.entryFee,
                currencyType: dto.currencyType,
                level: dto.level,
                prizePool: 0,
                prizeDistribution: dto.prizeDistribution,
                status: 'REGISTRATION',
                startsAt: dto.startsAt,
                registrationDeadline: dto.registrationDeadline,
            },
        });

        this.logger.log(`Tournament created: ${tournament.name} (${tournament.id})`);
        return tournament;
    }

    /**
     * Register a player for a tournament
     */
    async registerPlayer(tournamentId: string, userId: string) {
        const tournament = await this.prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: { _count: { select: { participants: true } } },
        });

        if (!tournament) throw new BadRequestException('Torneo no encontrado');
        if (tournament.status !== 'REGISTRATION') throw new BadRequestException('Registro cerrado');
        if (new Date() > tournament.registrationDeadline) throw new BadRequestException('Plazo de registro expirado');
        if (tournament._count.participants >= tournament.maxPlayers) throw new BadRequestException('Torneo lleno');

        // Check if already registered
        const existing = await this.prisma.tournamentParticipant.findFirst({
            where: { tournamentId, userId },
        });
        if (existing) throw new BadRequestException('Ya estás registrado');

        // Hold entry fee
        await this.wallet.holdBet(userId, tournament.entryFee, tournament.currencyType);

        // Register participant
        await this.prisma.tournamentParticipant.create({
            data: {
                tournamentId,
                userId,
                status: 'REGISTERED',
            },
        });

        // Update prize pool
        await this.prisma.tournament.update({
            where: { id: tournamentId },
            data: {
                prizePool: { increment: tournament.entryFee },
            },
        });

        const currentCount = tournament._count.participants + 1;
        this.logger.log(`Player ${userId} registered for ${tournament.name} (${currentCount}/${tournament.maxPlayers})`);

        return { registered: true, currentPlayers: currentCount };
    }

    /**
     * Start a tournament (admin or scheduled)
     */
    async startTournament(tournamentId: string) {
        const tournament = await this.prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: { participants: { include: { user: true } } },
        });

        if (!tournament) throw new BadRequestException('Torneo no encontrado');
        if (tournament.status !== 'REGISTRATION') throw new BadRequestException('Torneo ya iniciado');
        if (tournament.participants.length < 4) throw new BadRequestException('Mínimo 4 jugadores');

        // Shuffle participants for fair bracket
        const shuffled = this.shuffleArray(tournament.participants);

        // Generate bracket (single elimination)
        if (tournament.format === 'SINGLE_ELIMINATION') {
            const rounds = Math.ceil(Math.log2(shuffled.length));
            await this.generateBracket(tournamentId, shuffled, rounds);
        }

        // Update tournament status
        await this.prisma.tournament.update({
            where: { id: tournamentId },
            data: { status: 'IN_PROGRESS', startedAt: new Date() },
        });

        // Notify all participants
        const userIds = tournament.participants.map((p) => p.userId);
        await this.notifications.notifyTournamentStart(userIds, tournament.name);

        this.logger.log(`Tournament ${tournament.name} started with ${shuffled.length} players`);
        return { started: true, totalPlayers: shuffled.length };
    }

    /**
     * Record a match result in the tournament
     */
    async recordMatchResult(
        tournamentId: string,
        roundNumber: number,
        matchIndex: number,
        winnerId: string,
    ) {
        // Update bracket match
        await this.prisma.tournamentMatch.updateMany({
            where: {
                tournamentId,
                roundNumber,
                matchIndex,
            },
            data: {
                winnerId,
                completedAt: new Date(),
            },
        });

        // Check if round is complete
        const roundMatches = await this.prisma.tournamentMatch.findMany({
            where: { tournamentId, roundNumber },
        });

        const allComplete = roundMatches.every((m) => m.winnerId !== null);

        if (allComplete) {
            // Check if tournament is over
            const nextRound = roundNumber + 1;
            const nextRoundMatches = await this.prisma.tournamentMatch.findMany({
                where: { tournamentId, roundNumber: nextRound },
            });

            if (nextRoundMatches.length === 0) {
                // Tournament is over — settle prizes
                await this.settleTournament(tournamentId);
            } else {
                // Advance winners to next round
                const winners = roundMatches.map((m) => m.winnerId!);
                for (let i = 0; i < winners.length; i += 2) {
                    const matchIdx = Math.floor(i / 2);
                    await this.prisma.tournamentMatch.updateMany({
                        where: { tournamentId, roundNumber: nextRound, matchIndex: matchIdx },
                        data: {
                            playerAId: winners[i],
                            playerBId: winners[i + 1] || null,
                        },
                    });
                }
            }
        }
    }

    /**
     * Settle tournament prizes
     */
    async settleTournament(tournamentId: string) {
        const tournament = await this.prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: {
                participants: { include: { user: true } },
                matches: { orderBy: { roundNumber: 'desc' } },
            },
        });

        if (!tournament) return;

        const prizePool = tournament.prizePool;
        const distribution = tournament.prizeDistribution as number[];

        // Find winners by elimination order
        const finalMatch = tournament.matches.find((m) => m.roundNumber === Math.ceil(Math.log2(tournament.maxPlayers)));
        if (!finalMatch || !finalMatch.winnerId) return;

        // Position 1: Final winner
        const positions: string[] = [finalMatch.winnerId];

        // Position 2: Final loser
        const finalLoserId = finalMatch.playerAId === finalMatch.winnerId
            ? finalMatch.playerBId
            : finalMatch.playerAId;
        if (finalLoserId) positions.push(finalLoserId);

        // Distribute prizes
        for (let i = 0; i < Math.min(positions.length, distribution.length); i++) {
            const prize = Math.floor(prizePool * (distribution[i] / 100));
            if (prize > 0 && positions[i]) {
                await this.wallet.settleWin(positions[i], prize, tournament.currencyType, `tournament-${tournamentId}`);

                // Notify winner
                await this.notifications.sendPush(
                    positions[i],
                    `🏆 ¡Puesto ${i + 1} en ${tournament.name}!`,
                    `Has ganado $${prize.toLocaleString()}`,
                    { type: 'tournament_result' },
                );
            }
        }

        // Update tournament status
        await this.prisma.tournament.update({
            where: { id: tournamentId },
            data: { status: 'FINISHED', finishedAt: new Date() },
        });

        this.logger.log(`Tournament ${tournament.name} settled. Prize pool: ${prizePool}`);
    }

    /**
     * Get tournament details with bracket
     */
    async getTournament(tournamentId: string) {
        return this.prisma.tournament.findUnique({
            where: { id: tournamentId },
            include: {
                participants: {
                    include: { user: { select: { id: true, username: true, eloRating: true, avatarUrl: true } } },
                },
                matches: {
                    orderBy: [{ roundNumber: 'asc' }, { matchIndex: 'asc' }],
                    include: {
                        playerA: { select: { id: true, username: true } },
                        playerB: { select: { id: true, username: true } },
                    },
                },
            },
        });
    }

    /**
     * List active and upcoming tournaments
     */
    async listTournaments(status?: string) {
        const where = status ? { status } : { status: { in: ['REGISTRATION', 'IN_PROGRESS'] } };

        return this.prisma.tournament.findMany({
            where: where as any,
            orderBy: { startsAt: 'asc' },
            include: {
                _count: { select: { participants: true } },
            },
        });
    }

    // ---- Private helpers ----

    private async generateBracket(tournamentId: string, participants: any[], totalRounds: number) {
        // Round 1: pair participants
        for (let i = 0; i < participants.length; i += 2) {
            await this.prisma.tournamentMatch.create({
                data: {
                    tournamentId,
                    roundNumber: 1,
                    matchIndex: Math.floor(i / 2),
                    playerAId: participants[i].userId,
                    playerBId: participants[i + 1]?.userId || null,
                },
            });
        }

        // Create empty matches for subsequent rounds
        let matchesInRound = Math.floor(participants.length / 4);
        for (let round = 2; round <= totalRounds; round++) {
            for (let j = 0; j < matchesInRound; j++) {
                await this.prisma.tournamentMatch.create({
                    data: {
                        tournamentId,
                        roundNumber: round,
                        matchIndex: j,
                    },
                });
            }
            matchesInRound = Math.max(1, Math.floor(matchesInRound / 2));
        }
    }

    private isPowerOf2(n: number): boolean {
        return n > 0 && (n & (n - 1)) === 0;
    }

    private shuffleArray<T>(arr: T[]): T[] {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}
