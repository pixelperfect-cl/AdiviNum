import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
    private readonly logger = new Logger(ChatService.name);

    constructor(private readonly prisma: PrismaService) {}

    /* ── Direct Messages ── */

    async sendDM(senderId: string, receiverId: string, content: string) {
        // Validate friendship exists
        const friendship = await this.prisma.friendship.findFirst({
            where: {
                status: 'ACCEPTED',
                OR: [
                    { senderId, receiverId },
                    { senderId: receiverId, receiverId: senderId },
                ],
            },
        });
        if (!friendship) {
            throw new Error('No puedes enviar mensajes a alguien que no es tu amigo');
        }

        // Validate content
        const trimmed = content.trim();
        if (!trimmed || trimmed.length > 500) {
            throw new Error('Mensaje inválido (máx 500 caracteres)');
        }

        const message = await this.prisma.chatMessage.create({
            data: {
                senderId,
                receiverId,
                content: trimmed,
            },
            include: {
                sender: { select: { id: true, username: true, avatarUrl: true } },
            },
        });

        return message;
    }

    async getDMHistory(userId: string, otherUserId: string, cursor?: string, limit = 50) {
        const messages = await this.prisma.chatMessage.findMany({
            where: {
                roomId: null,
                OR: [
                    { senderId: userId, receiverId: otherUserId },
                    { senderId: otherUserId, receiverId: userId },
                ],
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include: {
                sender: { select: { id: true, username: true, avatarUrl: true } },
            },
        });

        return messages.reverse(); // Return oldest first
    }

    async getConversations(userId: string) {
        // Get latest message per conversation partner
        const sent = await this.prisma.chatMessage.findMany({
            where: { senderId: userId, roomId: null },
            orderBy: { createdAt: 'desc' },
            distinct: ['receiverId'],
            take: 50,
            include: {
                receiver: { select: { id: true, username: true, avatarUrl: true, eloRating: true } },
            },
        });

        const received = await this.prisma.chatMessage.findMany({
            where: { receiverId: userId, roomId: null },
            orderBy: { createdAt: 'desc' },
            distinct: ['senderId'],
            take: 50,
            include: {
                sender: { select: { id: true, username: true, avatarUrl: true, eloRating: true } },
            },
        });

        // Merge and deduplicate, keeping the latest message per partner
        const convMap = new Map<string, any>();

        for (const msg of sent) {
            const partnerId = msg.receiverId!;
            if (!convMap.has(partnerId) || msg.createdAt > convMap.get(partnerId).lastMessage.createdAt) {
                convMap.set(partnerId, {
                    partner: msg.receiver,
                    lastMessage: { content: msg.content, createdAt: msg.createdAt, fromMe: true },
                });
            }
        }

        for (const msg of received) {
            const partnerId = msg.senderId;
            if (!convMap.has(partnerId) || msg.createdAt > convMap.get(partnerId).lastMessage.createdAt) {
                convMap.set(partnerId, {
                    partner: msg.sender,
                    lastMessage: { content: msg.content, createdAt: msg.createdAt, fromMe: false },
                });
            }
        }

        // Sort by latest message
        return Array.from(convMap.values())
            .sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());
    }

    /* ── Chat Rooms ── */

    async listRooms() {
        const rooms = await this.prisma.chatRoom.findMany({
            orderBy: { createdAt: 'asc' },
            include: {
                _count: { select: { members: true } },
            },
        });

        return rooms.map(r => ({
            id: r.id,
            name: r.name,
            description: r.description,
            iconEmoji: r.iconEmoji,
            isOfficial: r.isOfficial,
            maxMembers: r.maxMembers,
            memberCount: r._count.members,
        }));
    }

    async joinRoom(userId: string, roomId: string) {
        const room = await this.prisma.chatRoom.findUnique({
            where: { id: roomId },
            include: { _count: { select: { members: true } } },
        });
        if (!room) throw new Error('Sala no encontrada');
        if (room._count.members >= room.maxMembers) throw new Error('Sala llena');

        await this.prisma.chatRoomMember.upsert({
            where: { roomId_userId: { roomId, userId } },
            update: {},
            create: { roomId, userId },
        });

        return { roomId, name: room.name };
    }

    async leaveRoom(userId: string, roomId: string) {
        await this.prisma.chatRoomMember.deleteMany({
            where: { roomId, userId },
        });
    }

    async sendRoomMessage(senderId: string, roomId: string, content: string) {
        // Validate membership
        const member = await this.prisma.chatRoomMember.findUnique({
            where: { roomId_userId: { roomId, userId: senderId } },
        });
        if (!member) throw new Error('No eres miembro de esta sala');

        const trimmed = content.trim();
        if (!trimmed || trimmed.length > 500) {
            throw new Error('Mensaje inválido (máx 500 caracteres)');
        }

        const message = await this.prisma.chatMessage.create({
            data: {
                senderId,
                roomId,
                content: trimmed,
            },
            include: {
                sender: { select: { id: true, username: true, avatarUrl: true } },
            },
        });

        return message;
    }

    async getRoomHistory(roomId: string, cursor?: string, limit = 50) {
        const messages = await this.prisma.chatMessage.findMany({
            where: { roomId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
            include: {
                sender: { select: { id: true, username: true, avatarUrl: true } },
            },
        });

        return messages.reverse();
    }

    async getRoomMemberCount(roomId: string) {
        return this.prisma.chatRoomMember.count({ where: { roomId } });
    }

    /* ── Seed default rooms ── */

    async ensureDefaultRooms() {
        const defaults = [
            { name: 'General', description: 'Chat general de la comunidad', iconEmoji: '💬', isOfficial: true },
            { name: 'Estrategia', description: 'Comparte tus tácticas y trucos', iconEmoji: '🧠', isOfficial: true },
            { name: 'Novedades', description: 'Entérate de las últimas actualizaciones', iconEmoji: '📢', isOfficial: true },
        ];

        for (const room of defaults) {
            await this.prisma.chatRoom.upsert({
                where: { name: room.name },
                update: {},
                create: room,
            });
        }

        this.logger.log('Default chat rooms ensured');
    }
}
