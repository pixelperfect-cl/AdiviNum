import { Injectable, Logger } from '@nestjs/common';
import { CurrencyType } from '@prisma/client';
import { RedisService } from '../redis/redis.service';
import { LEVELS } from '@adivinum/shared';

interface QueueEntry {
    userId: string;
    level: number;
    betAmount: number;
    currencyType: CurrencyType;
    timeSeconds: number;
    totalRounds: number;
    joinedAt: number;
}

/**
 * Matchmaking queue with Redis support and in-memory fallback.
 * Falls back to in-memory when Redis is unavailable (dev without Docker).
 */
@Injectable()
export class MatchmakingService {
    private readonly logger = new Logger(MatchmakingService.name);
    // In-memory fallback queues
    private readonly memoryQueues = new Map<string, QueueEntry[]>();
    private useMemory = false;

    constructor(private readonly redis: RedisService) {
        // Check Redis availability on startup
        this.checkRedis();
    }

    private async checkRedis() {
        try {
            const client = this.redis.getClient();
            await client.ping();
            this.logger.log('Using Redis for matchmaking');
        } catch {
            this.useMemory = true;
            this.logger.warn('Redis unavailable — using in-memory matchmaking (dev mode)');
        }
    }

    private getQueueKey(level: number, betAmount: number, currencyType: CurrencyType, timeSeconds: number, totalRounds: number): string {
        return `queue:${level}:${betAmount}:${currencyType}:${timeSeconds}:${totalRounds}`;
    }

    /**
     * Add a player to the matchmaking queue.
     * Returns matched opponent if found, null if queued.
     */
    async joinQueue(userId: string, level: number, betAmount: number, currencyType: CurrencyType, timeSeconds: number, totalRounds: number = 1): Promise<QueueEntry | null> {
        const key = this.getQueueKey(level, betAmount, currencyType, timeSeconds, totalRounds);

        if (this.useMemory) {
            return this.joinQueueMemory(userId, key, level, betAmount, currencyType, timeSeconds, totalRounds);
        }

        try {
            return await this.joinQueueRedis(userId, key, level, betAmount, currencyType, timeSeconds, totalRounds);
        } catch {
            this.useMemory = true;
            this.logger.warn('Redis failed, switching to in-memory matchmaking');
            return this.joinQueueMemory(userId, key, level, betAmount, currencyType, timeSeconds, totalRounds);
        }
    }

    private joinQueueMemory(userId: string, key: string, level: number, betAmount: number, currencyType: CurrencyType, timeSeconds: number, totalRounds: number): QueueEntry | null {
        const queue = this.memoryQueues.get(key) || [];

        // Try to find an opponent
        const opponentIdx = queue.findIndex(e => e.userId !== userId);
        if (opponentIdx !== -1) {
            const opponent = queue.splice(opponentIdx, 1)[0];
            this.memoryQueues.set(key, queue);
            this.logger.log(`Match found (memory): ${opponent.userId} vs ${userId} at ${key}`);
            return opponent;
        }

        // No opponent, check if already in queue
        if (queue.some(e => e.userId === userId)) {
            return null;
        }

        // Add to queue
        queue.push({ userId, level, betAmount, currencyType, timeSeconds, totalRounds, joinedAt: Date.now() });
        this.memoryQueues.set(key, queue);
        this.logger.log(`Player ${userId} joined queue ${key} (memory, waiting)`);
        return null;
    }

    private async joinQueueRedis(userId: string, key: string, level: number, betAmount: number, currencyType: CurrencyType, timeSeconds: number, totalRounds: number): Promise<QueueEntry | null> {
        const existing = await this.redis.popFromQueue(key);

        if (existing) {
            const opponent: QueueEntry = JSON.parse(existing);
            if (opponent.userId === userId) {
                await this.redis.pushToQueue(key, existing);
                this.logger.warn(`Player ${userId} tried to match themselves`);
                return null;
            }
            this.logger.log(`Match found: ${opponent.userId} vs ${userId} at ${key}`);
            return opponent;
        }

        const entry: QueueEntry = { userId, level, betAmount, currencyType, timeSeconds, totalRounds, joinedAt: Date.now() };
        await this.redis.pushToQueue(key, JSON.stringify(entry));
        this.logger.log(`Player ${userId} joined queue ${key} (waiting)`);
        return null;
    }

    /**
     * Remove a player from all queues
     */
    async leaveQueue(userId: string): Promise<void> {
        if (this.useMemory) {
            for (const [key, queue] of this.memoryQueues) {
                const filtered = queue.filter(e => e.userId !== userId);
                if (filtered.length !== queue.length) {
                    this.memoryQueues.set(key, filtered);
                    this.logger.log(`Player ${userId} removed from queue ${key} (memory)`);
                }
            }
            return;
        }

        try {
            const currencies: CurrencyType[] = ['FIAT', 'VIRTUAL'];
            const timeOptions = [180, 300, 600];
            const roundOptions = [1, 3, 5];
            for (let level = 1; level <= 10; level++) {
                const config = LEVELS.find(l => l.level === level);
                if (!config) continue;
                for (const currency of currencies) {
                    for (const betAmount of config.betOptions) {
                        for (const timeSeconds of timeOptions) {
                            for (const rounds of roundOptions) {
                                const key = this.getQueueKey(level, betAmount, currency, timeSeconds, rounds);
                                const client = this.redis.getClient();
                                const entries = await client.lrange(key, 0, -1);
                                for (const entry of entries) {
                                    try {
                                        const parsed: QueueEntry = JSON.parse(entry);
                                        if (parsed.userId === userId) {
                                            await this.redis.removeFromQueue(key, entry);
                                            this.logger.log(`Player ${userId} removed from queue ${key}`);
                                        }
                                    } catch { }
                                }
                            }
                        }
                    }
                }
            }
        } catch {
            // Redis died mid-operation, switch to memory
            this.useMemory = true;
        }
    }

    async getQueueLength(level: number, betAmount: number, currencyType: CurrencyType, timeSeconds: number, totalRounds: number = 1): Promise<number> {
        const key = this.getQueueKey(level, betAmount, currencyType, timeSeconds, totalRounds);
        if (this.useMemory) {
            return (this.memoryQueues.get(key) || []).length;
        }
        return this.redis.getQueueLength(key);
    }

    async getTotalQueuedPlayers(): Promise<number> {
        let total = 0;
        const currencies: CurrencyType[] = ['FIAT', 'VIRTUAL'];
        const timeOptions = [180, 300, 600];
        const roundOptions = [1, 3, 5];
        for (let level = 1; level <= 10; level++) {
             const config = LEVELS.find(l => l.level === level);
             if (!config) continue;
            for (const currency of currencies) {
                for (const betAmount of config.betOptions) {
                    for (const timeSeconds of timeOptions) {
                        for (const rounds of roundOptions) {
                            total += await this.getQueueLength(level, betAmount, currency, timeSeconds, rounds);
                        }
                    }
                }
            }
        }
        return total;
    }
}
