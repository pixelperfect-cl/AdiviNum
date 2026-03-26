import { create } from 'zustand';
import type { AttemptResult, CurrencyType } from '@adivinum/shared';

type GamePhase = 'idle' | 'queue' | 'coin_flip' | 'set_secret' | 'playing' | 'game_over';

interface GameState {
    // Phase
    phase: GamePhase;
    matchId: string | null;
    level: number;
    currencyType: CurrencyType;

    // Players
    myRole: 'A' | 'B' | null;
    opponentId: string | null;
    opponentName: string | null;

    // Secrets
    mySecret: string;

    // Turns
    currentTurn: 'A' | 'B' | null;
    isMyTurn: boolean;

    // Attempts
    myAttempts: AttemptResult[];
    opponentAttempts: AttemptResult[];

    // Timers (ms)
    timeRemainingA: number;
    timeRemainingB: number;
    myTimeRemaining: number;
    opponentTimeRemaining: number;

    // Result
    result: string | null;
    winnerId: string | null;
    winnerFirebaseUid: string | null;
    winnerPrize: number;
    isLastChance: boolean;
    lastChanceRole: 'attacker' | 'defender' | null;
    secretTimerSeconds: number | null;
    opponentDisconnected: boolean;
    reconnectCountdown: number | null;
    // Rounds
    totalRounds: number;
    currentRound: number;
    myWins: number;
    opponentWins: number;

    // Actions
    setPhase: (phase: GamePhase) => void;
    setMatchData: (data: {
        matchId: string;
        myRole: 'A' | 'B';
        opponentId: string;
        level: number;
    }) => void;
    setSecret: (secret: string) => void;
    setCurrentTurn: (turn: 'A' | 'B') => void;
    setTimes: (a: number, b: number) => void;
    addMyAttempt: (attempt: AttemptResult) => void;
    addOpponentAttempt: (attempt: AttemptResult) => void;
    setGameOver: (result: string, winnerId: string | null, prize: number, winnerFirebaseUid?: string | null) => void;
    setLastChance: (isLastChance: boolean, role?: 'attacker' | 'defender' | null) => void;
    setLevel: (level: number) => void;
    setCurrencyType: (type: CurrencyType) => void;
    setSecretTimerSeconds: (s: number | null) => void;
    setOpponentDisconnected: (d: boolean) => void;
    setReconnectCountdown: (s: number | null) => void;
    setRoundOver: (data: { currentRound: number; myWins: number; opponentWins: number; totalRounds: number }) => void;
    resetGame: () => void;
}

const initialState = {
    phase: 'idle' as GamePhase,
    matchId: null,
    level: 1,
    currencyType: 'virtual' as CurrencyType,
    myRole: null,
    opponentId: null,
    opponentName: null,
    mySecret: '',
    currentTurn: null,
    isMyTurn: false,
    myAttempts: [],
    opponentAttempts: [],
    timeRemainingA: 0,
    timeRemainingB: 0,
    myTimeRemaining: 0,
    opponentTimeRemaining: 0,
    result: null,
    winnerId: null,
    winnerFirebaseUid: null,
    winnerPrize: 0,
    isLastChance: false,
    lastChanceRole: null as 'attacker' | 'defender' | null,
    secretTimerSeconds: null as number | null,
    opponentDisconnected: false,
    reconnectCountdown: null as number | null,
    totalRounds: 1,
    currentRound: 1,
    myWins: 0,
    opponentWins: 0,
};

export const useGameStore = create<GameState>((set, get) => ({
    ...initialState,

    setPhase: (phase) => set({ phase }),

    setMatchData: ({ matchId, myRole, opponentId, level }) =>
        set({ matchId, myRole, opponentId, level, phase: 'coin_flip' }),

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

    setGameOver: (result, winnerId, winnerPrize, winnerFirebaseUid) =>
        set({ phase: 'game_over', result, winnerId, winnerPrize, winnerFirebaseUid: winnerFirebaseUid ?? null, isLastChance: false, lastChanceRole: null }),

    setLastChance: (isLastChance, role) => set({ isLastChance, lastChanceRole: role ?? null }),
    setLevel: (level) => set({ level }),
    setCurrencyType: (currencyType) => set({ currencyType }),
    setSecretTimerSeconds: (secretTimerSeconds) => set({ secretTimerSeconds }),
    setOpponentDisconnected: (opponentDisconnected) => set({ opponentDisconnected }),
    setReconnectCountdown: (reconnectCountdown) => set({ reconnectCountdown }),
    setRoundOver: ({ currentRound, myWins, opponentWins, totalRounds }) => set({
        currentRound,
        myWins,
        opponentWins,
        totalRounds,
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
