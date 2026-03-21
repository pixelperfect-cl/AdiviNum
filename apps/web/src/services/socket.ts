import { io, Socket } from 'socket.io-client';
// API_BASE no longer needed here — socket uses its own URL
import { useUserStore } from '../stores/userStore';
import { useGameStore } from '../stores/gameStore';
import { GameEvent } from '@adivinum/shared';
import {
    soundMatchFound, soundMyTurn, soundFama, soundToque, soundMiss,
    soundWin, soundLose, soundDraw, soundDrawOffered,
} from './sounds';

// Dev user → uid mapping (only used when DEV_TOKEN is in localStorage)
const DEV_UID_MAP: Record<string, string> = {
    player: 'dev-player-uid',
    admin: 'dev-admin-uid',
    player2: 'dev-player2-uid',
};

let socket: Socket | null = null;
let listenersAttached = false;
let currentSocketUserId: string | null = null;

/**
 * Get or create the WebSocket connection to the game gateway.
 * Uses the real Supabase UID when available, falls back to dev UID.
 */
export function getSocket(): Socket {
    // Determine the userId for this connection
    let userId: string;

    if (localStorage.getItem('DEV_TOKEN')) {
        // Dev mode: use the dev UID map
        const devUser = localStorage.getItem('x-dev-user') || 'player';
        userId = DEV_UID_MAP[devUser] || DEV_UID_MAP.player;
    } else {
        // Real auth: get supabaseUid from the user store
        const user = useUserStore.getState().user;
        userId = user?.supabaseUid || 'anonymous';
    }

    // If we already have a socket with the same userId, reuse it
    if (socket && currentSocketUserId === userId) return socket;

    // If user changed (e.g. logged out and back in), disconnect old socket
    if (socket && currentSocketUserId !== userId) {
        console.log('[WS] User changed, reconnecting socket');
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
        listenersAttached = false;
    }

    console.log('[WS] Creating socket connection for user:', userId);
    currentSocketUserId = userId;

    const SOCKET_URL = import.meta.env.PROD
        ? window.location.origin
        : 'http://localhost:3000';

    socket = io(`${SOCKET_URL}/game`, {
        auth: { userId },
        transports: import.meta.env.PROD ? ['polling'] : ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
    });

    // Wire up all server → client event handlers
    if (!listenersAttached) {
        setupListeners(socket);
        listenersAttached = true;
    }

    return socket;
}

/**
 * Disconnect and clean up the socket.
 */
export function disconnectSocket() {
    if (socket) {
        console.log('[WS] Disconnecting socket');
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
        listenersAttached = false;
    }
}

/**
 * Join the matchmaking queue.
 */
export function joinQueue(level: number, betAmount: number, currencyType: string = 'VIRTUAL', timeSeconds: number = 300, totalRounds: number = 1) {
    const s = getSocket();
    console.log('[WS] Emitting join_queue:', { level, betAmount, currencyType, timeSeconds, totalRounds });
    s.emit(GameEvent.JOIN_QUEUE, { level, betAmount, currencyType, timeSeconds, totalRounds });
    useGameStore.getState().setPhase('queue');
}

/**
 * Leave the matchmaking queue.
 */
export function leaveQueue() {
    const s = getSocket();
    s.emit(GameEvent.LEAVE_QUEUE);
    useGameStore.getState().setPhase('idle');
}

/**
 * Send a direct challenge to a friend.
 */
export function sendChallenge(targetUserId: string, level: number, betAmount: number, currencyType: string = 'VIRTUAL') {
    const s = getSocket();
    console.log('[WS] Sending challenge:', { targetUserId, level, betAmount, currencyType });
    s.emit(GameEvent.SEND_CHALLENGE, { targetUserId, level, betAmount, currencyType });
}

/**
 * Respond to a direct challenge.
 */
export function respondChallenge(challengeId: string, accepted: boolean) {
    const s = getSocket();
    console.log('[WS] Responding to challenge:', { challengeId, accepted });
    s.emit(GameEvent.RESPOND_CHALLENGE, { challengeId, accepted });
}

/**
 * Send the secret number.
 */
export function setSecret(matchId: string, secret: string) {
    const s = getSocket();
    console.log('[WS] Emitting set_secret:', { matchId, secret });
    s.emit(GameEvent.SET_SECRET, { matchId, secret });
}

/**
 * Make a guess.
 */
export function makeGuess(matchId: string, guess: string) {
    const s = getSocket();
    console.log('[WS] Emitting make_guess:', { matchId, guess });
    s.emit(GameEvent.MAKE_GUESS, { matchId, guess });
}

/**
 * Surrender the match.
 */
export function surrender(matchId: string) {
    const s = getSocket();
    console.log('[WS] Emitting surrender:', { matchId });
    s.emit(GameEvent.SURRENDER, { matchId });
}

/**
 * Offer a draw to the opponent.
 */
export function offerDraw(matchId: string) {
    const s = getSocket();
    console.log('[WS] Emitting offer_draw:', { matchId });
    s.emit(GameEvent.OFFER_DRAW, { matchId });
}

/**
 * Respond to a draw offer.
 */
export function respondDraw(matchId: string, accepted: boolean) {
    const s = getSocket();
    console.log('[WS] Emitting respond_draw:', { matchId, accepted });
    s.emit(GameEvent.RESPOND_DRAW, { matchId, accepted });
}

/**
 * Send a chat message.
 */
export function sendChatMessage(matchId: string, message: string) {
    const s = getSocket();
    s.emit(GameEvent.SEND_CHAT, { matchId, message });
}

/**
 * Request a rematch with the last opponent.
 */
export function requestRematch(opponentUid: string, level: number, betAmount: number, currencyType: string) {
    const s = getSocket();
    if (!s) return;
    s.emit(GameEvent.REQUEST_REMATCH, { opponentUid, level, betAmount, currencyType });
}

/**
 * Respond to a rematch offer.
 */
export function respondRematch(requesterUid: string, accepted: boolean) {
    const s = getSocket();
    s.emit(GameEvent.RESPOND_REMATCH, { requesterUid, accepted });
}

// ---- Listeners ----

function setupListeners(s: Socket) {
    s.on('connect', () => {
        console.log('[WS] Connected to game server, socket id:', s.id);
    });

    s.on('disconnect', (reason) => {
        console.log('[WS] Disconnected:', reason);
    });

    s.on('reconnect', (attemptNumber: number) => {
        console.log('[WS] Reconnected after', attemptNumber, 'attempts');
    });

    // Queue joined acknowledgement
    s.on('queue_joined', (data: { level: number }) => {
        console.log('[WS] In queue for level', data.level);
    });

    // Match found
    s.on(GameEvent.MATCH_FOUND, (data: {
        matchId: string;
        playerAId: string;
        playerBId: string;
        playerAName?: string;
        playerBName?: string;
        playerAAvatarUrl?: string | null;
        playerBAvatarUrl?: string | null;
        level: number;
        betAmount: number;
        firstTurn: 'A' | 'B';
        you: 'A' | 'B';
        totalRounds?: number;
    }) => {
        console.log('[WS] Match found!', data);
        const gameStore = useGameStore.getState();
        const opponentId = data.you === 'A' ? data.playerBId : data.playerAId;
        const opponentName = data.you === 'A' ? data.playerBName : data.playerAName;
        const opponentAvatarUrl = data.you === 'A' ? data.playerBAvatarUrl : data.playerAAvatarUrl;
        gameStore.setMatchData({
            matchId: data.matchId,
            myRole: data.you,
            opponentId,
            opponentName: opponentName || null,
            opponentAvatarUrl: opponentAvatarUrl || null,
            level: data.level,
            betAmount: data.betAmount,
            totalRounds: data.totalRounds ?? 1,
        });
        // Move to set_secret phase
        gameStore.setPhase('set_secret');
        soundMatchFound();
    });

    // Game start (both secrets set)
    s.on(GameEvent.GAME_START, (data: {
        matchId: string;
        currentTurn: 'A' | 'B';
        timeRemainingA: number;
        timeRemainingB: number;
    }) => {
        console.log('[WS] Game started!', data);
        const gameStore = useGameStore.getState();
        gameStore.setPhase('playing');
        gameStore.setCurrentTurn(data.currentTurn);
        gameStore.setTimes(data.timeRemainingA, data.timeRemainingB);
    });

    // Turn result
    s.on(GameEvent.TURN_RESULT, (data: {
        guess: string;
        toques: number;
        famas: number;
        attemptNumber: number;
        nextTurn: 'A' | 'B';
        timeRemainingA: number;
        timeRemainingB: number;
    }) => {
        console.log('[WS] Turn result:', data);
        const gameStore = useGameStore.getState();
        const attempt = {
            guess: data.guess,
            toques: data.toques,
            famas: data.famas,
            timestamp: Date.now(),
        };

        // Determine if this was my guess or opponent's
        if (data.nextTurn === gameStore.myRole) {
            // Opponent just guessed, now it's my turn
            gameStore.addOpponentAttempt(attempt);
            soundMyTurn();
        } else {
            // I just guessed, now it's opponent's turn
            gameStore.addMyAttempt(attempt);
            // Play sound based on result quality
            if (data.famas > 0) soundFama();
            else if (data.toques > 0) soundToque();
            else soundMiss();
        }

        gameStore.setCurrentTurn(data.nextTurn);
        gameStore.setTimes(data.timeRemainingA, data.timeRemainingB);
    });

    // Game over
    s.on(GameEvent.GAME_OVER, (data: {
        type: string;
        result: string;
        winnerId: string | null;
        loserId: string | null;
        winnerPrize: number;
        commission: number;
        secretA?: string;
        secretB?: string;
    }) => {
        console.log('[WS] Game over!', data);
        const gameStore = useGameStore.getState();
        const myRole = gameStore.myRole;
        const opponentSecret = myRole === 'A' ? data.secretB : data.secretA;
        gameStore.setGameOver(data.result, data.winnerId, data.winnerPrize, opponentSecret || undefined);

        // Sound based on outcome
        const aWins = ['PLAYER_A_WINS', 'ABANDON_B', 'TIMEOUT_B'].includes(data.result);
        const bWins = ['PLAYER_B_WINS', 'ABANDON_A', 'TIMEOUT_A'].includes(data.result);
        const iWon = (aWins && myRole === 'A') || (bWins && myRole === 'B');
        if (data.result === 'DRAW') soundDraw();
        else if (iWon) soundWin();
        else soundLose();
    });

    // Draw offered by opponent
    s.on(GameEvent.DRAW_OFFERED, (data: { matchId: string }) => {
        console.log('[WS] Draw offered!', data);
        const gameStore = useGameStore.getState();
        gameStore.setDrawOffered(true);
        soundDrawOffered();
    });

    // Draw declined by opponent
    s.on(GameEvent.DRAW_DECLINED, (data: { matchId: string }) => {
        console.log('[WS] Draw declined', data);
        const gameStore = useGameStore.getState();
        gameStore.setDrawPending(false);
    });

    // Last chance / Match point notification
    s.on(GameEvent.LAST_CHANCE, (data: { matchId: string; message: string; role: 'attacker' | 'defender' }) => {
        console.log('[WS] Last chance!', data);
        const gameStore = useGameStore.getState();
        gameStore.setLastChance(true, data.role);
    });

    // Round over (multi-round series — round finished but series continues)
    s.on(GameEvent.ROUND_OVER, (data: {
        matchId: string;
        roundNumber: number;
        roundResult: string;
        roundWinner: 'A' | 'B' | null;
        winsA: number;
        winsB: number;
        totalRounds: number;
    }) => {
        console.log('[WS] Round over!', data);
        const gameStore = useGameStore.getState();
        const myRole = gameStore.myRole;
        const myWins = myRole === 'A' ? data.winsA : data.winsB;
        const opponentWins = myRole === 'A' ? data.winsB : data.winsA;
        gameStore.setRoundOver({
            currentRound: data.roundNumber + 1,
            myWins,
            opponentWins,
        });
    });

    // Chat message from opponent
    s.on(GameEvent.CHAT_MESSAGE, (data: { message: string; from: string }) => {
        console.log('[WS] Chat message:', data);
        const gameStore = useGameStore.getState();
        gameStore.addChatMessage(data.message, 'opponent');
    });

    // Rematch offered by opponent
    s.on(GameEvent.REMATCH_OFFERED, (data: { fromUid: string; level: number }) => {
        console.log('[WS] Rematch offered:', data);
        const gameStore = useGameStore.getState();
        gameStore.setRematchOffered(data.fromUid);
    });

    // Rematch declined by opponent
    s.on(GameEvent.REMATCH_DECLINED, () => {
        console.log('[WS] Rematch declined');
        const gameStore = useGameStore.getState();
        gameStore.setRematchDeclined();
    });

    // Secret timer countdown
    s.on(GameEvent.SECRET_TIMER, (data: { matchId: string; seconds: number }) => {
        console.log('[WS] Secret timer started:', data.seconds, 's');
        const gameStore = useGameStore.getState();
        gameStore.setSecretTimerSeconds(data.seconds);
    });

    // Reconnect state — full game state restore
    s.on(GameEvent.RECONNECT_STATE, (data: {
        matchId: string;
        level: number;
        betAmount: number;
        myRole: 'A' | 'B';
        opponentName: string;
        opponentAvatarUrl: string | null;
        opponentId: string;
        mySecret: string;
        currentTurn: 'A' | 'B';
        myAttempts: { guess: string; toques: number; famas: number; timestamp: number }[];
        opponentAttempts: { guess: string; toques: number; famas: number; timestamp: number }[];
        timeRemainingA: number;
        timeRemainingB: number;
    }) => {
        console.log('[WS] Reconnect state received:', data);
        const gameStore = useGameStore.getState();

        // Restore match data
        gameStore.setMatchData({
            matchId: data.matchId,
            myRole: data.myRole,
            opponentId: data.opponentId,
            opponentName: data.opponentName,
            opponentAvatarUrl: data.opponentAvatarUrl,
            level: data.level,
            betAmount: data.betAmount,
        });

        // Restore secret
        gameStore.setSecret(data.mySecret);

        // Restore attempts
        for (const a of data.myAttempts) {
            gameStore.addMyAttempt(a);
        }
        for (const a of data.opponentAttempts) {
            gameStore.addOpponentAttempt(a);
        }

        // Set phase to playing and restore turn/times
        gameStore.setPhase('playing');
        gameStore.setCurrentTurn(data.currentTurn);
        gameStore.setTimes(data.timeRemainingA, data.timeRemainingB);
        gameStore.setOpponentDisconnected(false);

        // Navigate to game page if not already there
        if (!window.location.pathname.includes('/game')) {
            window.location.href = '/game';
        }
    });

    // Opponent reconnected
    s.on(GameEvent.OPPONENT_RECONNECTED, (data: { matchId: string }) => {
        console.log('[WS] Opponent reconnected to match:', data.matchId);
        useGameStore.getState().setOpponentDisconnected(false);
    });

    // Opponent disconnected — grace period countdown
    s.on(GameEvent.RECONNECT_COUNTDOWN, (data: { matchId: string; seconds: number }) => {
        console.log('[WS] Opponent disconnected, grace period:', data.seconds, 's');
        useGameStore.getState().setOpponentDisconnected(true);
    });

    // Error
    s.on(GameEvent.ERROR, (data: { message: string }) => {
        console.error('[WS] Game error:', data.message);
        // Show visual toast notification
        showErrorToast(data.message);
    });
}

/** Simple DOM toast for error messages */
function showErrorToast(message: string) {
    const toast = document.createElement('div');
    toast.textContent = `⚠️ ${message}`;
    Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
        color: '#ff6b6b',
        padding: '12px 24px',
        borderRadius: '12px',
        border: '1px solid rgba(255, 107, 107, 0.3)',
        fontSize: '0.9rem',
        fontWeight: '600',
        zIndex: '9999',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        animation: 'fadeIn 0.3s ease',
    });
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

