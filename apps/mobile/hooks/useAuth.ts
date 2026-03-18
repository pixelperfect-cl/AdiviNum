import { useEffect, useState } from 'react';
import { onAuthChange, getIdToken, logout as supabaseLogout } from '@/services/supabaseAuth';
import { api } from '@/services/apiClient';
import { connectSocket, disconnectSocket } from '@/services/socketService';
import { useUserStore } from '@/stores/userStore';
import { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * Hook that syncs Firebase Auth state with Zustand store
 * and automatically fetches user data from the backend.
 */
export function useAuth() {
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
    const setUser = useUserStore((s) => s.setUser);
    const setWallet = useUserStore((s) => s.setWallet);
    const setLoading = useUserStore((s) => s.setLoading);
    const storeLogout = useUserStore((s) => s.logout);

    useEffect(() => {
        const unsubscribe = onAuthChange(async (sbUser) => {
            setSupabaseUser(sbUser);

            if (sbUser) {
                try {
                    // Authenticate with backend — this creates the user if new
                    const { user, wallet } = await api.login();
                    setUser(user);
                    setWallet(wallet);

                    // Connect WebSocket
                    connectSocket(user.id);
                } catch (error) {
                    console.error('Failed to sync auth with backend:', error);
                    setLoading(false);
                }
            } else {
                storeLogout();
                disconnectSocket();
            }
        });

        return unsubscribe;
    }, []);

    const logout = async () => {
        await supabaseLogout();
        storeLogout();
        disconnectSocket();
    };

    return { supabaseUser, logout };
}
