import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ACHIEVEMENT_DEFS = [
    { key: 'first_win', name: '¡Primera Victoria!', description: 'Gana tu primera partida', icon: '🏆' },
    { key: 'win_5', name: 'Pentakill', description: 'Gana 5 partidas', icon: '⭐' },
    { key: 'win_20', name: 'Veterano', description: 'Gana 20 partidas', icon: '🎖️' },
    { key: 'win_50', name: 'Leyenda', description: 'Gana 50 partidas', icon: '👑' },
    { key: 'streak_3', name: 'En Racha', description: 'Consigue una racha de 3 victorias', icon: '🔥' },
    { key: 'streak_5', name: 'Imparable', description: 'Consigue una racha de 5 victorias', icon: '💥' },
    { key: 'play_10', name: 'Entusiasta', description: 'Juega 10 partidas', icon: '🎮' },
    { key: 'play_50', name: 'Dedicado', description: 'Juega 50 partidas', icon: '💎' },
    { key: 'level_3', name: 'Escalador', description: 'Alcanza el nivel 3', icon: '🧗' },
    { key: 'level_5', name: 'Élite', description: 'Alcanza el nivel 5', icon: '🚀' },
];

@Injectable()
export class UsersService implements OnModuleInit {
    private readonly logger = new Logger(UsersService.name);
    constructor(private readonly prisma: PrismaService) { }

    async onModuleInit() {
        // Seed achievements once at startup
        for (const def of ACHIEVEMENT_DEFS) {
            await this.prisma.achievement.upsert({
                where: { key: def.key },
                update: {},
                create: {
                    key: def.key,
                    name: def.name,
                    description: def.description,
                    iconUrl: def.icon,
                },
            });
        }
        this.logger.log(`Seeded ${ACHIEVEMENT_DEFS.length} achievements`);
    }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: { wallet: true },
        });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async findBySupabaseUid(supabaseUid: string) {
        return this.prisma.user.findUnique({
            where: { supabaseUid },
            include: { wallet: true },
        });
    }

    async updateProfile(id: string, data: { username?: string; avatarUrl?: string; country?: string; language?: string }) {
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }

    async getStats(id: string) {
        const user = await this.findById(id);
        const levelProgress = await this.prisma.levelProgress.findMany({
            where: { userId: id },
            orderBy: { level: 'asc' },
        });
        return {
            gamesPlayed: user.gamesPlayed,
            gamesWon: user.gamesWon,
            winRate: user.gamesPlayed > 0 ? (user.gamesWon / user.gamesPlayed * 100).toFixed(1) : '0',
            eloRating: user.eloRating,
            currentLevel: user.currentLevel,
            streakCurrent: user.streakCurrent,
            streakBest: user.streakBest,
            levelProgress,
        };
    }

    async getMatchHistory(userId: string, limit = 20) {
        const matches = await this.prisma.match.findMany({
            where: {
                status: 'FINISHED',
                OR: [
                    { playerAId: userId },
                    { playerBId: userId },
                ],
            },
            orderBy: { finishedAt: 'desc' },
            take: limit,
            include: {
                playerA: { select: { id: true, username: true } },
                playerB: { select: { id: true, username: true } },
                _count: { select: { attempts: true } },
            },
        });

        return matches.map((m) => {
            const isPlayerA = m.playerAId === userId;
            const opponent = isPlayerA ? m.playerB : m.playerA;
            const iWon =
                (m.result === 'PLAYER_A_WINS' && isPlayerA) ||
                (m.result === 'PLAYER_B_WINS' && !isPlayerA);
            const isDraw = m.result === 'DRAW';
            const isAbandon = m.result?.includes('ABANDON') ?? false;
            const isTimeout = m.result?.includes('TIMEOUT') ?? false;

            return {
                id: m.id,
                level: m.level,
                betAmount: m.betAmount,
                currencyType: m.currencyType,
                opponent: opponent.username,
                result: iWon ? 'WIN' : isDraw ? 'DRAW' : 'LOSS',
                resultDetail: m.result,
                isAbandon,
                isTimeout,
                totalAttempts: m._count.attempts,
                finishedAt: m.finishedAt,
                createdAt: m.createdAt,
            };
        });
    }

    /**
     * Get detailed match info including all attempts
     */
    async getMatchDetail(matchId: string, userId: string) {
        const match = await this.prisma.match.findFirst({
            where: {
                id: matchId,
                status: 'FINISHED',
                OR: [
                    { playerAId: userId },
                    { playerBId: userId },
                ],
            },
            include: {
                playerA: { select: { id: true, username: true } },
                playerB: { select: { id: true, username: true } },
                attempts: {
                    orderBy: { turnNumber: 'asc' },
                    select: {
                        player: true,
                        guess: true,
                        toques: true,
                        famas: true,
                        turnNumber: true,
                    },
                },
            },
        });

        if (!match) return null;

        const isPlayerA = match.playerAId === userId;
        const opponent = isPlayerA ? match.playerB : match.playerA;
        const iWon =
            (match.result === 'PLAYER_A_WINS' && isPlayerA) ||
            (match.result === 'PLAYER_B_WINS' && !isPlayerA);
        const isDraw = match.result === 'DRAW';

        return {
            id: match.id,
            level: match.level,
            betAmount: match.betAmount,
            currencyType: match.currencyType,
            opponent: opponent.username,
            result: iWon ? 'WIN' : isDraw ? 'DRAW' : 'LOSS',
            resultDetail: match.result,
            secretA: match.secretA,
            secretB: match.secretB,
            myRole: isPlayerA ? 'A' : 'B',
            timeUsedA: match.timeUsedA,
            timeUsedB: match.timeUsedB,
            finishedAt: match.finishedAt,
            createdAt: match.createdAt,
            attempts: match.attempts,
        };
    }

    /**
     * Get ELO history for sparkline chart (from match results)
     */
    async getEloHistory(userId: string) {
        // For now, return the user's current ELO as a single point
        // In a production app, you'd have an EloHistory model
        // We'll derive a basic history from the last 20 matches
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { eloRating: true },
        });

        const matches = await this.prisma.match.findMany({
            where: {
                status: 'FINISHED',
                OR: [
                    { playerAId: userId },
                    { playerBId: userId },
                ],
            },
            orderBy: { finishedAt: 'desc' },
            take: 20,
            select: {
                id: true,
                result: true,
                playerAId: true,
                finishedAt: true,
            },
        });

        // Approximate ELO history going backwards from current
        const currentElo = user?.eloRating ?? 1000;
        const history: { date: string; elo: number }[] = [];
        let elo = currentElo;

        // Most recent first, reverse to build ascending timeline
        for (const m of matches) {
            history.unshift({
                date: m.finishedAt?.toISOString() ?? '',
                elo,
            });
            const isPlayerA = m.playerAId === userId;
            const iWon =
                (m.result === 'PLAYER_A_WINS' && isPlayerA) ||
                (m.result === 'PLAYER_B_WINS' && !isPlayerA);
            const isDraw = m.result === 'DRAW';
            // Reverse the ELO change to approximate previous ELO
            if (iWon) elo -= 16;
            else if (isDraw) elo -= 0;
            else elo += 16;
        }

        return history;
    }

    /**
     * Get all achievements with user's unlock status
     */
    async getAchievements(userId: string) {
        // Get all achievements with user unlock status
        const achievements = await this.prisma.achievement.findMany({
            include: {
                users: {
                    where: { userId },
                    select: { unlockedAt: true },
                },
            },
            orderBy: { key: 'asc' },
        });

        return achievements.map(a => ({
            id: a.id,
            key: a.key,
            name: a.name,
            description: a.description,
            icon: a.iconUrl,
            unlocked: a.users.length > 0,
            unlockedAt: a.users[0]?.unlockedAt ?? null,
        }));
    }
}
