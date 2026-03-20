import { io, Socket } from 'socket.io-client';
import { WS_URL } from '@/constants/theme';
import { GameEvent } from '@adivinum/shared';
import { useGameStore } from '@/stores/gameStore';

let socket: Socket | null = null;

export function connectSocket(userId: string) {
    if (socket?.connected) return socket;

    socket = io(WS_URL, {
        auth: { userId },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    });

    const store = useGameStore.getState();

    socket.on('connect', () => {
        console.log('🔌 Connected to game server');
    });

    socket.on(GameEvent.MATCH_FOUND, (data) => {
        console.log('🎯 Match found!', data);
        store.setMatchData({
            matchId: data.matchId,
            myRole: data.you,
            opponentId: data.you === 'A' ? data.playerBId : data.playerAId,
            level: data.level,
        });
    });

    socket.on(GameEvent.GAME_START, (data) => {
        store.setPhase('playing');
        store.setCurrentTurn(data.currentTurn);
        store.setTimes(data.timeRemainingA, data.timeRemainingB);
    });

    socket.on(GameEvent.TURN_RESULT, (data) => {
        const state = useGameStore.getState();
        const attempt = {
            guess: data.guess,
            toques: data.toques,
            famas: data.famas,
            timestamp: Date.now(),
        };

        // Determine if this was my attempt or opponent's
        if (data.nextTurn === state.myRole) {
            // It was opponent's turn, now it's mine → this is opponent's attempt
            store.addOpponentAttempt(attempt);
        } else {
            // It was my turn, now it's opponent's → this is my attempt
            store.addMyAttempt(attempt);
        }

        store.setCurrentTurn(data.nextTurn);
        store.setTimes(data.timeRemainingA, data.timeRemainingB);
    });

    socket.on(GameEvent.GAME_OVER, (data) => {
        store.setGameOver(data.result, data.winnerId, data.winnerPrize || 0, data.winnerFirebaseUid);
    });

    socket.on(GameEvent.LAST_CHANCE, (_data) => {
        useGameStore.getState().setLastChance(true);
    });

    socket.on(GameEvent.ERROR, (data) => {
        console.error('🎮 Game error:', data.message);
    });

    socket.on('disconnect', () => {
        console.log('🔌 Disconnected from server');
    });

    return socket;
}

export function getSocket(): Socket | null {
    return socket;
}

export function joinQueue(level: number, currencyType: string) {
    socket?.emit(GameEvent.JOIN_QUEUE, { level, currencyType: currencyType.toUpperCase() });
    useGameStore.getState().setPhase('queue');
}

export function leaveQueue() {
    socket?.emit(GameEvent.LEAVE_QUEUE);
    useGameStore.getState().setPhase('idle');
}

export function setSecret(matchId: string, secret: string) {
    socket?.emit(GameEvent.SET_SECRET, { matchId, secret });
}

export function makeGuess(matchId: string, guess: string) {
    socket?.emit(GameEvent.MAKE_GUESS, { matchId, guess });
}

export function surrender(matchId: string) {
    socket?.emit(GameEvent.SURRENDER, { matchId });
}

export function disconnectSocket() {
    socket?.disconnect();
    socket = null;
}
