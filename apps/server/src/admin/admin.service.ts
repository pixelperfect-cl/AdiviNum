import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get platform-wide statistics
     */
    async getDashboardStats() {
        const [totalUsers, activeMatches, totalMatches, revenueData] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.match.count({ where: { status: 'IN_PROGRESS' } }),
            this.prisma.match.count({ where: { status: 'FINISHED' } }),
            this.prisma.transaction.aggregate({
                where: { type: 'COMMISSION' },
                _sum: { amount: true },
            }),
        ]);

        return {
            totalUsers,
            activeMatches,
            totalMatches,
            totalRevenue: revenueData._sum.amount || 0,
        };
    }

    /**
     * Get all users with pagination (includes wallet summary)
     */
    async getUsers(page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    currentLevel: true,
                    eloRating: true,
                    gamesPlayed: true,
                    gamesWon: true,
                    xp: true,
                    isPremium: true,
                    isBanned: true,
                    createdAt: true,
                    wallet: {
                        select: {
                            balanceFiat: true,
                            balanceVirtual: true,
                            balanceSavings: true,
                        },
                    },
                },
            }),
            this.prisma.user.count(),
        ]);

        return { users, total, page, totalPages: Math.ceil(total / limit) };
    }

    /**
     * Ban / Unban a user
     */
    async toggleBan(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { isBanned: !user.isBanned },
        });

        this.logger.log(`User ${userId} ${updated.isBanned ? 'BANNED' : 'UNBANNED'}`);
        return updated;
    }

    /**
     * Adjust a user's wallet balance (admin manual credit/debit)
     */
    async adjustWallet(userId: string, amount: number, currencyType: 'FIAT' | 'VIRTUAL', reason: string) {
        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) throw new NotFoundException('Wallet not found for this user');

        const absAmount = Math.abs(amount);
        const isCredit = amount > 0;
        const balanceField = currencyType === 'FIAT' ? 'balanceFiat' : 'balanceVirtual';

        // For debits, check sufficient balance
        if (!isCredit && wallet[balanceField] < absAmount) {
            throw new BadRequestException(`Saldo insuficiente. Saldo actual: ${wallet[balanceField]}`);
        }

        const [updatedWallet] = await this.prisma.$transaction([
            this.prisma.wallet.update({
                where: { userId },
                data: {
                    [balanceField]: isCredit
                        ? { increment: absAmount }
                        : { decrement: absAmount },
                },
            }),
            this.prisma.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: isCredit ? 'GIFT_RECEIVED' : 'WITHDRAWAL',
                    amount: absAmount,
                    currencyType,
                    description: `[ADMIN] ${reason}`,
                },
            }),
        ]);

        this.logger.log(`Admin wallet adjust: user=${userId} amount=${amount} currency=${currencyType} reason="${reason}"`);
        return updatedWallet;
    }

    /**
     * Set user level (and optionally reset XP + level progress)
     */
    async updateLevel(userId: string, level: number, resetXp: boolean) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        if (level < 1 || level > 100) throw new BadRequestException('Level must be between 1 and 100');

        const updateData: any = { currentLevel: level };
        if (resetXp) {
            updateData.xp = 0;
        }

        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
        });

        // If resetting, also clear level progress records
        if (resetXp) {
            await this.prisma.levelProgress.deleteMany({ where: { userId } });
        }

        this.logger.log(`Admin level update: user=${userId} level=${level} resetXp=${resetXp}`);
        return updated;
    }

    /**
     * Update user config (premium status, etc.)
     */
    async updateUserConfig(userId: string, data: { isPremium?: boolean }) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(data.isPremium !== undefined && { isPremium: data.isPremium }),
            },
        });

        this.logger.log(`Admin config update: user=${userId} isPremium=${data.isPremium}`);
        return updated;
    }

    /**
     * Get match history with filters
     */
    async getMatches(page = 1, limit = 50, status?: string) {
        const skip = (page - 1) * limit;
        const where = status ? { status: status as any } : {};

        const [matches, total] = await Promise.all([
            this.prisma.match.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    playerA: { select: { username: true } },
                    playerB: { select: { username: true } },
                },
            }),
            this.prisma.match.count({ where }),
        ]);

        return { matches, total, page, totalPages: Math.ceil(total / limit) };
    }

    /**
     * Get pending withdrawal requests
     */
    async getPendingWithdrawals() {
        return this.prisma.transaction.findMany({
            where: { type: 'WITHDRAWAL' },
            orderBy: { createdAt: 'desc' },
            include: {
                wallet: {
                    include: {
                        user: { select: { id: true, username: true, email: true } },
                    },
                },
            },
        });
    }

    async approveWithdrawal(transactionId: string) {
        const tx = await this.prisma.transaction.findUnique({ where: { id: transactionId } });
        if (!tx) throw new NotFoundException('Transaction not found');
        if (tx.status === 'APPROVED') throw new BadRequestException('Already approved');

        const updated = await this.prisma.transaction.update({
            where: { id: transactionId },
            data: { status: 'APPROVED' },
        });

        this.logger.log(`Withdrawal ${transactionId} APPROVED`);
        return updated;
    }

    async rejectWithdrawal(transactionId: string) {
        const tx = await this.prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { wallet: true },
        });
        if (!tx) throw new NotFoundException('Transaction not found');
        if (tx.status === 'REJECTED') throw new BadRequestException('Already rejected');

        // Refund the amount back to the user's wallet
        await this.prisma.$transaction([
            this.prisma.transaction.update({
                where: { id: transactionId },
                data: { status: 'REJECTED' },
            }),
            this.prisma.wallet.update({
                where: { id: tx.walletId },
                data: { balanceFiat: { increment: tx.amount } },
            }),
        ]);

        this.logger.log(`Withdrawal ${transactionId} REJECTED — refunded ${tx.amount} to wallet ${tx.walletId}`);
        return { status: 'REJECTED', refunded: tx.amount };
    }

    // ===================== ACHIEVEMENTS =====================

    async getAchievements() {
        return this.prisma.achievement.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: { select: { users: true } },
            },
        });
    }

    async createAchievement(data: { key: string; name: string; description: string; reward: number }) {
        return this.prisma.achievement.create({ data });
    }

    async updateAchievement(id: string, data: { name?: string; description?: string; reward?: number }) {
        return this.prisma.achievement.update({ where: { id }, data });
    }

    async deleteAchievement(id: string) {
        // Delete user-achievement links first
        await this.prisma.userAchievement.deleteMany({ where: { achievementId: id } });
        return this.prisma.achievement.delete({ where: { id } });
    }

    // ===================== SETTINGS =====================

    async getSettings() {
        const settings = await this.prisma.systemSetting.findMany();
        if (settings.length === 0) {
            // Seed defaults if empty
            const defaults = [
                { key: 'INITIAL_VIRTUAL_BALANCE', value: '10000', description: 'Monedas virtuales al registrarse' },
            ];
            for (const d of defaults) {
                await this.prisma.systemSetting.upsert({
                    where: { key: d.key },
                    update: {},
                    create: d,
                });
            }
            return this.prisma.systemSetting.findMany();
        }
        return settings;
    }

    async updateSetting(key: string, value: string) {
        return this.prisma.systemSetting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
    }
}
