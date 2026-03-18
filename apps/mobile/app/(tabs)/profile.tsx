import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useUserStore } from '@/stores/userStore';
import { getRankForElo, LEVELS } from '@adivinum/shared';
import { router } from 'expo-router';

export default function ProfileScreen() {
    const user = useUserStore((s) => s.user);
    const wallet = useUserStore((s) => s.wallet);
    const logout = useUserStore((s) => s.logout);
    const rank = user ? getRankForElo(user.eloRating) : null;

    const handleLogout = () => {
        logout();
        router.replace('/(auth)/login');
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Profile Header */}
            <View style={styles.profileHeader}>
                <View style={[styles.avatarCircle, { borderColor: rank?.colorHex || Colors.textMuted }]}>
                    <Text style={styles.avatarEmoji}>🧠</Text>
                </View>
                <Text style={styles.username}>{user?.username}</Text>
                <Text style={[styles.rankName, { color: rank?.colorHex }]}>{rank?.name}</Text>
                <Text style={styles.email}>{user?.email}</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{user?.gamesPlayed || 0}</Text>
                    <Text style={styles.statLabel}>Jugadas</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{user?.gamesWon || 0}</Text>
                    <Text style={styles.statLabel}>Ganadas</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={[styles.statValue, { color: Colors.primary }]}>{user?.eloRating || 0}</Text>
                    <Text style={styles.statLabel}>ELO</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{user?.streakCurrent || 0}🔥</Text>
                    <Text style={styles.statLabel}>Racha</Text>
                </View>
            </View>

            {/* Level Progress */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Niveles Desbloqueados</Text>
                <View style={styles.levelsRow}>
                    {LEVELS.map((lvl) => {
                        const unlocked = (user?.currentLevel || 1) >= lvl.level;
                        return (
                            <View
                                key={lvl.level}
                                style={[
                                    styles.levelDot,
                                    { backgroundColor: unlocked ? lvl.colorHex : Colors.surfaceLight },
                                ]}
                            >
                                <Text style={[styles.levelDotText, { color: unlocked ? '#000' : Colors.textMuted }]}>
                                    {lvl.level}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* Wallet Summary */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>💰 Billetera</Text>
                <View style={styles.walletRow}>
                    <Text style={styles.walletLabel}>Demo:</Text>
                    <Text style={styles.walletValue}>${(wallet?.balanceVirtual || 0).toLocaleString()}</Text>
                </View>
                <View style={styles.walletRow}>
                    <Text style={styles.walletLabel}>CLP:</Text>
                    <Text style={styles.walletValue}>${(wallet?.balanceFiat || 0).toLocaleString()}</Text>
                </View>
                <View style={styles.walletRow}>
                    <Text style={styles.walletLabel}>Ahorros:</Text>
                    <Text style={styles.walletValue}>${(wallet?.balanceSavings || 0).toLocaleString()}</Text>
                </View>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Cerrar Sesión</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { padding: Spacing.xl, paddingTop: 60, paddingBottom: 100 },
    profileHeader: {
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    avatarCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: Colors.surface,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    avatarEmoji: { fontSize: 40 },
    username: {
        fontSize: FontSize.xxl,
        fontWeight: '900',
        color: Colors.textPrimary,
    },
    rankName: {
        fontSize: FontSize.md,
        fontWeight: '700',
        marginTop: Spacing.xs,
    },
    email: {
        fontSize: FontSize.sm,
        color: Colors.textMuted,
        marginTop: 4,
    },
    statsRow: {
        flexDirection: 'row',
        marginBottom: Spacing.xl,
        gap: Spacing.sm,
    },
    statBox: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
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
    section: {
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
        marginBottom: Spacing.md,
    },
    levelsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    levelDot: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    levelDotText: {
        fontSize: FontSize.xs,
        fontWeight: '900',
    },
    walletRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    walletLabel: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
    },
    walletValue: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    logoutButton: {
        backgroundColor: Colors.error + '15',
        borderWidth: 1,
        borderColor: Colors.error + '40',
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.lg,
        alignItems: 'center',
        marginTop: Spacing.md,
    },
    logoutText: {
        color: Colors.error,
        fontWeight: '700',
        fontSize: FontSize.md,
    },
});
