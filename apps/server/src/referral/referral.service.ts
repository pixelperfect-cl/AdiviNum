import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CurrencyType } from '@prisma/client';

@Injectable()
export class ReferralService {
    private readonly logger = new Logger(ReferralService.name);

    // Referral bonus config
    private readonly REFERRAL_BONUS_VIRTUAL = 5000; // 5k coins for both
    private readonly FIAT_COMMISSION_PERCENT = 2;   // 2% of referred user's first deposit

    constructor(
        private readonly prisma: PrismaService,
        private readonly walletService: WalletService,
    ) { }

    /**
     * Generate a unique referral code for a user
     */
    async getOrCreateReferralCode(userId: string): Promise<string> {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new BadRequestException('User not found');

        if (user.referralCode) return user.referralCode;

        // Generate a unique code: first 4 chars of username + random 4 digits
        const base = (user.username || 'ADV').substring(0, 4).toUpperCase();
        const code = `${base}${Math.floor(1000 + Math.random() * 9000)}`;

        await this.prisma.user.update({
            where: { id: userId },
            data: { referralCode: code },
        });

        return code;
    }

    /**
     * Apply a referral code during registration
     */
    async applyReferralCode(referredUserId: string, code: string): Promise<boolean> {
        const referrer = await this.prisma.user.findFirst({
            where: { referralCode: code },
        });

        if (!referrer) {
            throw new BadRequestException('Código de referido no válido');
        }

        if (referrer.id === referredUserId) {
            throw new BadRequestException('No puedes usar tu propio código');
        }

        // Check if already referred
        const existing = await this.prisma.referral.findFirst({
            where: { referredUserId },
        });

        if (existing) {
            throw new BadRequestException('Ya tienes un referente');
        }

        // Create referral relationship
        await this.prisma.referral.create({
            data: {
                referrerId: referrer.id,
                referredUserId,
                status: 'ACTIVE',
            },
        });

        // Bonus: both get virtual coins
        await this.walletService.deposit(referrer.id, this.REFERRAL_BONUS_VIRTUAL, CurrencyType.VIRTUAL);
        await this.walletService.deposit(referredUserId, this.REFERRAL_BONUS_VIRTUAL, CurrencyType.VIRTUAL);

        this.logger.log(`Referral applied: ${referrer.id} → ${referredUserId} (both get ${this.REFERRAL_BONUS_VIRTUAL} coins)`);
        return true;
    }

    /**
     * Get referral stats for a user
     */
    async getReferralStats(userId: string) {
        const referrals = await this.prisma.referral.findMany({
            where: { referrerId: userId },
            include: {
                referredUser: {
                    select: { id: true, username: true, createdAt: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return {
            totalReferrals: referrals.length,
            referrals: referrals.map((r) => ({
                username: r.referredUser.username,
                joinedAt: r.createdAt,
                status: r.status,
                earnings: r.totalEarnings,
            })),
        };
    }
}
