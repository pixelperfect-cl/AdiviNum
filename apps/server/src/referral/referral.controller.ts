import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ReferralService } from './referral.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('referral')
@UseGuards(SupabaseAuthGuard)
export class ReferralController {
    constructor(private readonly referralService: ReferralService) { }

    @Get(':userId/code')
    async getReferralCode(@Param('userId') userId: string) {
        const code = await this.referralService.getOrCreateReferralCode(userId);
        return { code };
    }

    @Post('apply')
    async applyReferralCode(@Body() body: { userId: string; code: string }) {
        const applied = await this.referralService.applyReferralCode(body.userId, body.code);
        return { applied };
    }

    @Get(':userId/stats')
    async getReferralStats(@Param('userId') userId: string) {
        return this.referralService.getReferralStats(userId);
    }
}
