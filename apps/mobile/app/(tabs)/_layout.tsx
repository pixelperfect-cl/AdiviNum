import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize } from '@/constants/theme';
import { SocialFab } from '../components/SocialFab';

export default function TabLayout() {
    return (
        <View style={{ flex: 1 }}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: {
                        backgroundColor: Colors.surface,
                        borderTopColor: Colors.border,
                        borderTopWidth: 1,
                        height: 65,
                        paddingBottom: 8,
                        paddingTop: 8,
                    },
                    tabBarActiveTintColor: Colors.primary,
                    tabBarInactiveTintColor: Colors.textMuted,
                    tabBarLabelStyle: {
                        fontSize: FontSize.xs,
                        fontWeight: '600',
                    },
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: 'Inicio',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="home" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="play"
                    options={{
                        title: 'Jugar',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="game-controller" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="spectate"
                    options={{
                        title: 'Espectador',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="eye" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="ranking"
                    options={{
                        title: 'Ranking',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="trophy" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="tournaments"
                    options={{
                        title: 'Torneos',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="podium" size={size} color={color} />
                        ),
                    }}
                />
                <Tabs.Screen
                    name="profile"
                    options={{
                        title: 'Perfil',
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="person" size={size} color={color} />
                        ),
                    }}
                />
            </Tabs>
            <SocialFab />
        </View>
    );
}

