import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) {}



    /**
     * Register or get existing user from Supabase UID
     */
    async getOrCreateUser(supabaseUid: string, email: string, displayName?: string, avatarUrl?: string) {
        let user = await this.prisma.user.findUnique({
            where: { supabaseUid },
            include: { wallet: true },
        });

        if (!user) {
            user = await this.prisma.user.findUnique({
                where: { email },
                include: { wallet: true },
            });

            if (user) {
                // Link existing email user to Supabase UID + update avatar if available
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        supabaseUid,
                        ...(avatarUrl && !user.avatarUrl ? { avatarUrl } : {}),
                        ...(displayName && user.username.startsWith('player_') ? { username: displayName } : {}),
                    },
                    include: { wallet: true },
                });
            } else {
                // Read initial balance from SystemSetting (admin-configurable)
                let initialVirtualBalance = 10000;
                try {
                    const setting = await this.prisma.systemSetting.findUnique({
                        where: { key: 'INITIAL_VIRTUAL_BALANCE' },
                    });
                    if (setting?.value) {
                        initialVirtualBalance = parseInt(setting.value, 10) || 10000;
                    }
                } catch { /* table may not exist yet — use default */ }

                user = await this.prisma.user.create({
                data: {
                    supabaseUid,
                    email,
                    username: displayName || `player_${Date.now()}`,
                    avatarUrl: avatarUrl || null,
                    wallet: {
                        create: {
                            balanceFiat: 0,
                            balanceVirtual: initialVirtualBalance,
                            balanceSavings: 0,
                        },
                    },
                    levelProgress: {
                        create: {
                            level: 1,
                            unlocked: true,
                        },
                    },
                },
                include: { wallet: true },
            });
        }
        }

        return user;
    }
}
