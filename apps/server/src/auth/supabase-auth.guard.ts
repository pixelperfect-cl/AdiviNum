import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
    private readonly logger = new Logger('AuthGuard');
    private readonly isDev: boolean;
    private supabase: SupabaseClient;

    constructor(private readonly config: ConfigService) {
        this.isDev = this.config.get('NODE_ENV') !== 'production';

        const supabaseUrl = this.config.get<string>('SUPABASE_URL');
        const supabaseKey = this.config.get<string>('SUPABASE_ANON_KEY');

        if (supabaseUrl && supabaseKey) {
            this.supabase = createClient(supabaseUrl, supabaseKey);
        } else {
            this.logger.warn('⚠️  Supabase credentials not configured — auth will use dev mode');
        }
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();

        // Dev mode: if a real Bearer token is present, validate it.
        // Otherwise, fall back to the dev-user bypass.
        if (this.isDev) {
            const authHeader = request.headers.authorization;

            if (authHeader && authHeader.startsWith('Bearer ') && this.supabase) {
                const token = authHeader.split('Bearer ')[1];
                try {
                    const { data: { user }, error } = await this.supabase.auth.getUser(token);
                    if (!error && user) {
                        const meta = user.user_metadata || {};
                        request.user = {
                            uid: user.id,
                            email: user.email,
                            displayName: meta.full_name || meta.name || null,
                            avatarUrl: meta.avatar_url || meta.picture || null,
                        };
                        return true;
                    }
                } catch {
                    // Token invalid, fall through to dev bypass
                }
            }

            const devUser = request.headers['x-dev-user'] || 'player';
            const uidMap: Record<string, string> = {
                player: 'dev-player-uid',
                admin: 'dev-admin-uid',
                player2: 'dev-player2-uid',
            };
            request.user = {
                uid: uidMap[devUser] || uidMap.player,
                email: `${devUser}@adivinum.com`,
            };
            return true;
        }

        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid authorization header');
        }

        const token = authHeader.split('Bearer ')[1];

        if (!this.supabase) {
           throw new UnauthorizedException('Supabase client not initialized');
        }

        try {
            const { data: { user }, error } = await this.supabase.auth.getUser(token);
            if (error || !user) {
                throw new UnauthorizedException('Invalid or expired token');
            }
            const meta = user.user_metadata || {};
            request.user = {
                uid: user.id,
                email: user.email,
                displayName: meta.full_name || meta.name || null,
                avatarUrl: meta.avatar_url || meta.picture || null,
            };
            return true;
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
