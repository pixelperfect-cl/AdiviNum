import { create } from 'zustand';
import type { AttemptResult, CurrencyType } from '@adivinum/shared';

type GamePhase = 'idle' | 'queue' | 'coin_flip' | 'set_secret' | 'playing' | 'game_over';

export interface ChatMessage {
    text: string;
    from: 'me' | 'opponent';
    timestamp: number;
}

interface GameState {
    phase: GamePhase;
    matchId: string | null;
    level: number;
    betAmount: number;
    currencyType: CurrencyType;
    myRole: 'A' | 'B' | null;
    opponentId: string | null;
    opponentName: string | null;
    opponentAvatarUrl: string | null;
    mySecret: string;
    currentTurn: 'A' | 'B' | null;
    isMyTurn: boolean;
    myAttempts: AttemptResult[];
    opponentAttempts: AttemptResult[];
    timeRemainingA: number;
    timeRemainingB: number;
    myTimeRemaining: number;
    opponentTimeRemaining: number;
    result: string | null;
    winnerId: string | null;
    winnerPrize: number;
    opponentSecret: string | null;
    drawOffered: boolean;
    drawPending: boolean;
    chatMessages: ChatMessage[];
    rematchPending: boolean;          // I requested a rematch
    rematchOfferedBy: string | null;  // uid of opponent offering rematch
    rematchDeclined: boolean;         // opponent declined my rematch
    opponentDisconnected: boolean;    // opponent disconnected, grace period
    secretTimerSeconds: number | null; // countdown for setting secret
    isLastChance: boolean;             // match point / last chance active
    lastChanceRole: 'attacker' | 'defender' | null; // which side of last chance
    gameOverReason: string | null;     // e.g. 'secret_timeout'
    // Rounds
    totalRounds: number;
    currentRound: number;
    myWins: number;
    opponentWins: number;

    setPhase: (phase: GamePhase) => void;
    setMatchData: (data: {
        matchId: string;
        myRole: 'A' | 'B';
        opponentId: string;
        opponentName?: string | null;
        opponentAvatarUrl?: string | null;
        level: number;
        betAmount?: number;
        totalRounds?: number;
    }) => void;
    setSecret: (secret: string) => void;
    setCurrentTurn: (turn: 'A' | 'B') => void;
    setTimes: (a: number, b: number) => void;
    addMyAttempt: (attempt: AttemptResult) => void;
    addOpponentAttempt: (attempt: AttemptResult) => void;
    setGameOver: (result: string, winnerId: string | null, prize: number, opponentSecret?: string, reason?: string) => void;
    setLevel: (level: number) => void;
    setCurrencyType: (type: CurrencyType) => void;
    setDrawOffered: (offered: boolean) => void;
    setDrawPending: (pending: boolean) => void;
    addChatMessage: (text: string, from: 'me' | 'opponent') => void;
    setRematchPending: (pending: boolean) => void;
    setRematchOffered: (fromUid: string) => void;
    setRematchDeclined: () => void;
    setOpponentDisconnected: (d: boolean) => void;
    setSecretTimerSeconds: (s: number | null) => void;
    setLastChance: (isLastChance: boolean, role?: 'attacker' | 'defender' | null) => void;
    setRoundOver: (data: { currentRound: number; myWins: number; opponentWins: number }) => void;
    resetGame: () => void;
}

const initialState = {
    phase: 'idle' as GamePhase,
    matchId: null,
    level: 1,
    betAmount: 0,
    currencyType: 'virtual' as CurrencyType,
    myRole: null,
    opponentId: null,
    opponentName: null,
    opponentAvatarUrl: null,
    mySecret: '',
    currentTurn: null,
    isMyTurn: false,
    myAttempts: [] as AttemptResult[],
    opponentAttempts: [] as AttemptResult[],
    timeRemainingA: 0,
    timeRemainingB: 0,
    myTimeRemaining: 0,
    opponentTimeRemaining: 0,
    result: null,
    winnerId: null,
    winnerPrize: 0,
    opponentSecret: null,
    drawOffered: false,
    drawPending: false,
    chatMessages: [] as ChatMessage[],
    rematchPending: false,
    rematchOfferedBy: null as string | null,
    rematchDeclined: false,
    opponentDisconnected: false,
    secretTimerSeconds: null as number | null,
    isLastChance: false,
    lastChanceRole: null as 'attacker' | 'defender' | null,
    gameOverReason: null as string | null,
    totalRounds: 1,
    currentRound: 1,
    myWins: 0,
    opponentWins: 0,
};

export const useGameStore = create<GameState>((set, get) => ({
    ...initialState,

    setPhase: (phase) => set({ phase }),

    setMatchData: ({ matchId, myRole, opponentId, opponentName, opponentAvatarUrl, level, betAmount, totalRounds }) =>
        set({
            matchId, myRole, opponentId, level,
            opponentName: opponentName ?? null,
            opponentAvatarUrl: opponentAvatarUrl ?? null,
            betAmount: betAmount ?? 0,
            totalRounds: totalRounds ?? 1,
            phase: 'coin_flip',
            // Reset all per-game state for fresh match (critical for rematches)
            mySecret: '',
            currentTurn: null,
            isMyTurn: false,
            myAttempts: [],
            opponentAttempts: [],
            result: null,
            winnerId: null,
            winnerPrize: 0,
            opponentSecret: null,
            drawOffered: false,
            drawPending: false,
            chatMessages: [],
            rematchPending: false,
            rematchOfferedBy: null,
            rematchDeclined: false,
            opponentDisconnected: false,
            secretTimerSeconds: null,
            isLastChance: false,
            lastChanceRole: null,
            currentRound: 1,
            myWins: 0,
            opponentWins: 0,
        }),

    setSecret: (secret) => set({ mySecret: secret }),

    setCurrentTurn: (turn) => {
        const { myRole } = get();
        set({ currentTurn: turn, isMyTurn: turn === myRole });
    },

    setTimes: (a, b) => {
        const { myRole } = get();
        set({
            timeRemainingA: a,
            timeRemainingB: b,
            myTimeRemaining: myRole === 'A' ? a : b,
            opponentTimeRemaining: myRole === 'A' ? b : a,
        });
    },

    addMyAttempt: (attempt) =>
        set((state) => ({ myAttempts: [...state.myAttempts, attempt] })),

    addOpponentAttempt: (attempt) =>
        set((state) => ({ opponentAttempts: [...state.opponentAttempts, attempt] })),

    setGameOver: (result, winnerId, winnerPrize, opponentSecret, reason) =>
        set({ phase: 'game_over', result, winnerId, winnerPrize, opponentSecret: opponentSecret ?? null, gameOverReason: reason ?? null, drawOffered: false, drawPending: false, isLastChance: false, lastChanceRole: null }),

    setLevel: (level) => set({ level }),
    setCurrencyType: (currencyType) => set({ currencyType }),
    setDrawOffered: (drawOffered) => set({ drawOffered }),
    setDrawPending: (drawPending) => set({ drawPending }),
    addChatMessage: (text, from) =>
        set((state) => ({
            chatMessages: [...state.chatMessages, { text, from, timestamp: Date.now() }],
        })),
    setRematchPending: (rematchPending) => set({ rematchPending, rematchDeclined: false }),
    setRematchOffered: (fromUid) => set({ rematchOfferedBy: fromUid }),
    setRematchDeclined: () => set({ rematchPending: false, rematchDeclined: true }),
    setOpponentDisconnected: (opponentDisconnected) => set({ opponentDisconnected }),
    setSecretTimerSeconds: (secretTimerSeconds) => set({ secretTimerSeconds }),
    setLastChance: (isLastChance, role) => set({ isLastChance, lastChanceRole: role ?? null }),
    setRoundOver: ({ currentRound, myWins, opponentWins }) => set({
        currentRound,
        myWins,
        opponentWins,
        // Reset per-round state for next round
        phase: 'set_secret' as GamePhase,
        mySecret: '',
        currentTurn: null,
        isMyTurn: false,
        myAttempts: [],
        opponentAttempts: [],
        result: null,
        isLastChance: false,
        lastChanceRole: null,
        secretTimerSeconds: null,
    }),
    resetGame: () => set(initialState),
}));
