import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

// TODO: Add admin role guard
@Controller('admin')
@UseGuards(SupabaseAuthGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    // ===================== DASHBOARD =====================

    @Get('dashboard')
    async getDashboard() {
        return this.adminService.getDashboardStats();
    }

    // ===================== USERS =====================

    @Get('users')
    async getUsers(@Query('page') page?: string, @Query('limit') limit?: string) {
        return this.adminService.getUsers(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 50,
        );
    }

    @Post('users/:userId/ban')
    async toggleBan(@Param('userId') userId: string) {
        return this.adminService.toggleBan(userId);
    }

    @Post('users/:userId/unban')
    async unban(@Param('userId') userId: string) {
        return this.adminService.toggleBan(userId);
    }

    @Post('users/:userId/wallet')
    async adjustWallet(
        @Param('userId') userId: string,
        @Body() body: { amount: number; currencyType: 'FIAT' | 'VIRTUAL'; reason: string },
    ) {
        return this.adminService.adjustWallet(userId, body.amount, body.currencyType, body.reason);
    }

    @Post('users/:userId/level')
    async updateLevel(
        @Param('userId') userId: string,
        @Body() body: { level: number; resetXp?: boolean },
    ) {
        return this.adminService.updateLevel(userId, body.level, body.resetXp ?? false);
    }

    @Post('users/:userId/config')
    async updateUserConfig(
        @Param('userId') userId: string,
        @Body() body: { isPremium?: boolean },
    ) {
        return this.adminService.updateUserConfig(userId, body);
    }

    // ===================== MATCHES =====================

    @Get('matches')
    async getMatches(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: string,
    ) {
        return this.adminService.getMatches(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 50,
            status,
        );
    }

    // ===================== WITHDRAWALS =====================

    @Get('withdrawals')
    async getPendingWithdrawals() {
        return this.adminService.getPendingWithdrawals();
    }

    @Post('withdrawals/:id/approve')
    async approveWithdrawal(@Param('id') id: string) {
        return this.adminService.approveWithdrawal(id);
    }

    @Post('withdrawals/:id/reject')
    async rejectWithdrawal(@Param('id') id: string) {
        return this.adminService.rejectWithdrawal(id);
    }

    // ===================== ACHIEVEMENTS =====================

    @Get('achievements')
    async getAchievements() {
        return this.adminService.getAchievements();
    }

    @Post('achievements')
    async createAchievement(@Body() body: { key: string; name: string; description: string; reward: number }) {
        return this.adminService.createAchievement(body);
    }

    @Put('achievements/:id')
    async updateAchievement(
        @Param('id') id: string,
        @Body() body: { name?: string; description?: string; reward?: number },
    ) {
        return this.adminService.updateAchievement(id, body);
    }

    @Delete('achievements/:id')
    async deleteAchievement(@Param('id') id: string) {
        return this.adminService.deleteAchievement(id);
    }

    // ===================== SETTINGS =====================

    @Get('settings')
    async getSettings() {
        return this.adminService.getSettings();
    }

    @Put('settings/:key')
    async updateSetting(
        @Param('key') key: string,
        @Body() body: { value: string },
    ) {
        return this.adminService.updateSetting(key, body.value);
    }
}
