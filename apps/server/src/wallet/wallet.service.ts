import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrencyType, TransactionType } from '@prisma/client';

@Injectable()
export class WalletService {
    private readonly logger = new Logger(WalletService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get wallet for a user
     */
    async getWallet(userId: string) {
        const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) throw new BadRequestException('Wallet not found');
        return wallet;
    }

    /**
     * Check if a user (by firebaseUid) has enough balance for a bet
     */
    async hasBalance(firebaseUid: string, amount: number, currencyType: CurrencyType): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { supabaseUid: firebaseUid },
            include: { wallet: true },
        });
        if (!user?.wallet) return false;
        const field = currencyType === CurrencyType.FIAT ? 'balanceFiat' : 'balanceVirtual';
        return user.wallet[field] >= amount;
    }

    /**
     * Hold a bet amount (deduct from available balance)
     */
    async holdBet(userId: string, amount: number, currencyType: CurrencyType) {
        const wallet = await this.getWallet(userId);
        const field = currencyType === CurrencyType.FIAT ? 'balanceFiat' : 'balanceVirtual';

        if (wallet[field] < amount) {
            throw new BadRequestException('Saldo insuficiente para esta apuesta');
        }

        await this.prisma.$transaction([
            this.prisma.wallet.update({
                where: { userId },
                data: { [field]: { decrement: amount } },
            }),
            this.prisma.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: TransactionType.BET_HOLD,
                    amount,
                    currencyType,
                    description: `Reserva apuesta $${amount}`,
                },
            }),
        ]);

        this.logger.log(`Bet held: ${userId} - $${amount} ${currencyType}`);
    }

    /**
     * Settle a win — credit the winner
     */
    async settleWin(userId: string, prize: number, currencyType: CurrencyType, matchId: string) {
        const wallet = await this.getWallet(userId);
        const field = currencyType === CurrencyType.FIAT ? 'balanceFiat' : 'balanceVirtual';

        await this.prisma.$transaction([
            this.prisma.wallet.update({
                where: { userId },
                data: { [field]: { increment: prize } },
            }),
            this.prisma.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: TransactionType.WINNINGS,
                    amount: prize,
                    currencyType,
                    matchId,
                    description: `Premio: $${prize}`,
                },
            }),
        ]);

        this.logger.log(`Win settled: ${userId} + $${prize} ${currencyType}`);
    }

    /**
     * Settle a draw — both lose 50% of bet
     */
    async settleDraw(
        playerAId: string,
        playerBId: string,
        betAmount: number,
        currencyType: CurrencyType,
    ) {
        // In a draw, both already had their bet held.
        // They each get 50% back. The other 50% is the platform's "draw profit."
        const refund = Math.floor(betAmount * 0.5);
        const field = currencyType === CurrencyType.FIAT ? 'balanceFiat' : 'balanceVirtual';

        const walletA = await this.getWallet(playerAId);
        const walletB = await this.getWallet(playerBId);

        await this.prisma.$transaction([
            this.prisma.wallet.update({
                where: { userId: playerAId },
                data: { [field]: { increment: refund } },
            }),
            this.prisma.transaction.create({
                data: {
                    walletId: walletA.id,
                    type: TransactionType.BET_RELEASE,
                    amount: refund,
                    currencyType,
                    description: `Reembolso parcial por empate: $${refund}`,
                },
            }),
            this.prisma.wallet.update({
                where: { userId: playerBId },
                data: { [field]: { increment: refund } },
            }),
            this.prisma.transaction.create({
                data: {
                    walletId: walletB.id,
                    type: TransactionType.BET_RELEASE,
                    amount: refund,
                    currencyType,
                    description: `Reembolso parcial por empate: $${refund}`,
                },
            }),
        ]);

        this.logger.log(`Draw settled: both players refunded $${refund}`);
    }

    /**
     * Refund a held bet (full amount, no commission) — used for cancelled matches
     */
    async refundBet(userId: string, amount: number, currencyType: CurrencyType) {
        const wallet = await this.getWallet(userId);
        const field = currencyType === CurrencyType.FIAT ? 'balanceFiat' : 'balanceVirtual';

        await this.prisma.$transaction([
            this.prisma.wallet.update({
                where: { userId },
                data: { [field]: { increment: amount } },
            }),
            this.prisma.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: TransactionType.BET_RELEASE,
                    amount,
                    currencyType,
                    description: `Reembolso por partida cancelada: $${amount}`,
                },
            }),
        ]);

        this.logger.log(`Bet refunded: ${userId} + $${amount} ${currencyType}`);
    }

    /**
     * Deposit funds (from payment gateway)
     */
    async deposit(userId: string, amount: number, currencyType: CurrencyType) {
        const wallet = await this.getWallet(userId);
        const field = currencyType === CurrencyType.FIAT ? 'balanceFiat' : 'balanceVirtual';

        await this.prisma.$transaction([
            this.prisma.wallet.update({
                where: { userId },
                data: { [field]: { increment: amount } },
            }),
            this.prisma.transaction.create({
                data: {
                    walletId: wallet.id,
                    type: TransactionType.DEPOSIT,
                    amount,
                    currencyType,
                    description: `Depósito: $${amount}`,
                },
            }),
        ]);
    }

    /**
     * Get transaction history
     */
    async getTransactions(userId: string, limit = 50) {
        const wallet = await this.getWallet(userId);
        return this.prisma.transaction.findMany({
            where: { walletId: wallet.id },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
}
