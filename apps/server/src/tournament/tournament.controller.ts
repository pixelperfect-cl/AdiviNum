import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { TournamentService } from './tournament.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('tournament')
export class TournamentController {
    constructor(private readonly tournamentService: TournamentService) { }

    @Get()
    async listTournaments(@Query('status') status?: string) {
        return this.tournamentService.listTournaments(status);
    }

    @Get(':id')
    async getTournament(@Param('id') id: string) {
        return this.tournamentService.getTournament(id);
    }

    @Post()
    @UseGuards(SupabaseAuthGuard)
    async createTournament(@Body() body: any) {
        return this.tournamentService.createTournament(body);
    }

    @Post(':id/register')
    @UseGuards(SupabaseAuthGuard)
    async registerForTournament(
        @Param('id') tournamentId: string,
        @Body() body: { userId: string },
    ) {
        return this.tournamentService.registerPlayer(tournamentId, body.userId);
    }

    @Post(':id/start')
    @UseGuards(SupabaseAuthGuard)
    async startTournament(@Param('id') tournamentId: string) {
        return this.tournamentService.startTournament(tournamentId);
    }

    @Post(':id/result')
    @UseGuards(SupabaseAuthGuard)
    async recordResult(@Param('id') tournamentId: string, @Body() body: any) {
        return this.tournamentService.recordMatchResult(
            tournamentId,
            body.roundNumber,
            body.matchIndex,
            body.winnerId,
        );
    }
}
