import { Module, Global, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({
    providers: [
        {
            provide: 'REDIS_CLIENT',
            useFactory: async (configService: ConfigService) => {
                const logger = new Logger('RedisModule');
                const Redis = (await import('ioredis')).default;
                const client = new Redis({
                    host: configService.get('REDIS_HOST', 'localhost'),
                    port: configService.get<number>('REDIS_PORT', 6379),
                    maxRetriesPerRequest: 3,
                    lazyConnect: true,
                    retryStrategy: (times: number) => {
                        if (times > 3) {
                            logger.warn('Redis unavailable — matchmaking disabled. Server continues without Redis.');
                            return null; // Stop retrying
                        }
                        return Math.min(times * 200, 2000);
                    },
                });

                client.on('connect', () => logger.log('✅ Redis connected'));
                client.on('error', (err: Error) => logger.warn(`⚠️ Redis: ${err.message}`));

                // Try to connect but don't crash if it fails
                try {
                    await client.connect();
                } catch {
                    logger.warn('⚠️ Redis not available — server starting without Redis');
                }

                return client;
            },
            inject: [ConfigService],
        },
        RedisService,
    ],
    exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule { }

