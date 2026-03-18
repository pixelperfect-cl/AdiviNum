import { create } from 'zustand';

interface User {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
    currentLevel: number;
    eloRating: number;
    gamesPlayed: number;
    gamesWon: number;
    streakCurrent: number;
}

interface Wallet {
    balanceFiat: number;
    balanceVirtual: number;
    balanceSavings: number;
}

interface UserStore {
    user: User | null;
    wallet: Wallet | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    setUser: (user: User) => void;
    setWallet: (wallet: Wallet) => void;
    setLoading: (loading: boolean) => void;
    logout: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
    user: null,
    wallet: null,
    isAuthenticated: false,
    isLoading: true,

    setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),
    setWallet: (wallet) => set({ wallet }),
    setLoading: (isLoading) => set({ isLoading }),
    logout: () => set({ user: null, wallet: null, isAuthenticated: false }),
}));
