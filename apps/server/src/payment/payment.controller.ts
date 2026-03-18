import { Controller, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { PaymentService, DepositRequest, WithdrawalRequest } from './payment.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @Post('deposit')
    @UseGuards(SupabaseAuthGuard)
    async createDeposit(@Body() body: DepositRequest) {
        return this.paymentService.createDeposit(body);
    }

    @Post('withdraw')
    @UseGuards(SupabaseAuthGuard)
    async requestWithdrawal(@Body() body: WithdrawalRequest) {
        return this.paymentService.requestWithdrawal(body);
    }

    /**
     * Webhooks — NO auth guard (called by payment gateways)
     */
    @Post('webhook/mercadopago')
    async mercadoPagoWebhook(@Body() payload: any) {
        await this.paymentService.handleWebhook('mercadopago', payload);
        return { received: true };
    }

    @Post('webhook/stripe')
    async stripeWebhook(@Body() payload: any) {
        await this.paymentService.handleWebhook('stripe', payload);
        return { received: true };
    }
}
