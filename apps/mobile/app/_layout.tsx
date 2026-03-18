import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function RootLayout() {
    // Wire up Supabase → Zustand → Backend sync
    const { supabaseUser } = useAuth();

    return (
        <>
            <StatusBar style="light" />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#0A0E1A' },
                    animation: 'fade',
                }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                    name="game/[matchId]"
                    options={{ gestureEnabled: false }}
                />
            </Stack>
        </>
    );
}
