import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SupabaseAuthGuard } from './supabase-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    /**
     * POST /auth/register
     * Called after Supabase client-side auth, creates user in our DB.
     */
    @Post('register')
    @UseGuards(SupabaseAuthGuard)
    async register(
        @Req() req: any,
        @Body() body: { username?: string },
    ) {
        const { uid, email } = req.user;
        const user = await this.authService.getOrCreateUser(uid, email, body.username);
        return { user };
    }

    /**
     * POST /auth/login
     * Verifies token and returns user profile.
     */
    @Post('login')
    @UseGuards(SupabaseAuthGuard)
    async login(@Req() req: any) {
        const { uid, email, displayName, avatarUrl } = req.user;
        const user = await this.authService.getOrCreateUser(uid, email, displayName, avatarUrl);
        const { wallet, ...userData } = user as any;
        return { user: userData, wallet };
    }
}
