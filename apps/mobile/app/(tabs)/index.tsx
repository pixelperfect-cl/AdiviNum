import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useUserStore } from '@/stores/userStore';
import { LEVELS, getRankForElo } from '@adivinum/shared';

export default function HomeScreen() {
    const user = useUserStore((s) => s.user);
    const wallet = useUserStore((s) => s.wallet);
    const rank = user ? getRankForElo(user.eloRating) : null;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hola,</Text>
                    <Text style={styles.username}>{user?.username || 'Jugador'}</Text>
                </View>
                <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>Nv. {user?.currentLevel || 1}</Text>
                </View>
            </View>

            {/* Wallet Card */}
            <LinearGradient
                colors={['#1A1F2E', '#242A3D']}
                style={styles.walletCard}
            >
                <Text style={styles.walletLabel}>💰 Tu Billetera</Text>
                <View style={styles.walletRow}>
                    <View style={styles.walletItem}>
                        <Text style={styles.walletAmount}>
                            ${(wallet?.balanceVirtual || 0).toLocaleString()}
                        </Text>
                        <Text style={styles.walletType}>Monedas Demo</Text>
                    </View>
                    <View style={styles.walletDivider} />
                    <View style={styles.walletItem}>
                        <Text style={styles.walletAmount}>
                            ${(wallet?.balanceFiat || 0).toLocaleString()}
                        </Text>
                        <Text style={styles.walletType}>CLP</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* Quick Play Button */}
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push('/(tabs)/play')}
            >
                <LinearGradient
                    colors={['#FFD700', '#F59E0B', '#D97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.playButton}
                >
                    <Ionicons name="game-controller" size={28} color="#000" />
                    <Text style={styles.playButtonText}>JUGAR AHORA</Text>
                </LinearGradient>
            </TouchableOpacity>

            {/* Stats Card */}
            <View style={styles.statsCard}>
                <Text style={styles.sectionTitle}>📊 Tus Estadísticas</Text>
                <View style={styles.statsGrid}>
                    <StatItem label="Partidas" value={user?.gamesPlayed || 0} icon="🎮" />
                    <StatItem label="Victorias" value={user?.gamesWon || 0} icon="🏆" />
                    <StatItem
                        label="Win Rate"
                        value={
                            user && user.gamesPlayed > 0
                                ? `${((user.gamesWon / user.gamesPlayed) * 100).toFixed(0)}%`
                                : '0%'
                        }
                        icon="📈"
                    />
                    <StatItem label="Racha" value={user?.streakCurrent || 0} icon="🔥" />
                </View>
            </View>

            {/* Rank Card */}
            {rank && (
                <View style={[styles.rankCard, { borderColor: rank.colorHex }]}>
                    <Text style={styles.sectionTitle}>🎖 Tu Rango</Text>
                    <Text style={[styles.rankName, { color: rank.colorHex }]}>
                        {rank.name}
                    </Text>
                    <Text style={styles.eloText}>ELO: {user?.eloRating || 0}</Text>
                </View>
            )}
        </ScrollView>
    );
}

function StatItem({ label, value, icon }: { label: string; value: number | string; icon: string }) {
    return (
        <View style={styles.statItem}>
            <Text style={styles.statIcon}>{icon}</Text>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { padding: Spacing.xl, paddingTop: 60 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    greeting: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
    },
    username: {
        fontSize: FontSize.xxl,
        fontWeight: '900',
        color: Colors.textPrimary,
    },
    levelBadge: {
        backgroundColor: Colors.primary + '20',
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
    },
    levelText: {
        color: Colors.primary,
        fontWeight: '800',
        fontSize: FontSize.sm,
    },
    walletCard: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    walletLabel: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        fontWeight: '600',
        marginBottom: Spacing.md,
    },
    walletRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    walletItem: { flex: 1, alignItems: 'center' },
    walletAmount: {
        fontSize: FontSize.xl,
        fontWeight: '900',
        color: Colors.textPrimary,
    },
    walletType: {
        fontSize: FontSize.xs,
        color: Colors.textMuted,
        marginTop: 2,
    },
    walletDivider: {
        width: 1,
        height: 40,
        backgroundColor: Colors.border,
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.xl,
        marginBottom: Spacing.lg,
    },
    playButtonText: {
        fontSize: FontSize.xl,
        fontWeight: '900',
        color: '#000',
        letterSpacing: 2,
    },
    statsCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    sectionTitle: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: Spacing.lg,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: { alignItems: 'center', flex: 1 },
    statIcon: { fontSize: 24, marginBottom: 4 },
    statValue: {
        fontSize: FontSize.lg,
        fontWeight: '900',
        color: Colors.textPrimary,
    },
    statLabel: {
        fontSize: FontSize.xs,
        color: Colors.textMuted,
        marginTop: 2,
    },
    rankCard: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        borderWidth: 1,
        marginBottom: Spacing.xxxl,
    },
    rankName: {
        fontSize: FontSize.xl,
        fontWeight: '900',
        marginBottom: 4,
    },
    eloText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
});
