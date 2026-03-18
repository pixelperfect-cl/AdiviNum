import { Module } from '@nestjs/common';
import { TournamentService } from './tournament.service';
import { TournamentSchedulerService } from './tournament-scheduler.service';
import { TournamentController } from './tournament.controller';
import { WalletModule } from '../wallet/wallet.module';
import { NotificationModule } from '../notification/notification.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [WalletModule, NotificationModule, AuthModule],
    controllers: [TournamentController],
    providers: [TournamentService, TournamentSchedulerService],
    exports: [TournamentService],
})
export class TournamentModule { }

