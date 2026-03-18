import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface PushPayload {
    to: string; // Expo push token
    title: string;
    body: string;
    data?: Record<string, any>;
    sound?: string;
    channelId?: string;
}

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);
    private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Send push notification via Expo Push API
     */
    async sendPush(userId: string, title: string, body: string, data?: Record<string, any>) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { pushToken: true },
        });

        if (!user?.pushToken) {
            this.logger.warn(`No push token for user ${userId}`);
            return;
        }

        const payload: PushPayload = {
            to: user.pushToken,
            title,
            body,
            data,
            sound: 'default',
        };

        try {
            const response = await fetch(this.EXPO_PUSH_URL, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();
            this.logger.log(`Push sent to ${userId}: ${title}`);
            return result;
        } catch (error) {
            this.logger.error(`Push failed for ${userId}:`, error);
        }
    }

    /**
     * Send to multiple users
     */
    async sendBulkPush(userIds: string[], title: string, body: string, data?: Record<string, any>) {
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds }, pushToken: { not: null } },
            select: { pushToken: true },
        });

        const messages = users
            .filter((u) => u.pushToken)
            .map((u) => ({
                to: u.pushToken!,
                title,
                body,
                data,
                sound: 'default' as const,
            }));

        if (messages.length === 0) return;

        // Expo accepts batches of 100
        const chunks = this.chunkArray(messages, 100);
        for (const chunk of chunks) {
            try {
                await fetch(this.EXPO_PUSH_URL, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(chunk),
                });
            } catch (error) {
                this.logger.error('Bulk push failed:', error);
            }
        }
    }

    // ---- Pre-built notification templates ----

    async notifyMatchFound(userId: string, opponentName: string, level: number) {
        await this.sendPush(userId, '🎮 ¡Partida encontrada!', `vs ${opponentName} — Nivel ${level}`, {
            type: 'match_found',
        });
    }

    async notifyTurnReady(userId: string) {
        await this.sendPush(userId, '⏱️ ¡Es tu turno!', 'Tu rival ya adivinó, ahora te toca', {
            type: 'your_turn',
        });
    }

    async notifyMatchResult(userId: string, won: boolean, prize?: number) {
        if (won) {
            await this.sendPush(userId, '🏆 ¡Ganaste!', `Has ganado $${prize?.toLocaleString()}`, {
                type: 'match_result',
            });
        } else {
            await this.sendPush(userId, '😤 Partida terminada', 'Tu rival dedujo primero. ¡Revancha!', {
                type: 'match_result',
            });
        }
    }

    async notifyDepositConfirmed(userId: string, amount: number) {
        await this.sendPush(userId, '💰 Depósito confirmado', `$${amount.toLocaleString()} acreditados en tu billetera`, {
            type: 'deposit_confirmed',
        });
    }

    async notifyTournamentStart(userIds: string[], tournamentName: string) {
        await this.sendBulkPush(userIds, '🏟️ ¡Torneo comenzando!', `${tournamentName} está por empezar`, {
            type: 'tournament_start',
        });
    }

    async notifyFriendRequest(userId: string, senderName: string) {
        await this.sendPush(userId, '👥 Solicitud de amistad', `${senderName} quiere ser tu amigo`, {
            type: 'friend_request',
        });
    }

    async notifyFriendAccepted(userId: string, friendName: string) {
        await this.sendPush(userId, '🤝 ¡Amigo agregado!', `${friendName} aceptó tu solicitud`, {
            type: 'friend_accepted',
        });
    }

    async notifyChallengeReceived(userId: string, challengerName: string, level: number) {
        await this.sendPush(userId, '⚔️ ¡Te retan!', `${challengerName} te desafía en Nivel ${level}`, {
            type: 'challenge_received',
        });
    }

    async notifyLeaguePromotion(userId: string, leagueName: string) {
        await this.sendPush(userId, '🎉 ¡Ascenso!', `Has subido a la liga ${leagueName}`, {
            type: 'league_promotion',
        });
    }

    async notifyLeagueDemotion(userId: string, leagueName: string) {
        await this.sendPush(userId, '📉 Descenso', `Has bajado a la liga ${leagueName}`, {
            type: 'league_demotion',
        });
    }

    // ---- Save push token ----

    async savePushToken(userId: string, token: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: { pushToken: token },
        });
        this.logger.log(`Push token saved for user ${userId}`);
    }

    private chunkArray<T>(arr: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    }
}
