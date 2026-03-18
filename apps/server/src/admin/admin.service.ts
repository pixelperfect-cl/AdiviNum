import { Injectable, Logger } from '@nestjs/common';
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
     * Get all users with pagination
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
                    isBanned: true,
                    createdAt: true,
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
        if (!user) throw new Error('User not found');

        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { isBanned: !user.isBanned },
        });

        this.logger.log(`User ${userId} ${updated.isBanned ? 'BANNED' : 'UNBANNED'}`);
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
            where: {
                type: 'WITHDRAWAL',
                // metadata contains status: PENDING — check via raw query or JSON filter
            },
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
}
