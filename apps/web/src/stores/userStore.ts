import { create } from 'zustand';
import { api } from '../services/api';
import { supabase } from '../lib/supabaseClient';

interface User {
    id: string;
    supabaseUid: string;
    username: string;
    email: string;
    avatarUrl: string | null;
    currentLevel: number;
    eloRating: number;
    gamesPlayed: number;
    gamesWon: number;
    streakCurrent: number;
    country: string | null;
    isPremium: boolean;
}

interface Wallet {
    id: string;
    balanceFiat: number;
    balanceVirtual: number;
    balanceSavings: number;
}

interface UserStore {
    user: User | null;
    wallet: Wallet | null;
    isLoading: boolean;
    error: string | null;
    isAuthenticated: boolean;
    googleAvatarUrl: string | null;
    googleDisplayName: string | null;

    login: (e: string, p: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    signUp: (e: string, p: string, u: string) => Promise<void>;
    loginAsDev: (devUser?: string) => Promise<void>;
    fetchUser: () => Promise<void>;
    updateProfile: (data: { username?: string; country?: string }) => Promise<void>;
    setUser: (user: User) => void;
    setWallet: (wallet: Wallet) => void;
    logout: () => Promise<void>;
    initAuthListener: () => () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
    user: null,
    wallet: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
    googleAvatarUrl: null,
    googleDisplayName: null,

    initAuthListener: () => {
        // Dev mode: short-circuit
        if (localStorage.getItem('DEV_TOKEN')) {
            set({ isAuthenticated: true });
            get().fetchUser();
            return () => {};
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    const meta = session.user.user_metadata;
                    set({
                        isAuthenticated: true,
                        googleAvatarUrl: meta?.avatar_url || meta?.picture || null,
                        googleDisplayName: meta?.full_name || meta?.name || null,
                    });
                    get().fetchUser();
                } else if (event === 'SIGNED_OUT') {
                    set({
                        user: null,
                        wallet: null,
                        isAuthenticated: false,
                        googleAvatarUrl: null,
                        googleDisplayName: null,
                    });
                } else if (event === 'INITIAL_SESSION' && session) {
                    const meta = session.user.user_metadata;
                    set({
                        isAuthenticated: true,
                        googleAvatarUrl: meta?.avatar_url || meta?.picture || null,
                        googleDisplayName: meta?.full_name || meta?.name || null,
                    });
                    get().fetchUser();
                }
            }
        );

        return () => subscription.unsubscribe();
    },

    login: async (email: string, password: string) => {
        try {
            set({ isLoading: true, error: null });
            const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
            if (authError) throw authError;

            // Sync with our backend
            const data = await api.post<{ user: User; wallet: Wallet }>('/auth/login');
            set({
                user: data.user,
                wallet: data.wallet,
                isLoading: false,
                isAuthenticated: true,
            });
        } catch (err) {
            set({ error: (err as Error).message, isLoading: false, isAuthenticated: false });
        }
    },

    loginWithGoogle: async () => {
        try {
            set({ isLoading: true, error: null });
            const { error: authError } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                }
            });
            if (authError) throw authError;
            // The redirection will be handled by Supabase, so we just wait here.
        } catch (err) {
            set({ error: (err as Error).message, isLoading: false, isAuthenticated: false });
        }
    },

    signUp: async (email: string, password: string, username: string) => {
        try {
            set({ isLoading: true, error: null });
            const { error: authError } = await supabase.auth.signUp({ email, password });
            if (authError) throw authError;

            // Register in our backend
            await api.post<{ user: User }>('/auth/register', { username });
            
            // Login to get full profile and wallet
            const data = await api.post<{ user: User; wallet: Wallet }>('/auth/login');

            set({
                user: data.user,
                wallet: data.wallet,
                isLoading: false,
                isAuthenticated: true,
            });
        } catch (err) {
            set({ error: (err as Error).message, isLoading: false, isAuthenticated: false });
        }
    },

    loginAsDev: async (devUser = 'player') => {
        try {
            set({ isLoading: true, error: null });
            
            // Bypass Supabase Auth completely for local development
            localStorage.setItem('DEV_TOKEN', 'true');
            localStorage.setItem('x-dev-user', devUser);

            const data = await api.post<{ user: User; wallet: Wallet }>('/auth/login');
            set({
                user: data.user,
                wallet: data.wallet,
                isLoading: false,
                isAuthenticated: true,
            });
        } catch (err) {
            set({ error: (err as Error).message, isLoading: false, isAuthenticated: false });
        }
    },

    fetchUser: async () => {
        try {
            set({ isLoading: true, error: null });
            const data = await api.post<{ user: User; wallet: Wallet }>('/auth/login');
            set({ user: data.user, wallet: data.wallet, isLoading: false, isAuthenticated: true });
        } catch (err) {
            set({ error: (err as Error).message, isLoading: false });
        }
    },

    updateProfile: async (data) => {
        try {
            const updated = await api.patch<any>('/users/me', data);
            const currentUser = get().user;
            if (currentUser && updated) {
                set({ user: { ...currentUser, ...updated } });
            }
        } catch (err) {
            console.error('Failed to update profile:', err);
        }
    },

    setUser: (user: User) => set({ user }),
    setWallet: (wallet: Wallet) => set({ wallet }),
    logout: async () => {
        if (localStorage.getItem('DEV_TOKEN')) {
            localStorage.removeItem('DEV_TOKEN');
            localStorage.removeItem('x-dev-user');
        } else {
            await supabase.auth.signOut();
        }
        // Disconnect WebSocket if connected
        import('../services/socket').then(m => m.disconnectSocket());
        set({ user: null, wallet: null, isAuthenticated: false, googleAvatarUrl: null, googleDisplayName: null });
    },
}));
