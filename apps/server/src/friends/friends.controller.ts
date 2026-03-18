import { Controller, Get, Post, Delete, Param, Query, Req, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { FriendsService } from './friends.service';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('friends')
@UseGuards(SupabaseAuthGuard)
export class FriendsController {
    constructor(
        private readonly friendsService: FriendsService,
        private readonly prisma: PrismaService,
    ) { }

    /** Helper — resolve supabase UID to internal user ID */
    private async getUserId(req: any): Promise<string> {
        const user = await this.prisma.user.findUnique({
            where: { supabaseUid: req.user.uid },
            select: { id: true },
        });
        if (!user) throw new Error('User not found');
        return user.id;
    }

    @Get()
    @SkipThrottle()
    async listFriends(@Req() req: any) {
        const userId = await this.getUserId(req);
        return this.friendsService.listFriends(userId);
    }

    @Get('pending')
    @SkipThrottle()
    async listPending(@Req() req: any) {
        const userId = await this.getUserId(req);
        return this.friendsService.listPendingRequests(userId);
    }

    @Get('search')
    async searchUsers(@Req() req: any, @Query('q') query: string) {
        const userId = await this.getUserId(req);
        return this.friendsService.searchUsers(query || '', userId);
    }

    @Post('request/:receiverId')
    async sendRequest(@Req() req: any, @Param('receiverId') receiverId: string) {
        const userId = await this.getUserId(req);
        return this.friendsService.sendRequest(userId, receiverId);
    }

    @Post(':friendshipId/accept')
    async acceptRequest(@Req() req: any, @Param('friendshipId') friendshipId: string) {
        const userId = await this.getUserId(req);
        return this.friendsService.acceptRequest(userId, friendshipId);
    }

    @Post(':friendshipId/reject')
    async rejectRequest(@Req() req: any, @Param('friendshipId') friendshipId: string) {
        const userId = await this.getUserId(req);
        return this.friendsService.rejectRequest(userId, friendshipId);
    }

    @Delete(':friendshipId')
    async removeFriend(@Req() req: any, @Param('friendshipId') friendshipId: string) {
        const userId = await this.getUserId(req);
        return this.friendsService.removeFriend(userId, friendshipId);
    }
}
