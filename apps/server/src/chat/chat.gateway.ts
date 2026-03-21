import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChatEvent } from '@adivinum/shared';

@WebSocketGateway({
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
    },
    namespace: '/chat',
})
@Injectable()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(ChatGateway.name);

    // userId -> socketId
    private userSockets = new Map<string, string>();
    // socketId -> userId
    private socketUsers = new Map<string, string>();
    // Rate limiting: socketId -> last message timestamp
    private rateLimits = new Map<string, number>();

    constructor(
        private readonly chatService: ChatService,
        private readonly prisma: PrismaService,
    ) {}

    async onModuleInit() {
        await this.chatService.ensureDefaultRooms();
    }

    handleConnection(client: Socket) {
        const userId = client.handshake.auth?.userId;
        if (!userId) {
            client.disconnect();
            return;
        }

        this.userSockets.set(userId, client.id);
        this.socketUsers.set(client.id, userId);
        this.logger.log(`Chat connected: ${userId} (${client.id})`);
    }

    handleDisconnect(client: Socket) {
        const userId = this.socketUsers.get(client.id);
        if (userId) {
            this.userSockets.delete(userId);
            this.socketUsers.delete(client.id);
            this.rateLimits.delete(client.id);
            this.logger.log(`Chat disconnected: ${userId}`);
        }
    }

    private getUserId(client: Socket): string | null {
        return this.socketUsers.get(client.id) || null;
    }

    private async resolveInternalId(supabaseUid: string): Promise<string | null> {
        const user = await this.prisma.user.findUnique({
            where: { supabaseUid },
            select: { id: true },
        });
        return user?.id || null;
    }

    private checkRateLimit(socketId: string): boolean {
        const now = Date.now();
        const last = this.rateLimits.get(socketId) || 0;
        if (now - last < 1000) return false; // 1 msg/sec
        this.rateLimits.set(socketId, now);
        return true;
    }

    /* ── Direct Messages ── */

    @SubscribeMessage(ChatEvent.DM_SEND)
    async handleDMSend(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { receiverId: string; content: string },
    ) {
        const supabaseUid = this.getUserId(client);
        if (!supabaseUid) return;
        if (!this.checkRateLimit(client.id)) return;

        const senderId = await this.resolveInternalId(supabaseUid);
        if (!senderId) return;

        try {
            const message = await this.chatService.sendDM(senderId, data.receiverId, data.content);

            // Send to sender (confirmation)
            client.emit(ChatEvent.DM_NEW, message);

            // Send to receiver if online
            // Find receiver's supabaseUid
            const receiver = await this.prisma.user.findUnique({
                where: { id: data.receiverId },
                select: { supabaseUid: true },
            });
            if (receiver?.supabaseUid) {
                const receiverSocketId = this.userSockets.get(receiver.supabaseUid);
                if (receiverSocketId) {
                    this.server.to(receiverSocketId).emit(ChatEvent.DM_NEW, message);
                }
            }
        } catch (err: any) {
            client.emit('error', { message: err.message });
        }
    }

    @SubscribeMessage(ChatEvent.DM_HISTORY)
    async handleDMHistory(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { otherUserId: string; cursor?: string },
    ) {
        const supabaseUid = this.getUserId(client);
        if (!supabaseUid) return;

        const userId = await this.resolveInternalId(supabaseUid);
        if (!userId) return;

        const messages = await this.chatService.getDMHistory(userId, data.otherUserId, data.cursor);
        client.emit(ChatEvent.DM_HISTORY, { otherUserId: data.otherUserId, messages });
    }

    @SubscribeMessage(ChatEvent.DM_TYPING)
    async handleDMTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { receiverId: string },
    ) {
        const supabaseUid = this.getUserId(client);
        if (!supabaseUid) return;

        const senderId = await this.resolveInternalId(supabaseUid);
        if (!senderId) return;

        // Find receiver's socket
        const receiver = await this.prisma.user.findUnique({
            where: { id: data.receiverId },
            select: { supabaseUid: true },
        });
        if (receiver?.supabaseUid) {
            const receiverSocketId = this.userSockets.get(receiver.supabaseUid);
            if (receiverSocketId) {
                this.server.to(receiverSocketId).emit(ChatEvent.DM_TYPING_INDICATOR, {
                    senderId,
                });
            }
        }
    }

    /* ── Chat Rooms ── */

    @SubscribeMessage(ChatEvent.ROOM_JOIN)
    async handleRoomJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string },
    ) {
        const supabaseUid = this.getUserId(client);
        if (!supabaseUid) return;

        const userId = await this.resolveInternalId(supabaseUid);
        if (!userId) return;

        try {
            const result = await this.chatService.joinRoom(userId, data.roomId);
            client.join(`room:${data.roomId}`);
            client.emit(ChatEvent.ROOM_JOINED, result);

            // Broadcast member count update
            const count = await this.chatService.getRoomMemberCount(data.roomId);
            this.server.to(`room:${data.roomId}`).emit(ChatEvent.ROOM_MEMBER_COUNT, {
                roomId: data.roomId,
                count,
            });
        } catch (err: any) {
            client.emit('error', { message: err.message });
        }
    }

    @SubscribeMessage(ChatEvent.ROOM_LEAVE)
    async handleRoomLeave(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string },
    ) {
        const supabaseUid = this.getUserId(client);
        if (!supabaseUid) return;

        const userId = await this.resolveInternalId(supabaseUid);
        if (!userId) return;

        await this.chatService.leaveRoom(userId, data.roomId);
        client.leave(`room:${data.roomId}`);
        client.emit(ChatEvent.ROOM_LEFT, { roomId: data.roomId });

        const count = await this.chatService.getRoomMemberCount(data.roomId);
        this.server.to(`room:${data.roomId}`).emit(ChatEvent.ROOM_MEMBER_COUNT, {
            roomId: data.roomId,
            count,
        });
    }

    @SubscribeMessage(ChatEvent.ROOM_SEND)
    async handleRoomSend(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; content: string },
    ) {
        const supabaseUid = this.getUserId(client);
        if (!supabaseUid) return;
        if (!this.checkRateLimit(client.id)) return;

        const userId = await this.resolveInternalId(supabaseUid);
        if (!userId) return;

        try {
            const message = await this.chatService.sendRoomMessage(userId, data.roomId, data.content);
            // Broadcast to all room members
            this.server.to(`room:${data.roomId}`).emit(ChatEvent.ROOM_MESSAGE, message);
        } catch (err: any) {
            client.emit('error', { message: err.message });
        }
    }

    @SubscribeMessage(ChatEvent.ROOM_HISTORY)
    async handleRoomHistory(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { roomId: string; cursor?: string },
    ) {
        const messages = await this.chatService.getRoomHistory(data.roomId, data.cursor);
        client.emit(ChatEvent.ROOM_HISTORY, { roomId: data.roomId, messages });
    }
}
