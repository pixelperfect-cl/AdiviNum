import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { CurrencyType } from '@prisma/client';

@Controller('wallet')
@UseGuards(SupabaseAuthGuard)
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @Get(':userId')
    async getWallet(@Param('userId') userId: string) {
        return this.walletService.getWallet(userId);
    }

    @Get(':userId/transactions')
    async getTransactions(@Param('userId') userId: string) {
        return this.walletService.getTransactions(userId);
    }

    @Post(':userId/deposit')
    async deposit(
        @Param('userId') userId: string,
        @Body() body: { amount: number; currencyType: CurrencyType },
    ) {
        await this.walletService.deposit(userId, body.amount, body.currencyType);
        return { success: true };
    }
}
