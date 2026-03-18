import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { GameModule } from './game/game.module';
import { WalletModule } from './wallet/wallet.module';
import { RankingModule } from './ranking/ranking.module';
import { PaymentModule } from './payment/payment.module';
import { ReferralModule } from './referral/referral.module';
import { AdminModule } from './admin/admin.module';
import { TournamentModule } from './tournament/tournament.module';
import { NotificationModule } from './notification/notification.module';
import { FriendsModule } from './friends/friends.module';
import { HealthController } from './health.controller';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        // Rate limiting: 60 requests per 60 seconds per IP
        ThrottlerModule.forRoot([{
            ttl: 60000,
            limit: 60,
        }]),
        PrismaModule,
        RedisModule,
        AuthModule,
        UsersModule,
        GameModule,
        WalletModule,
        RankingModule,
        PaymentModule,
        ReferralModule,
        AdminModule,
        TournamentModule,
        NotificationModule,
        FriendsModule,
    ],
    controllers: [HealthController],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
})
export class AppModule { }

