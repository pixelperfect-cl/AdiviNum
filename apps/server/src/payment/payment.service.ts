import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { CurrencyType } from '@prisma/client';

export interface DepositRequest {
    userId: string;
    amount: number; // in CLP
    gateway: 'mercadopago' | 'stripe';
    returnUrl?: string;
}

export interface WithdrawalRequest {
    userId: string;
    amount: number;
    bankName: string;
    accountNumber: string;
    accountType: 'corriente' | 'vista' | 'ahorro';
    rut: string;
}

export interface PaymentResult {
    success: boolean;
    transactionId?: string;
    checkoutUrl?: string;
    error?: string;
}

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);

    constructor(
        private readonly config: ConfigService,
        private readonly prisma: PrismaService,
        private readonly walletService: WalletService,
    ) { }

    /**
     * Create a deposit checkout session.
     * In production, this creates a MercadoPago or Stripe checkout URL.
     */
    async createDeposit(request: DepositRequest): Promise<PaymentResult> {
        const { userId, amount, gateway } = request;

        if (amount < 1000) {
            return { success: false, error: 'Monto mínimo: $1.000 CLP' };
        }

        if (amount > 500000) {
            return { success: false, error: 'Monto máximo: $500.000 CLP' };
        }

        this.logger.log(`Creating deposit: ${userId} - $${amount} via ${gateway}`);

        if (gateway === 'mercadopago') {
            return this.createMercadoPagoCheckout(userId, amount);
        } else {
            return this.createStripeCheckout(userId, amount);
        }
    }

    /**
     * Handle payment webhook callback (MercadoPago/Stripe)
     */
    async handleWebhook(gateway: string, payload: any): Promise<void> {
        this.logger.log(`Webhook received from ${gateway}`);

        // TODO: Validate webhook signature
        // TODO: Extract payment status, userId, amount from payload
        // TODO: If approved, call walletService.deposit()

        // Stub implementation
        const { userId, amount, status } = this.parseWebhookPayload(gateway, payload);

        if (status === 'approved') {
            await this.walletService.deposit(userId, amount, CurrencyType.FIAT);
            this.logger.log(`Deposit confirmed: ${userId} + $${amount}`);
        }
    }

    /**
     * Request a withdrawal
     */
    async requestWithdrawal(request: WithdrawalRequest): Promise<PaymentResult> {
        const { userId, amount } = request;

        if (amount < 5000) {
            return { success: false, error: 'Retiro mínimo: $5.000 CLP' };
        }

        // Check balance
        const wallet = await this.walletService.getWallet(userId);
        if (wallet.balanceFiat < amount) {
            return { success: false, error: 'Saldo insuficiente' };
        }

        this.logger.log(`Withdrawal requested: ${userId} - $${amount}`);

        // Create pending withdrawal record
        await this.prisma.transaction.create({
            data: {
                walletId: wallet.id,
                type: 'WITHDRAWAL',
                amount,
                currencyType: CurrencyType.FIAT,
                description: `Retiro solicitado: $${amount} → ${request.bankName}`,
                metadata: {
                    bankName: request.bankName,
                    accountNumber: request.accountNumber,
                    accountType: request.accountType,
                    rut: request.rut,
                    status: 'PENDING',
                },
            },
        });

        return { success: true, transactionId: 'pending' };
    }

    // ---- Private methods ----

    private async createMercadoPagoCheckout(userId: string, amount: number): Promise<PaymentResult> {
        const accessToken = this.config.get('MERCADOPAGO_ACCESS_TOKEN');

        if (!accessToken) {
            this.logger.warn('MercadoPago not configured — using dev mode');
            // Dev mode: auto-approve deposit
            await this.walletService.deposit(userId, amount, CurrencyType.FIAT);
            return { success: true, transactionId: `dev-mp-${Date.now()}` };
        }

        // TODO: Implement MercadoPago SDK integration
        // const mercadopago = require('mercadopago');
        // mercadopago.configure({ access_token: accessToken });
        // const preference = await mercadopago.preferences.create({ ... });
        // return { success: true, checkoutUrl: preference.body.init_point };

        return { success: false, error: 'MercadoPago integration pending' };
    }

    private async createStripeCheckout(userId: string, amount: number): Promise<PaymentResult> {
        const secretKey = this.config.get('STRIPE_SECRET_KEY');

        if (!secretKey) {
            this.logger.warn('Stripe not configured — using dev mode');
            await this.walletService.deposit(userId, amount, CurrencyType.FIAT);
            return { success: true, transactionId: `dev-stripe-${Date.now()}` };
        }

        // TODO: Implement Stripe SDK integration
        // const stripe = require('stripe')(secretKey);
        // const session = await stripe.checkout.sessions.create({ ... });
        // return { success: true, checkoutUrl: session.url };

        return { success: false, error: 'Stripe integration pending' };
    }

    private parseWebhookPayload(gateway: string, payload: any) {
        // TODO: Implement per-gateway webhook parsing
        return {
            userId: payload.external_reference || payload.metadata?.userId || '',
            amount: payload.transaction_amount || payload.amount_total || 0,
            status: payload.status || payload.payment_status || 'pending',
        };
    }
}
