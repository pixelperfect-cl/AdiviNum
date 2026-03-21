import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ChatService } from './chat.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('chat')
@UseGuards(SupabaseAuthGuard)
export class ChatController {
    constructor(
        private readonly chatService: ChatService,
        private readonly prisma: PrismaService,
    ) {}

    private async getUserId(req: any): Promise<string> {
        const user = await this.prisma.user.findUnique({
            where: { supabaseUid: req.user.uid },
            select: { id: true },
        });
        if (!user) throw new Error('User not found');
        return user.id;
    }

    @Get('rooms')
    @SkipThrottle()
    async listRooms() {
        return this.chatService.listRooms();
    }

    @Get('conversations')
    @SkipThrottle()
    async listConversations(@Req() req: any) {
        const userId = await this.getUserId(req);
        return this.chatService.getConversations(userId);
    }

    @Get('rooms/:roomId/members/count')
    async getRoomMemberCount(@Param('roomId') roomId: string) {
        const count = await this.chatService.getRoomMemberCount(roomId);
        return { count };
    }
}
