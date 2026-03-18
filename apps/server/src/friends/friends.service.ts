import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FriendsService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Send a friend request from senderId to receiverId.
     */
    async sendRequest(senderId: string, receiverId: string) {
        if (senderId === receiverId) {
            throw new BadRequestException('No puedes enviarte una solicitud a ti mismo');
        }

        // Check if there's already a friendship in either direction
        const existing = await this.prisma.friendship.findFirst({
            where: {
                OR: [
                    { senderId, receiverId },
                    { senderId: receiverId, receiverId: senderId },
                ],
            },
        });

        if (existing) {
            if (existing.status === 'ACCEPTED') {
                throw new ConflictException('Ya son amigos');
            }
            if (existing.status === 'PENDING') {
                // If the other person already sent us a request, auto-accept
                if (existing.senderId === receiverId) {
                    return this.prisma.friendship.update({
                        where: { id: existing.id },
                        data: { status: 'ACCEPTED' },
                        include: { sender: { select: { id: true, username: true, avatarUrl: true } } },
                    });
                }
                throw new ConflictException('Ya enviaste una solicitud');
            }
            if (existing.status === 'BLOCKED') {
                throw new BadRequestException('No se puede enviar la solicitud');
            }
            // If REJECTED, allow resending — update status
            return this.prisma.friendship.update({
                where: { id: existing.id },
                data: { status: 'PENDING', senderId, receiverId },
                include: { receiver: { select: { id: true, username: true, avatarUrl: true } } },
            });
        }

        return this.prisma.friendship.create({
            data: { senderId, receiverId },
            include: { receiver: { select: { id: true, username: true, avatarUrl: true } } },
        });
    }

    /**
     * Accept a friend request.
     */
    async acceptRequest(userId: string, friendshipId: string) {
        const friendship = await this.prisma.friendship.findUnique({
            where: { id: friendshipId },
        });
        if (!friendship || friendship.receiverId !== userId) {
            throw new NotFoundException('Solicitud no encontrada');
        }
        if (friendship.status !== 'PENDING') {
            throw new BadRequestException('Esta solicitud ya fue procesada');
        }

        return this.prisma.friendship.update({
            where: { id: friendshipId },
            data: { status: 'ACCEPTED' },
            include: {
                sender: { select: { id: true, username: true, avatarUrl: true, eloRating: true } },
            },
        });
    }

    /**
     * Reject a friend request.
     */
    async rejectRequest(userId: string, friendshipId: string) {
        const friendship = await this.prisma.friendship.findUnique({
            where: { id: friendshipId },
        });
        if (!friendship || friendship.receiverId !== userId) {
            throw new NotFoundException('Solicitud no encontrada');
        }

        return this.prisma.friendship.update({
            where: { id: friendshipId },
            data: { status: 'REJECTED' },
        });
    }

    /**
     * Remove a friendship (unfriend).
     */
    async removeFriend(userId: string, friendshipId: string) {
        const friendship = await this.prisma.friendship.findUnique({
            where: { id: friendshipId },
        });
        if (!friendship) {
            throw new NotFoundException('Amistad no encontrada');
        }
        if (friendship.senderId !== userId && friendship.receiverId !== userId) {
            throw new NotFoundException('Amistad no encontrada');
        }

        await this.prisma.friendship.delete({ where: { id: friendshipId } });
        return { deleted: true };
    }

    /**
     * List accepted friends for a user.
     */
    async listFriends(userId: string) {
        const friendships = await this.prisma.friendship.findMany({
            where: {
                status: 'ACCEPTED',
                OR: [{ senderId: userId }, { receiverId: userId }],
            },
            include: {
                sender: { select: { id: true, username: true, avatarUrl: true, eloRating: true, gamesWon: true, gamesPlayed: true } },
                receiver: { select: { id: true, username: true, avatarUrl: true, eloRating: true, gamesWon: true, gamesPlayed: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });

        return friendships.map(f => ({
            friendshipId: f.id,
            friend: f.senderId === userId ? f.receiver : f.sender,
        }));
    }

    /**
     * List pending friend requests received by a user.
     */
    async listPendingRequests(userId: string) {
        const requests = await this.prisma.friendship.findMany({
            where: { receiverId: userId, status: 'PENDING' },
            include: {
                sender: { select: { id: true, username: true, avatarUrl: true, eloRating: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return requests.map(r => ({
            friendshipId: r.id,
            sender: r.sender,
            createdAt: r.createdAt,
        }));
    }

    /**
     * Search users by username (for adding friends).
     */
    async searchUsers(query: string, currentUserId: string) {
        if (query.length < 2) return [];

        return this.prisma.user.findMany({
            where: {
                username: { contains: query, mode: 'insensitive' },
                id: { not: currentUserId },
                isBanned: false,
            },
            select: { id: true, username: true, avatarUrl: true, eloRating: true },
            take: 10,
        });
    }
}
