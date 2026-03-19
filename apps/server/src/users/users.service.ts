import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrencyType, TransactionType } from '@prisma/client';

const ACHIEVEMENT_DEFS = [
    { key: 'first_win', name: '¡Primera Victoria!', description: 'Gana tu primera partida', icon: '🏆', reward: 1500 },
    { key: 'win_5', name: 'Pentakill', description: 'Gana 5 partidas', icon: '⭐', reward: 3000 },
    { key: 'win_20', name: 'Veterano', description: 'Gana 20 partidas', icon: '🎖️', reward: 9000 },
    { key: 'win_50', name: 'Leyenda', description: 'Gana 50 partidas', icon: '👑', reward: 30000 },
    { key: 'streak_3', name: 'En Racha', description: 'Consigue una racha de 3 victorias', icon: '🔥', reward: 2250 },
    { key: 'streak_5', name: 'Imparable', description: 'Consigue una racha de 5 victorias', icon: '💥', reward: 6000 },
    { key: 'play_10', name: 'Entusiasta', description: 'Juega 10 partidas', icon: '🎮', reward: 1500 },
    { key: 'play_50', name: 'Dedicado', description: 'Juega 50 partidas', icon: '💎', reward: 7500 },
    { key: 'level_3', name: 'Escalador', description: 'Alcanza el nivel 3', icon: '🧗', reward: 3000 },
    { key: 'level_5', name: 'Élite', description: 'Alcanza el nivel 5', icon: '🚀', reward: 9000 },
];

// XP thresholds — cumulative XP needed to reach each level
const LEVEL_THRESHOLDS = [
    0,     // Level 1 (start)
    100,   // Level 2
    300,   // Level 3
    650,   // Level 4
    1150,  // Level 5
    1850,  // Level 6
    2850,  // Level 7
    4250,  // Level 8
    6250,  // Level 9
    9250,  // Level 10
];

@Injectable()
export class UsersService implements OnModuleInit {
    private readonly logger = new Logger(UsersService.name);
    constructor(private readonly prisma: PrismaService) { }

    async onModuleInit() {
        // Seed achievements once at startup (updates rewards on existing ones)
        for (const def of ACHIEVEMENT_DEFS) {
            await this.prisma.achievement.upsert({
                where: { key: def.key },
                update: { reward: def.reward },
                create: {
                    key: def.key,
                    name: def.name,
                    description: def.description,
                    iconUrl: def.icon,
                    reward: def.reward,
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
            xp: user.xp,
            streakCurrent: user.streakCurrent,
            streakBest: user.streakBest,
            levelProgress,
        };
    }

    /**
     * Get level info for the XP progress bar
     */
    async getLevelInfo(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { xp: true, currentLevel: true },
        });
        if (!user) throw new NotFoundException('User not found');

        const level = user.currentLevel;
        const xp = user.xp;
        const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
        const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
        const xpInLevel = xp - currentThreshold;
        const xpNeeded = nextThreshold - currentThreshold;
        const isMaxLevel = level >= LEVEL_THRESHOLDS.length;

        return {
            level,
            xp,
            xpInLevel: isMaxLevel ? 0 : xpInLevel,
            xpNeeded: isMaxLevel ? 0 : xpNeeded,
            progress: isMaxLevel ? 100 : Math.min(100, Math.round((xpInLevel / xpNeeded) * 100)),
            isMaxLevel,
        };
    }

    /**
     * Add XP and check if level should increase
     */
    async addXpAndCheckLevel(userId: string, xpAmount: number): Promise<{ newLevel?: number; leveledUp: boolean }> {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { xp: { increment: xpAmount } },
            select: { xp: true, currentLevel: true },
        });

        // Check if we crossed a level threshold
        let newLevel = user.currentLevel;
        for (let i = user.currentLevel; i < LEVEL_THRESHOLDS.length; i++) {
            if (user.xp >= LEVEL_THRESHOLDS[i]) {
                newLevel = i + 1;
            } else {
                break;
            }
        }

        if (newLevel > user.currentLevel) {
            await this.prisma.user.update({
                where: { id: userId },
                data: { currentLevel: newLevel },
            });
            this.logger.log(`User ${userId} leveled up to ${newLevel}!`);
            return { newLevel, leveledUp: true };
        }

        return { leveledUp: false };
    }

    /**
     * Check and unlock any earned achievements, award coins
     */
    async checkAndUnlockAchievements(userId: string): Promise<string[]> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                gamesPlayed: true,
                gamesWon: true,
                streakCurrent: true,
                currentLevel: true,
                wallet: { select: { id: true } },
                achievements: { select: { achievement: { select: { key: true } } } },
            },
        });
        if (!user || !user.wallet) return [];

        const alreadyUnlocked = new Set(user.achievements.map(a => a.achievement.key));
        const unlocked: string[] = [];

        // Criteria map
        const criteria: Record<string, boolean> = {
            first_win: user.gamesWon >= 1,
            win_5: user.gamesWon >= 5,
            win_20: user.gamesWon >= 20,
            win_50: user.gamesWon >= 50,
            streak_3: user.streakCurrent >= 3,
            streak_5: user.streakCurrent >= 5,
            play_10: user.gamesPlayed >= 10,
            play_50: user.gamesPlayed >= 50,
            level_3: user.currentLevel >= 3,
            level_5: user.currentLevel >= 5,
        };

        for (const [key, met] of Object.entries(criteria)) {
            if (met && !alreadyUnlocked.has(key)) {
                const achievement = await this.prisma.achievement.findUnique({ where: { key } });
                if (!achievement) continue;

                await this.prisma.$transaction([
                    this.prisma.userAchievement.create({
                        data: { userId, achievementId: achievement.id },
                    }),
                    ...(achievement.reward > 0 ? [
                        this.prisma.wallet.update({
                            where: { userId },
                            data: { balanceVirtual: { increment: achievement.reward } },
                        }),
                        this.prisma.transaction.create({
                            data: {
                                walletId: user.wallet.id,
                                type: TransactionType.ACHIEVEMENT_REWARD,
                                amount: achievement.reward,
                                currencyType: CurrencyType.VIRTUAL,
                                description: `🏅 Logro: ${achievement.name} (+${achievement.reward} monedas)`,
                            },
                        }),
                    ] : []),
                ]);

                unlocked.push(key);
                this.logger.log(`Achievement unlocked: ${key} for user ${userId} (+${achievement.reward} coins)`);
            }
        }

        return unlocked;
    }

    /**
     * Post-match progression: XP + achievements (called from GameService)
     */
    async postMatchProgression(userId: string, result: 'WIN' | 'DRAW' | 'LOSS') {
        const xpMap = { WIN: 30, DRAW: 10, LOSS: 5 };
        const xp = xpMap[result];

        const levelResult = await this.addXpAndCheckLevel(userId, xp);
        const unlockedAchievements = await this.checkAndUnlockAchievements(userId);

        // If leveled up, check level-based achievements again
        if (levelResult.leveledUp) {
            const extraAchievements = await this.checkAndUnlockAchievements(userId);
            unlockedAchievements.push(...extraAchievements);
        }

        return {
            xpGained: xp,
            leveledUp: levelResult.leveledUp,
            newLevel: levelResult.newLevel,
            unlockedAchievements,
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

    async getEloHistory(userId: string) {
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

        const currentElo = user?.eloRating ?? 1000;
        const history: { date: string; elo: number }[] = [];
        let elo = currentElo;

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
            if (iWon) elo -= 16;
            else if (isDraw) elo -= 0;
            else elo += 16;
        }

        return history;
    }

    async getAchievements(userId: string) {
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
            reward: a.reward,
            unlocked: a.users.length > 0,
            unlockedAt: a.users[0]?.unlockedAt ?? null,
        }));
    }
}
