import { Redirect } from 'expo-router';
import { useUserStore } from '@/stores/userStore';

export default function Index() {
    const isAuthenticated = useUserStore((s) => s.isAuthenticated);

    if (isAuthenticated) {
        return <Redirect href="/(tabs)" />;
    }

    return <Redirect href="/(auth)/login" />;
}
