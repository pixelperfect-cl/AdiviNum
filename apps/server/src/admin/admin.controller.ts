import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

// TODO: Add admin role guard
@Controller('admin')
@UseGuards(SupabaseAuthGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('dashboard')
    async getDashboard() {
        return this.adminService.getDashboardStats();
    }

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

    @Get('withdrawals')
    async getPendingWithdrawals() {
        return this.adminService.getPendingWithdrawals();
    }
}
