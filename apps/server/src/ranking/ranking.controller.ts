import { Controller, Get, Param, Query } from '@nestjs/common';
import { RankingService } from './ranking.service';

@Controller('ranking')
export class RankingController {
    constructor(private readonly rankingService: RankingService) { }

    @Get('global')
    async getGlobalLeaderboard(@Query('limit') limit?: string) {
        return this.rankingService.getGlobalLeaderboard(limit ? parseInt(limit) : 100);
    }

    @Get('country/:country')
    async getCountryLeaderboard(
        @Param('country') country: string,
        @Query('limit') limit?: string,
    ) {
        return this.rankingService.getCountryLeaderboard(country, limit ? parseInt(limit) : 100);
    }

    @Get('top-winners')
    async getTopWinners(@Query('limit') limit?: string) {
        return this.rankingService.getTopWinners(limit ? parseInt(limit) : 100);
    }
}
