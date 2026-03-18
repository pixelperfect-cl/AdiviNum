import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
    constructor(@Inject('REDIS_CLIENT') private readonly client: Redis) { }

    getClient(): Redis {
        return this.client;
    }

    // ---- Queue operations ----

    async pushToQueue(key: string, value: string): Promise<void> {
        await this.client.rpush(key, value);
    }

    async popFromQueue(key: string): Promise<string | null> {
        return this.client.lpop(key);
    }

    async removeFromQueue(key: string, value: string): Promise<void> {
        await this.client.lrem(key, 0, value);
    }

    async getQueueLength(key: string): Promise<number> {
        return this.client.llen(key);
    }

    // ---- Key-Value ----

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (ttlSeconds) {
            await this.client.setex(key, ttlSeconds, value);
        } else {
            await this.client.set(key, value);
        }
    }

    async get(key: string): Promise<string | null> {
        return this.client.get(key);
    }

    async del(key: string): Promise<void> {
        await this.client.del(key);
    }

    // ---- Match state cache ----

    async setMatchState(matchId: string, state: object): Promise<void> {
        await this.client.setex(`match:${matchId}`, 3600, JSON.stringify(state));
    }

    async getMatchState(matchId: string): Promise<object | null> {
        const data = await this.client.get(`match:${matchId}`);
        return data ? JSON.parse(data) : null;
    }

    async deleteMatchState(matchId: string): Promise<void> {
        await this.client.del(`match:${matchId}`);
    }

    // ---- Online players ----

    async setPlayerOnline(userId: string, socketId: string): Promise<void> {
        await this.client.setex(`online:${userId}`, 300, socketId);
    }

    async getPlayerSocket(userId: string): Promise<string | null> {
        return this.client.get(`online:${userId}`);
    }

    async removePlayerOnline(userId: string): Promise<void> {
        await this.client.del(`online:${userId}`);
    }
}
