import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { api } from '@/services/apiClient';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Register for push notifications and return the Expo push token
 */
export async function registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
    }

    // Check permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.warn('Push notification permission not granted');
        return null;
    }

    // Get Expo push token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
    });

    // Android notification channel
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('game', {
            name: 'Partidas',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FFD700',
            sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('wallet', {
            name: 'Billetera',
            importance: Notifications.AndroidImportance.DEFAULT,
            sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('tournament', {
            name: 'Torneos',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
        });
    }

    return tokenData.data;
}

/**
 * Hook to manage push notifications
 */
export function usePushNotifications() {
    const [token, setToken] = useState<string | null>(null);
    const notificationListener = useRef<Notifications.EventSubscription>();
    const responseListener = useRef<Notifications.EventSubscription>();

    useEffect(() => {
        // Register and get token
        registerForPushNotifications().then((t) => {
            if (t) setToken(t);
        });

        // Listener for incoming notifications (app in foreground)
        notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
            const data = notification.request.content.data;
            console.log('Notification received:', data);
        });

        // Listener for notification tap
        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            const data = response.notification.request.content.data;
            handleNotificationTap(data);
        });

        return () => {
            if (notificationListener.current) {
                Notifications.removeNotificationSubscription(notificationListener.current);
            }
            if (responseListener.current) {
                Notifications.removeNotificationSubscription(responseListener.current);
            }
        };
    }, []);

    return { pushToken: token };
}

/**
 * Handle notification tap navigation
 */
function handleNotificationTap(data: any) {
    const { type, matchId, tournamentId } = data || {};

    switch (type) {
        case 'match_found':
            // Navigate to game screen — handled by expo-router deep link
            break;
        case 'tournament_start':
            // Navigate to tournament
            break;
        case 'deposit_confirmed':
            // Navigate to wallet
            break;
        default:
            break;
    }
}

/**
 * Save push token to backend
 */
export async function savePushToken(userId: string, token: string) {
    try {
        await api.updatePushToken(userId, token);
    } catch (err) {
        console.error('Failed to save push token:', err);
    }
}
