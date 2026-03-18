import { Injectable, Logger } from '@nestjs/common';
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
import { GameService } from './game.service';
import { MatchmakingService } from './matchmaking.service';
import { WalletService } from '../wallet/wallet.service';
import { GameEvent, getLevelConfig } from '@adivinum/shared';
import { CurrencyType } from '@prisma/client';

@WebSocketGateway({
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
    },
    namespace: '/game',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(GameGateway.name);
    // Map socket.id -> { userId (firebaseUid), matchId }
    private connections = new Map<string, { userId: string; matchId?: string }>();
    // Map firebaseUid -> socketId
    private userSockets = new Map<string, string>();
    // Secret-set timers: matchId -> timeout (auto-forfeit if secrets not set in time)
    private secretTimers = new Map<string, NodeJS.Timeout>();
    // Disconnection grace timers: matchId:userId -> timeout
    private disconnectTimers = new Map<string, NodeJS.Timeout>();

    private readonly SECRET_TIMEOUT_MS = 30_000;   // 30s to set secret
    private readonly RECONNECT_GRACE_MS = 30_000;   // 30s to reconnect

    constructor(
        private readonly gameService: GameService,
        private readonly matchmaking: MatchmakingService,
        private readonly wallet: WalletService,
    ) { }

    handleConnection(client: Socket) {
        const userId = client.handshake.auth?.userId;
        if (!userId) {
            this.logger.warn('Connection rejected: no userId in auth');
            client.disconnect();
            return;
        }

        // If this user already has an active connection, transfer matchId
        const existingSocketId = this.userSockets.get(userId);
        if (existingSocketId && existingSocketId !== client.id) {
            const existingConn = this.connections.get(existingSocketId);
            if (existingConn?.matchId) {
                this.logger.log(`Transferring matchId ${existingConn.matchId} from old socket ${existingSocketId} to new socket ${client.id}`);
                this.connections.set(client.id, { userId, matchId: existingConn.matchId });
            } else {
                this.connections.set(client.id, { userId });
            }
            // Clean up old connection entry (but don't trigger disconnect logic)
            this.connections.delete(existingSocketId);
        } else {
            this.connections.set(client.id, { userId });
        }

        this.userSockets.set(userId, client.id);
        this.logger.log(`Player connected: ${userId} (socket: ${client.id})`);

        // Check if this user has a pending reconnect timer
        for (const [key, timer] of this.disconnectTimers) {
            if (key.endsWith(`:${userId}`)) {
                const matchId = key.split(':')[0];
                clearTimeout(timer);
                this.disconnectTimers.delete(key);
                this.logger.log(`Player ${userId} reconnected to match ${matchId}`);

                // Restore matchId to connection
                const conn = this.connections.get(client.id);
                if (conn) conn.matchId = matchId;

                // Send full game state to reconnected player
                const matchState = this.gameService.getActiveMatch(matchId);
                if (matchState) {
                    client.emit(GameEvent.RECONNECT_STATE, {
                        matchId,
                        level: matchState.level,
                        betAmount: matchState.betAmount,
                        currentTurn: matchState.currentTurn,
                        attemptsA: matchState.attemptsA,
                        attemptsB: matchState.attemptsB,
                        timeRemainingA: matchState.timeRemainingA,
                        timeRemainingB: matchState.timeRemainingB,
                    });

                    // Notify opponent that player reconnected
                    const player = this.gameService.getPlayerRole(matchId, userId);
                    const opponentRole = player === 'A' ? 'B' : 'A';
                    const opponentUid = this.gameService.getFirebaseUid(matchId, opponentRole);
                    if (opponentUid) {
                        const opponentSocketId = this.userSockets.get(opponentUid);
                        if (opponentSocketId) {
                            this.server.to(opponentSocketId).emit(GameEvent.OPPONENT_RECONNECTED, { matchId });
                        }
                    }
                }
                break;
            }
        }
    }

    handleDisconnect(client: Socket) {
        const conn = this.connections.get(client.id);
        if (!conn) return;

        // Only process if this is still the active socket for this user
        const currentSocketId = this.userSockets.get(conn.userId);
        if (currentSocketId === client.id) {
            // Remove from matchmaking queue
            this.matchmaking.leaveQueue(conn.userId);

            // Handle active match — start grace period instead of immediate abandon
            if (conn.matchId) {
                const player = this.gameService.getPlayerRole(conn.matchId, conn.userId);
                if (player) {
                    const matchId = conn.matchId;
                    const userId = conn.userId;
                    const timerKey = `${matchId}:${userId}`;

                    // Notify opponent
                    const opponentRole = player === 'A' ? 'B' : 'A';
                    const opponentUid = this.gameService.getFirebaseUid(matchId, opponentRole);
                    if (opponentUid) {
                        const opponentSocketId = this.userSockets.get(opponentUid);
                        if (opponentSocketId) {
                            this.server.to(opponentSocketId).emit(GameEvent.RECONNECT_COUNTDOWN, {
                                matchId,
                                seconds: this.RECONNECT_GRACE_MS / 1000,
                            });
                        }
                    }

                    // Start grace period timer
                    this.logger.log(`Starting ${this.RECONNECT_GRACE_MS / 1000}s grace period for ${userId} in match ${matchId}`);
                    const timer = setTimeout(async () => {
                        this.disconnectTimers.delete(timerKey);
                        this.logger.log(`Grace period expired for ${userId} in match ${matchId} — abandoning`);
                        try {
                            const result = await this.gameService.handleDisconnect(matchId, player);
                            if (opponentUid) {
                                const sid = this.userSockets.get(opponentUid);
                                if (sid) {
                                    this.server.to(sid).emit(GameEvent.GAME_OVER, result);
                                }
                            }
                        } catch (e) {
                            this.logger.error(`Error handling disconnect abandon: ${e}`);
                        }
                    }, this.RECONNECT_GRACE_MS);

                    this.disconnectTimers.set(timerKey, timer);
                }
            }

            this.userSockets.delete(conn.userId);
        } else {
            this.logger.log(`Stale socket disconnected: ${client.id} (user ${conn.userId} already on ${currentSocketId})`);
        }

        this.connections.delete(client.id);
        this.logger.log(`Player disconnected: ${conn.userId} (socket: ${client.id})`);
    }

    @SubscribeMessage(GameEvent.JOIN_QUEUE)
    async handleJoinQueue(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { level: number; betAmount?: number; currencyType: CurrencyType },
    ) {
        const conn = this.connections.get(client.id);
        if (!conn) return;

        const config = getLevelConfig(data.level);
        // Use provided betAmount or default to the level's default
        const betAmount = data.betAmount ?? config.betAmountCLP;

        // Validate betAmount is a valid option for this level
        if (!config.betOptions.includes(betAmount)) {
            client.emit(GameEvent.ERROR, { message: `Apuesta inválida para nivel ${data.level}` });
            return;
        }

        this.logger.log(`Player ${conn.userId} joining queue: level=${data.level}, bet=${betAmount}, currency=${data.currencyType}`);

        try {
            // Pre-validate balance before entering queue
            try {
                const balanceOk = await this.wallet.hasBalance(
                    conn.userId, betAmount,
                    (data.currencyType || 'VIRTUAL').toUpperCase() as CurrencyType,
                );
                if (!balanceOk) {
                    client.emit(GameEvent.ERROR, { message: 'Saldo insuficiente para esta apuesta' });
                    return;
                }
            } catch {
                // If balance check fails (e.g. user not found), proceed anyway — holdBet will catch it
            }

            const opponent = await this.matchmaking.joinQueue(conn.userId, data.level, betAmount, data.currencyType);

            if (opponent) {
                // Match found! Create the match
                this.logger.log(`Creating match: ${opponent.userId} vs ${conn.userId}`);
                const { match, firstTurn, playerAName, playerBName, playerAAvatarUrl, playerBAvatarUrl } = await this.gameService.createMatch(
                    opponent.userId,
                    conn.userId,
                    data.level,
                    betAmount,
                    data.currencyType,
                );

                // Assign matchId to both players' connections
                const opponentSocketId = this.userSockets.get(opponent.userId);
                if (opponentSocketId) {
                    const connA = this.connections.get(opponentSocketId);
                    if (connA) connA.matchId = match.id;
                }
                conn.matchId = match.id;

                // Notify both players
                const matchData = {
                    matchId: match.id,
                    playerAId: opponent.userId,
                    playerBId: conn.userId,
                    playerAName,
                    playerBName,
                    playerAAvatarUrl,
                    playerBAvatarUrl,
                    level: data.level,
                    betAmount,
                    firstTurn,
                };

                if (opponentSocketId) {
                    this.server.to(opponentSocketId).emit(GameEvent.MATCH_FOUND, { ...matchData, you: 'A' });
                }
                client.emit(GameEvent.MATCH_FOUND, { ...matchData, you: 'B' });

                // Start secret timer — both players must set secret within time limit
                const secretTimeoutS = this.SECRET_TIMEOUT_MS / 1000;
                if (opponentSocketId) {
                    this.server.to(opponentSocketId).emit(GameEvent.SECRET_TIMER, { matchId: match.id, seconds: secretTimeoutS });
                }
                client.emit(GameEvent.SECRET_TIMER, { matchId: match.id, seconds: secretTimeoutS });

                const secretTimer = setTimeout(async () => {
                    this.secretTimers.delete(match.id);
                    if (!this.gameService.areBothSecretsSet(match.id)) {
                        this.logger.warn(`Secret timer expired for match ${match.id} — auto-forfeiting`);
                        try {
                            const result = await this.gameService.handleSecretTimeout(match.id);
                            if (result) {
                                const uA = this.gameService.getFirebaseUid(match.id, 'A');
                                const uB = this.gameService.getFirebaseUid(match.id, 'B');
                                if (uA) { const s = this.userSockets.get(uA); if (s) this.server.to(s).emit(GameEvent.GAME_OVER, result); }
                                if (uB) { const s = this.userSockets.get(uB); if (s) this.server.to(s).emit(GameEvent.GAME_OVER, result); }
                            }
                        } catch (e) {
                            this.logger.error(`Secret timeout handling error: ${e}`);
                        }
                    }
                }, this.SECRET_TIMEOUT_MS);

                this.secretTimers.set(match.id, secretTimer);

                this.logger.log(`Match created: ${match.id}`);
            } else {
                client.emit('queue_joined', { level: data.level, betAmount });
                this.logger.log(`Player ${conn.userId} waiting in queue`);
            }
        } catch (err: any) {
            this.logger.error(`Error in handleJoinQueue: ${err.message}`, err.stack);
            client.emit(GameEvent.ERROR, { message: err.message });
        }
    }

    @SubscribeMessage(GameEvent.LEAVE_QUEUE)
    handleLeaveQueue(@ConnectedSocket() client: Socket) {
        const conn = this.connections.get(client.id);
        if (!conn) return;
        this.matchmaking.leaveQueue(conn.userId);
    }

    @SubscribeMessage(GameEvent.SET_SECRET)
    handleSetSecret(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { matchId: string; secret: string },
    ) {
        const conn = this.connections.get(client.id);
        if (!conn) {
            this.logger.warn(`SET_SECRET: no connection for socket ${client.id}`);
            return;
        }

        this.logger.log(`SET_SECRET from ${conn.userId} for match ${data.matchId}`);

        const player = this.gameService.getPlayerRole(data.matchId, conn.userId);
        if (!player) {
            this.logger.warn(`SET_SECRET: player role not found for ${conn.userId} in match ${data.matchId}`);
            return client.emit(GameEvent.ERROR, { message: 'Match not found or wrong player' });
        }

        const success = this.gameService.setSecret(data.matchId, player, data.secret);
        if (!success) {
            return client.emit(GameEvent.ERROR, { message: 'Invalid secret number' });
        }

        this.logger.log(`Secret set by player ${player} in match ${data.matchId}`);

        // Check if both secrets set → start game
        if (this.gameService.areBothSecretsSet(data.matchId)) {
            // Clear secret timer
            const st = this.secretTimers.get(data.matchId);
            if (st) { clearTimeout(st); this.secretTimers.delete(data.matchId); }
            const updated = this.gameService.getActiveMatch(data.matchId)!;
            const startData = {
                matchId: data.matchId,
                currentTurn: updated.currentTurn,
                timeRemainingA: updated.timeRemainingA,
                timeRemainingB: updated.timeRemainingB,
            };

            this.logger.log(`Both secrets set! Starting game ${data.matchId}, first turn: ${updated.currentTurn}`);

            // Send to both players using firebaseUid
            const uidA = this.gameService.getFirebaseUid(data.matchId, 'A');
            const uidB = this.gameService.getFirebaseUid(data.matchId, 'B');

            const socketA = uidA ? this.userSockets.get(uidA) : null;
            const socketB = uidB ? this.userSockets.get(uidB) : null;

            this.logger.log(`Sending GAME_START: A(${uidA}) → socket ${socketA}, B(${uidB}) → socket ${socketB}`);

            if (socketA) this.server.to(socketA).emit(GameEvent.GAME_START, startData);
            if (socketB) this.server.to(socketB).emit(GameEvent.GAME_START, startData);
        }
    }

    @SubscribeMessage(GameEvent.MAKE_GUESS)
    async handleMakeGuess(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { matchId: string; guess: string },
    ) {
        const conn = this.connections.get(client.id);
        if (!conn) return;

        const player = this.gameService.getPlayerRole(data.matchId, conn.userId);
        if (!player) return client.emit(GameEvent.ERROR, { message: 'Match not found' });

        // Capture UIDs BEFORE processGuess (which may delete the match on game_over)
        const uidA = this.gameService.getFirebaseUid(data.matchId, 'A');
        const uidB = this.gameService.getFirebaseUid(data.matchId, 'B');

        try {
            const result = await this.gameService.processGuess(data.matchId, player, data.guess);

            // For game_over, endMatch includes firebaseUids in case the pre-captured ones failed
            const finalUidA = result.type === 'game_over' ? (result as any).firebaseUidA || uidA : uidA;
            const finalUidB = result.type === 'game_over' ? (result as any).firebaseUidB || uidB : uidB;

            const socketA = finalUidA ? this.userSockets.get(finalUidA) : null;
            const socketB = finalUidB ? this.userSockets.get(finalUidB) : null;

            this.logger.log(`Guess result: ${result.type} — sending to A(${finalUidA})→${socketA}, B(${finalUidB})→${socketB}`);

            if (result.type === 'game_over') {
                if (socketA) this.server.to(socketA).emit(GameEvent.GAME_OVER, result);
                if (socketB) this.server.to(socketB).emit(GameEvent.GAME_OVER, result);
                // Notify spectators
                this.server.to(`spectate:${data.matchId}`).emit(GameEvent.SPECTATE_GAME_OVER, result);
            } else {
                if (socketA) this.server.to(socketA).emit(GameEvent.TURN_RESULT, result);
                if (socketB) this.server.to(socketB).emit(GameEvent.TURN_RESULT, result);
                // Forward to spectators
                const spectatorState = this.gameService.getSpectatorState(data.matchId);
                this.server.to(`spectate:${data.matchId}`).emit(GameEvent.SPECTATE_UPDATE, {
                    matchId: data.matchId,
                    player,
                    guess: data.guess,
                    toques: result.toques,
                    famas: result.famas,
                    currentTurn: result.nextTurn,
                    timeRemainingA: result.timeRemainingA,
                    timeRemainingB: result.timeRemainingB,
                    attemptsA: spectatorState?.attemptsA ?? 0,
                    attemptsB: spectatorState?.attemptsB ?? 0,
                });
            }
        } catch (err: any) {
            client.emit(GameEvent.ERROR, { message: err.message });
        }
    }

    @SubscribeMessage(GameEvent.SURRENDER)
    async handleSurrender(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { matchId: string },
    ) {
        const conn = this.connections.get(client.id);
        if (!conn) return;

        // Capture UIDs BEFORE endMatch deletes the active match
        const uidA = this.gameService.getFirebaseUid(data.matchId, 'A');
        const uidB = this.gameService.getFirebaseUid(data.matchId, 'B');

        const player = this.gameService.getPlayerRole(data.matchId, conn.userId);
        if (!player) return;

        this.logger.log(`Player ${conn.userId} (${player}) surrendered match ${data.matchId}`);

        const result = await this.gameService.handleDisconnect(data.matchId, player);

        // Use pre-captured UIDs since match is now deleted
        const socketA = uidA ? this.userSockets.get(uidA) : null;
        const socketB = uidB ? this.userSockets.get(uidB) : null;
        if (socketA) this.server.to(socketA).emit(GameEvent.GAME_OVER, result);
        if (socketB) this.server.to(socketB).emit(GameEvent.GAME_OVER, result);
        // Notify spectators
        this.server.to(`spectate:${data.matchId}`).emit(GameEvent.SPECTATE_GAME_OVER, result);
    }

    // ---- Draw Offer Flow ----

    @SubscribeMessage(GameEvent.OFFER_DRAW)
    handleOfferDraw(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { matchId: string },
    ) {
        const conn = this.connections.get(client.id);
        if (!conn) return;

        const player = this.gameService.getPlayerRole(data.matchId, conn.userId);
        if (!player) return;

        const opponentRole = player === 'A' ? 'B' : 'A';
        const opponentUid = this.gameService.getFirebaseUid(data.matchId, opponentRole);

        this.logger.log(`Player ${conn.userId} (${player}) offered draw in match ${data.matchId}`);

        if (opponentUid) {
            const opponentSocketId = this.userSockets.get(opponentUid);
            if (opponentSocketId) {
                this.server.to(opponentSocketId).emit(GameEvent.DRAW_OFFERED, {
                    matchId: data.matchId,
                    offeredBy: player,
                });
            }
        }
    }

    @SubscribeMessage(GameEvent.RESPOND_DRAW)
    async handleRespondDraw(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { matchId: string; accepted: boolean },
    ) {
        const conn = this.connections.get(client.id);
        if (!conn) return;

        const player = this.gameService.getPlayerRole(data.matchId, conn.userId);
        if (!player) return;

        if (data.accepted) {
            this.logger.log(`Draw accepted by ${conn.userId} (${player}) in match ${data.matchId}`);

            // Capture UIDs before endMatch
            const uidA = this.gameService.getFirebaseUid(data.matchId, 'A');
            const uidB = this.gameService.getFirebaseUid(data.matchId, 'B');

            const result = await this.gameService.endMatchAsDraw(data.matchId);

            const socketA = uidA ? this.userSockets.get(uidA) : null;
            const socketB = uidB ? this.userSockets.get(uidB) : null;
            if (socketA) this.server.to(socketA).emit(GameEvent.GAME_OVER, result);
            if (socketB) this.server.to(socketB).emit(GameEvent.GAME_OVER, result);
        } else {
            this.logger.log(`Draw declined by ${conn.userId} (${player}) in match ${data.matchId}`);

            // Notify the player who offered that the draw was declined
            const opponentRole = player === 'A' ? 'B' : 'A';
            const opponentUid = this.gameService.getFirebaseUid(data.matchId, opponentRole);
            if (opponentUid) {
                const opponentSocketId = this.userSockets.get(opponentUid);
                if (opponentSocketId) {
                    this.server.to(opponentSocketId).emit(GameEvent.DRAW_DECLINED, {
                        matchId: data.matchId,
                    });
                }
            }
        }
    }

    // ---- In-Game Chat ----

    private chatCooldowns = new Map<string, number>(); // socketId -> last chat timestamp

    @SubscribeMessage(GameEvent.SEND_CHAT)
    handleSendChat(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { matchId: string; message: string },
    ) {
        const conn = this.connections.get(client.id);
        if (!conn) return;

        // Validate message
        const msg = (data.message || '').trim();
        if (!msg || msg.length > 100) return;

        // Cooldown check (1 second for text)
        const now = Date.now();
        const lastChat = this.chatCooldowns.get(client.id) || 0;
        if (now - lastChat < 1000) return;
        this.chatCooldowns.set(client.id, now);

        const player = this.gameService.getPlayerRole(data.matchId, conn.userId);
        if (!player) return;

        const opponentRole = player === 'A' ? 'B' : 'A';
        const opponentUid = this.gameService.getFirebaseUid(data.matchId, opponentRole);

        if (opponentUid) {
            const opponentSocketId = this.userSockets.get(opponentUid);
            if (opponentSocketId) {
                this.server.to(opponentSocketId).emit(GameEvent.CHAT_MESSAGE, {
                    message: msg,
                    from: player,
                });
            }
        }
    }

    // ---- Rematch ----

    // Map requesterUid -> { opponentUid, level, betAmount, currencyType }
    private pendingRematches = new Map<string, { opponentUid: string; level: number; betAmount: number; currencyType: CurrencyType }>();

    @SubscribeMessage(GameEvent.REQUEST_REMATCH)
    handleRequestRematch(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { opponentUid: string; level: number; betAmount: number; currencyType: string },
    ) {
        const conn = this.connections.get(client.id);
        if (!conn) return;

        const myUid = conn.userId;
        const currencyType = (data.currencyType || 'VIRTUAL').toUpperCase() as CurrencyType;

        // Store pending rematch
        this.pendingRematches.set(myUid, {
            opponentUid: data.opponentUid,
            level: data.level,
            betAmount: data.betAmount,
            currencyType,
        });

        this.logger.log(`Rematch requested: ${myUid} -> ${data.opponentUid}`);

        // Notify opponent
        const opponentSocketId = this.userSockets.get(data.opponentUid);
        if (opponentSocketId) {
            this.server.to(opponentSocketId).emit(GameEvent.REMATCH_OFFERED, {
                fromUid: myUid,
                level: data.level,
            });
        }
    }

    @SubscribeMessage(GameEvent.RESPOND_REMATCH)
    async handleRespondRematch(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { requesterUid: string; accepted: boolean },
    ) {
        const conn = this.connections.get(client.id);
        if (!conn) return;

        const pending = this.pendingRematches.get(data.requesterUid);
        if (!pending || pending.opponentUid !== conn.userId) return;

        this.pendingRematches.delete(data.requesterUid);

        if (!data.accepted) {
            // Decline
            const requesterSocketId = this.userSockets.get(data.requesterUid);
            if (requesterSocketId) {
                this.server.to(requesterSocketId).emit(GameEvent.REMATCH_DECLINED, {});
            }
            return;
        }

        // Accept — create a new match directly
        this.logger.log(`Rematch accepted between ${data.requesterUid} and ${conn.userId}`);

        try {
            const { match, firstTurn, playerAName, playerBName, playerAAvatarUrl, playerBAvatarUrl } = await this.gameService.createMatch(
                data.requesterUid,
                conn.userId,
                pending.level,
                pending.betAmount,
                pending.currencyType,
            );

            const matchData = {
                matchId: match.id,
                playerAId: data.requesterUid,
                playerBId: conn.userId,
                playerAName,
                playerBName,
                playerAAvatarUrl,
                playerBAvatarUrl,
                level: pending.level,
                betAmount: pending.betAmount,
                firstTurn,
            };

            // Set matchId on both connections
            const requesterSocketId = this.userSockets.get(data.requesterUid);
            if (requesterSocketId) {
                const rConn = this.connections.get(requesterSocketId);
                if (rConn) rConn.matchId = match.id;
                this.server.to(requesterSocketId).emit(GameEvent.MATCH_FOUND, {
                    ...matchData,
                    you: 'A',
                });
            }

            const accepterSocketId = this.userSockets.get(conn.userId);
            if (accepterSocketId) {
                const aConn = this.connections.get(accepterSocketId);
                if (aConn) aConn.matchId = match.id;
                this.server.to(accepterSocketId).emit(GameEvent.MATCH_FOUND, {
                    ...matchData,
                    you: 'B',
                });
            }
        } catch (err) {
            this.logger.error('Rematch failed:', err);
            // Notify both of error
            const requesterSocketId = this.userSockets.get(data.requesterUid);
            if (requesterSocketId) {
                this.server.to(requesterSocketId).emit(GameEvent.ERROR, { message: 'Rematch failed' });
            }
            client.emit(GameEvent.ERROR, { message: 'Rematch failed' });
        }
    }

    // ---- Spectator Mode ----

    @SubscribeMessage(GameEvent.LIST_MATCHES)
    handleListMatches(@ConnectedSocket() client: Socket) {
        const matches = this.gameService.getActiveMatchesList();
        client.emit(GameEvent.ACTIVE_MATCHES, { matches });
    }

    @SubscribeMessage(GameEvent.SPECTATE_MATCH)
    handleSpectateMatch(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { matchId: string },
    ) {
        const state = this.gameService.getSpectatorState(data.matchId);
        if (!state) {
            client.emit(GameEvent.ERROR, { message: 'Match not found or not started yet' });
            return;
        }

        // Join the spectate room
        client.join(`spectate:${data.matchId}`);
        this.logger.log(`Spectator ${client.id} joined spectate:${data.matchId}`);

        // Send current state
        client.emit(GameEvent.SPECTATE_STATE, state);
    }

    @SubscribeMessage(GameEvent.LEAVE_SPECTATE)
    handleLeaveSpectate(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { matchId: string },
    ) {
        client.leave(`spectate:${data.matchId}`);
        this.logger.log(`Spectator ${client.id} left spectate:${data.matchId}`);
    }

    // ---- Direct Challenge (#11) ----

    // Map: challengeId -> { challengerId, targetId, level, betAmount, currencyType }
    private pendingChallenges = new Map<string, {
        challengerId: string;
        targetId: string;
        level: number;
        betAmount: number;
        currencyType: CurrencyType;
    }>();

    @SubscribeMessage(GameEvent.SEND_CHALLENGE)
    async handleSendChallenge(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { targetUserId: string; level: number; betAmount: number; currencyType: string },
    ) {
        const conn = this.connections.get(client.id);
        if (!conn) return;

        const challengerId = conn.userId;
        const targetId = data.targetUserId;

        // Check if target is online
        const targetSocketId = this.userSockets.get(targetId);
        if (!targetSocketId) {
            client.emit(GameEvent.ERROR, 'El jugador no está conectado');
            return;
        }

        // Check if target is already in a match
        const targetConn = this.connections.get(targetSocketId);
        if (targetConn?.matchId) {
            client.emit(GameEvent.ERROR, 'El jugador está en una partida');
            return;
        }

        // Look up usernames for UI
        const challengerUser = await this.gameService.getUserBySupabaseUid(challengerId);
        if (!challengerUser) return;

        const challengeId = `challenge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const currencyType = data.currencyType === 'VIRTUAL' ? CurrencyType.VIRTUAL : CurrencyType.FIAT;

        this.pendingChallenges.set(challengeId, {
            challengerId,
            targetId,
            level: data.level,
            betAmount: data.betAmount,
            currencyType,
        });

        // Auto-expire challenge after 30 seconds
        setTimeout(() => {
            if (this.pendingChallenges.has(challengeId)) {
                this.pendingChallenges.delete(challengeId);
                client.emit(GameEvent.CHALLENGE_DECLINED, { challengeId, reason: 'timeout' });
            }
        }, 30_000);

        // Send challenge to target
        this.server.to(targetSocketId).emit(GameEvent.CHALLENGE_RECEIVED, {
            challengeId,
            challengerName: challengerUser.username,
            challengerElo: challengerUser.eloRating,
            level: data.level,
            betAmount: data.betAmount,
            currencyType: data.currencyType,
        });

        this.logger.log(`Challenge sent: ${challengerId} -> ${targetId} (level ${data.level})`);
    }

    @SubscribeMessage(GameEvent.RESPOND_CHALLENGE)
    async handleRespondChallenge(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { challengeId: string; accepted: boolean },
    ) {
        const challenge = this.pendingChallenges.get(data.challengeId);
        if (!challenge) {
            client.emit(GameEvent.ERROR, 'Desafío expirado o no encontrado');
            return;
        }

        this.pendingChallenges.delete(data.challengeId);

        const challengerSocketId = this.userSockets.get(challenge.challengerId);

        if (!data.accepted) {
            // Decline — notify challenger
            if (challengerSocketId) {
                this.server.to(challengerSocketId).emit(GameEvent.CHALLENGE_DECLINED, {
                    challengeId: data.challengeId,
                    reason: 'declined',
                });
            }
            return;
        }

        // Accepted — create the match!
        const levelConfig = getLevelConfig(challenge.level);
        if (!levelConfig) {
            client.emit(GameEvent.ERROR, 'Nivel inválido');
            return;
        }

        try {
            const { match, usernameA, usernameB, avatarA, avatarB } = await this.gameService.createMatch(
                challenge.challengerId,
                challenge.targetId,
                challenge.level,
                challenge.betAmount,
                challenge.currencyType,
            );

            // Notify both players with MATCH_FOUND
            const matchData = {
                matchId: match.id,
                playerAId: match.playerAId,
                playerBId: match.playerBId,
                playerAName: usernameA,
                playerBName: usernameB,
                playerAAvatarUrl: avatarA,
                playerBAvatarUrl: avatarB,
                level: match.level,
                betAmount: match.betAmount,
                firstTurn: match.firstTurn,
            };

            if (challengerSocketId) {
                const challengerConn = this.connections.get(challengerSocketId);
                if (challengerConn) challengerConn.matchId = match.id;
                this.server.to(challengerSocketId).emit(GameEvent.MATCH_FOUND, {
                    ...matchData,
                    you: match.playerAId === challenge.challengerId ? 'A' : 'B',
                });
            }

            const targetConn = this.connections.get(client.id);
            if (targetConn) targetConn.matchId = match.id;
            client.emit(GameEvent.MATCH_FOUND, {
                ...matchData,
                you: match.playerAId === challenge.targetId ? 'A' : 'B',
            });

            // Start secret timer
            this.startSecretTimer(match.id, levelConfig);

            this.logger.log(`Challenge accepted — match ${match.id} created!`);
        } catch (err: any) {
            client.emit(GameEvent.ERROR, err.message || 'Error al crear partida');
            if (challengerSocketId) {
                this.server.to(challengerSocketId).emit(GameEvent.ERROR, err.message || 'Error al crear partida');
            }
        }
    }
}
