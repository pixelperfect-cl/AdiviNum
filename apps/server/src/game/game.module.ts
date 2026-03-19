import { Module, forwardRef } from '@nestjs/common';
import { GameEngineService } from './game-engine.service';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { MatchmakingService } from './matchmaking.service';
import { WalletModule } from '../wallet/wallet.module';
import { RankingModule } from '../ranking/ranking.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [WalletModule, RankingModule, UsersModule],
    providers: [GameEngineService, GameService, GameGateway, MatchmakingService],
    exports: [GameService],
})
export class GameModule { }
