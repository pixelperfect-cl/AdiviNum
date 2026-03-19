import { Controller, Get, Patch, Body, Param, Req, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(SupabaseAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me/matches')
    @SkipThrottle()
    async getMyMatches(@Req() req: any) {
        const supabaseUid = req.user.uid;
        const user = await this.usersService.findBySupabaseUid(supabaseUid);
        if (!user) return [];
        return this.usersService.getMatchHistory(user.id);
    }

    @Get('me/matches/:matchId')
    @SkipThrottle()
    async getMatchDetail(@Req() req: any, @Param('matchId') matchId: string) {
        const supabaseUid = req.user.uid;
        const user = await this.usersService.findBySupabaseUid(supabaseUid);
        if (!user) return null;
        return this.usersService.getMatchDetail(matchId, user.id);
    }

    @Get('me/elo-history')
    @SkipThrottle()
    async getEloHistory(@Req() req: any) {
        const supabaseUid = req.user.uid;
        const user = await this.usersService.findBySupabaseUid(supabaseUid);
        if (!user) return [];
        return this.usersService.getEloHistory(user.id);
    }

    @Get('me/achievements')
    @SkipThrottle()
    async getAchievements(@Req() req: any) {
        const supabaseUid = req.user.uid;
        const user = await this.usersService.findBySupabaseUid(supabaseUid);
        if (!user) return [];
        return this.usersService.getAchievements(user.id);
    }

    @Get('me/level-info')
    @SkipThrottle()
    async getLevelInfo(@Req() req: any) {
        const supabaseUid = req.user.uid;
        const user = await this.usersService.findBySupabaseUid(supabaseUid);
        if (!user) return null;
        return this.usersService.getLevelInfo(user.id);
    }

    @Get(':id')
    async getUser(@Param('id') id: string) {
        return this.usersService.findById(id);
    }

    @Get(':id/stats')
    async getUserStats(@Param('id') id: string) {
        return this.usersService.getStats(id);
    }

    @Patch('me')
    async updateMyProfile(
        @Req() req: any,
        @Body() body: UpdateUserDto,
    ) {
        const supabaseUid = req.user.uid;
        const user = await this.usersService.findBySupabaseUid(supabaseUid);
        if (!user) return null;
        return this.usersService.updateProfile(user.id, body);
    }

    @Patch(':id')
    async updateProfile(
        @Param('id') id: string,
        @Body() body: UpdateUserDto,
    ) {
        return this.usersService.updateProfile(id, body);
    }
}

