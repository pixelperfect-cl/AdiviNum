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

    socket.on(GameEvent.LAST_CHANCE, (data: { matchId: string; message: string; role: 'attacker' | 'defender' }) => {
        useGameStore.getState().setLastChance(true, data.role);
    });

    socket.on(GameEvent.SECRET_TIMER, (data: { matchId: string; seconds: number }) => {
        console.log('🎮 Secret timer:', data.seconds, 's');
        useGameStore.getState().setSecretTimerSeconds(data.seconds);
    });

    socket.on(GameEvent.ROUND_OVER, (data: {
        matchId: string;
        roundNumber: number;
        roundResult: string;
        roundWinner: 'A' | 'B' | null;
        winsA: number;
        winsB: number;
        totalRounds: number;
    }) => {
        console.log('🎮 Round over!', data);
        const store = useGameStore.getState();
        const myRole = store.myRole;
        const myWins = myRole === 'A' ? data.winsA : data.winsB;
        const opponentWins = myRole === 'A' ? data.winsB : data.winsA;
        store.setRoundOver({
            currentRound: data.roundNumber + 1,
            myWins,
            opponentWins,
            totalRounds: data.totalRounds,
        });
    });

    socket.on(GameEvent.ERROR, (data) => {
        console.error('🎮 Game error:', data.message);
    });

    // Reconnect state — full game state restore
    socket.on(GameEvent.RECONNECT_STATE, (data: {
        matchId: string;
        level: number;
        betAmount: number;
        myRole: 'A' | 'B';
        opponentName: string;
        opponentId: string;
        mySecret: string;
        currentTurn: 'A' | 'B';
        myAttempts: { guess: string; toques: number; famas: number; timestamp: number }[];
        opponentAttempts: { guess: string; toques: number; famas: number; timestamp: number }[];
        timeRemainingA: number;
        timeRemainingB: number;
    }) => {
        console.log('🔌 Reconnect state received:', data);
        const gs = useGameStore.getState();

        // Restore match data
        gs.setMatchData({
            matchId: data.matchId,
            myRole: data.myRole,
            opponentId: data.opponentId,
            level: data.level,
        });

        // Restore secret
        gs.setSecret(data.mySecret);

        // Restore attempts
        for (const a of data.myAttempts) {
            gs.addMyAttempt(a);
        }
        for (const a of data.opponentAttempts) {
            gs.addOpponentAttempt(a);
        }

        // Set phase to playing and restore turn/times
        gs.setPhase('playing');
        gs.setCurrentTurn(data.currentTurn);
        gs.setTimes(data.timeRemainingA, data.timeRemainingB);
        gs.setOpponentDisconnected(false);

        // Navigate to game screen
        const { router } = require('expo-router');
        router.push(`/game/${data.matchId}`);
    });

    // Opponent disconnected — grace period countdown
    socket.on(GameEvent.RECONNECT_COUNTDOWN, (data: { matchId: string; seconds: number }) => {
        console.log('🔌 Opponent disconnected, grace period:', data.seconds, 's');
        const gs = useGameStore.getState();
        gs.setOpponentDisconnected(true);
        gs.setReconnectCountdown(data.seconds);
    });

    // Opponent reconnected
    socket.on(GameEvent.OPPONENT_RECONNECTED, (data: { matchId: string }) => {
        console.log('🔌 Opponent reconnected:', data.matchId);
        const gs = useGameStore.getState();
        gs.setOpponentDisconnected(false);
        gs.setReconnectCountdown(null);
    });

    socket.on('disconnect', () => {
        console.log('🔌 Disconnected from server');
    });

    return socket;
}

export function getSocket(): Socket | null {
    return socket;
}

export function joinQueue(level: number, currencyType: string, totalRounds: number = 1) {
    socket?.emit(GameEvent.JOIN_QUEUE, { level, currencyType: currencyType.toUpperCase(), totalRounds });
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
