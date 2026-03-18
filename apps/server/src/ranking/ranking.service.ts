import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getRankForElo } from '@adivinum/shared';

@Injectable()
export class RankingService {
    private readonly logger = new Logger(RankingService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get global leaderboard (top players by ELO)
     */
    async getGlobalLeaderboard(limit = 100) {
        const players = await this.prisma.user.findMany({
            where: { isBanned: false, gamesPlayed: { gt: 0 } },
            orderBy: { eloRating: 'desc' },
            take: limit,
            select: {
                id: true,
                username: true,
                avatarUrl: true,
                eloRating: true,
                currentLevel: true,
                gamesPlayed: true,
                gamesWon: true,
                streakCurrent: true,
                country: true,
            },
        });

        return players.map((p, index) => ({
            ...p,
            position: index + 1,
            rank: getRankForElo(p.eloRating),
            winRate: p.gamesPlayed > 0
                ? parseFloat((p.gamesWon / p.gamesPlayed * 100).toFixed(1))
                : 0,
        }));
    }

    /**
     * Get leaderboard by country
     */
    async getCountryLeaderboard(country: string, limit = 100) {
        const players = await this.prisma.user.findMany({
            where: { isBanned: false, gamesPlayed: { gt: 0 }, country },
            orderBy: { eloRating: 'desc' },
            take: limit,
            select: {
                id: true,
                username: true,
                avatarUrl: true,
                eloRating: true,
                currentLevel: true,
                gamesWon: true,
                gamesPlayed: true,
            },
        });

        return players.map((p, index) => ({
            ...p,
            position: index + 1,
            rank: getRankForElo(p.eloRating),
        }));
    }

    /**
     * Get top winners (by games won)
     */
    async getTopWinners(limit = 100) {
        return this.prisma.user.findMany({
            where: { isBanned: false, gamesPlayed: { gt: 0 } },
            orderBy: { gamesWon: 'desc' },
            take: limit,
            select: {
                id: true,
                username: true,
                avatarUrl: true,
                gamesWon: true,
                gamesPlayed: true,
                eloRating: true,
            },
        });
    }

    /**
     * Update ELO after a match
     * Simple ELO formula: K=32
     */
    async updateElo(winnerId: string, loserId: string) {
        try {
            const K = 32;
            const winner = await this.prisma.user.findUnique({ where: { id: winnerId } });
            const loser = await this.prisma.user.findUnique({ where: { id: loserId } });

            if (!winner || !loser) {
                this.logger.warn(`updateElo: User not found — winner=${winnerId}, loser=${loserId}`);
                return;
            }

            const expectedWin = 1 / (1 + Math.pow(10, (loser.eloRating - winner.eloRating) / 400));
            const expectedLose = 1 - expectedWin;

            const newWinnerElo = Math.round(winner.eloRating + K * (1 - expectedWin));
            const newLoserElo = Math.max(100, Math.round(loser.eloRating + K * (0 - expectedLose)));

            await this.prisma.$transaction([
                this.prisma.user.update({ where: { id: winnerId }, data: { eloRating: newWinnerElo } }),
                this.prisma.user.update({ where: { id: loserId }, data: { eloRating: newLoserElo } }),
            ]);

            this.logger.log(`ELO updated: ${winner.username} ${winner.eloRating}→${newWinnerElo}, ${loser.username} ${loser.eloRating}→${newLoserElo}`);
        } catch (error) {
            this.logger.error(`Failed to update ELO for winner=${winnerId}, loser=${loserId}`, error);
        }
    }

    /**
     * Update ELO after a draw
     * In a draw, both players get a result of 0.5
     */
    async updateEloDraw(playerAId: string, playerBId: string) {
        try {
            const K = 32;
            const playerA = await this.prisma.user.findUnique({ where: { id: playerAId } });
            const playerB = await this.prisma.user.findUnique({ where: { id: playerBId } });

            if (!playerA || !playerB) {
                this.logger.warn(`updateEloDraw: User not found — A=${playerAId}, B=${playerBId}`);
                return;
            }

            const expectedA = 1 / (1 + Math.pow(10, (playerB.eloRating - playerA.eloRating) / 400));
            const expectedB = 1 - expectedA;

            const newEloA = Math.max(100, Math.round(playerA.eloRating + K * (0.5 - expectedA)));
            const newEloB = Math.max(100, Math.round(playerB.eloRating + K * (0.5 - expectedB)));

            await this.prisma.$transaction([
                this.prisma.user.update({ where: { id: playerAId }, data: { eloRating: newEloA } }),
                this.prisma.user.update({ where: { id: playerBId }, data: { eloRating: newEloB } }),
            ]);

            this.logger.log(`ELO draw: ${playerA.username} ${playerA.eloRating}→${newEloA}, ${playerB.username} ${playerB.eloRating}→${newEloB}`);
        } catch (error) {
            this.logger.error(`Failed to update ELO draw for A=${playerAId}, B=${playerBId}`, error);
        }
    }
}

