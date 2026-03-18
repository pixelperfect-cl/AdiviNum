import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useGameStore } from '@/stores/gameStore';
import { useUserStore } from '@/stores/userStore';
import { LEVELS, getLevelConfig } from '@adivinum/shared';
import { joinQueue, leaveQueue } from '@/services/socketService';
import { router } from 'expo-router';

type CurrencyTab = 'virtual' | 'fiat';

export default function PlayScreen() {
    const [currencyTab, setCurrencyTab] = useState<CurrencyTab>('virtual');
    const phase = useGameStore((s) => s.phase);
    const selectedLevel = useGameStore((s) => s.level);
    const setLevel = useGameStore((s) => s.setLevel);
    const setCurrencyType = useGameStore((s) => s.setCurrencyType);
    const matchId = useGameStore((s) => s.matchId);
    const wallet = useUserStore((s) => s.wallet);

    // Auto-navigate to game when match is found
    React.useEffect(() => {
        if (phase === 'coin_flip' && matchId) {
            router.push(`/game/${matchId}`);
        }
    }, [phase, matchId]);

    const handleJoinQueue = () => {
        const currency = currencyTab === 'fiat' ? 'FIAT' : 'VIRTUAL';
        setCurrencyType(currencyTab);
        joinQueue(selectedLevel, currency);
    };

    const handleLeaveQueue = () => {
        leaveQueue();
    };

    const balance = currencyTab === 'fiat' ? wallet?.balanceFiat || 0 : wallet?.balanceVirtual || 0;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>⚔️ Jugar</Text>

            {/* Currency Tabs */}
            <View style={styles.currencyTabs}>
                <TouchableOpacity
                    style={[styles.currencyTab, currencyTab === 'virtual' && styles.currencyTabActive]}
                    onPress={() => setCurrencyTab('virtual')}
                >
                    <Text style={[styles.currencyTabText, currencyTab === 'virtual' && styles.currencyTabTextActive]}>
                        🎮 Demo
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.currencyTab, currencyTab === 'fiat' && styles.currencyTabActive]}
                    onPress={() => setCurrencyTab('fiat')}
                >
                    <Text style={[styles.currencyTabText, currencyTab === 'fiat' && styles.currencyTabTextActive]}>
                        💰 Dinero Real
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Balance */}
            <View style={styles.balanceBar}>
                <Text style={styles.balanceLabel}>Saldo disponible:</Text>
                <Text style={styles.balanceAmount}>${balance.toLocaleString()}</Text>
            </View>

            {/* Level Selection */}
            <Text style={styles.sectionTitle}>Selecciona tu nivel</Text>
            <View style={styles.levelsGrid}>
                {LEVELS.map((lvl) => {
                    const isSelected = selectedLevel === lvl.level;
                    const canAfford = balance >= lvl.betAmountCLP;

                    return (
                        <TouchableOpacity
                            key={lvl.level}
                            style={[
                                styles.levelCard,
                                isSelected && { borderColor: lvl.colorHex, borderWidth: 2 },
                                !canAfford && styles.levelDisabled,
                            ]}
                            onPress={() => canAfford && setLevel(lvl.level)}
                            disabled={!canAfford}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.levelBadge, { backgroundColor: lvl.colorHex }]}>
                                <Text style={styles.levelNumber}>{lvl.level}</Text>
                            </View>
                            <Text style={styles.levelBet}>${lvl.betAmountCLP.toLocaleString()}</Text>
                            <Text style={styles.levelPrize}>🏆 ${lvl.prizeToWinner.toLocaleString()}</Text>
                            <Text style={styles.levelCommission}>{lvl.commissionPercent}% com.</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Action Button */}
            {phase === 'queue' ? (
                <View style={styles.queueContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.queueText}>Buscando oponente...</Text>
                    <Text style={styles.queueSubtext}>Nivel {selectedLevel}</Text>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleLeaveQueue}>
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity activeOpacity={0.85} onPress={handleJoinQueue}>
                    <LinearGradient
                        colors={['#FFD700', '#F59E0B']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.playButton}
                    >
                        <Ionicons name="search" size={22} color="#000" />
                        <Text style={styles.playButtonText}>BUSCAR PARTIDA</Text>
                    </LinearGradient>
                </TouchableOpacity>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { padding: Spacing.xl, paddingTop: 60, paddingBottom: 100 },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: '900',
        color: Colors.textPrimary,
        marginBottom: Spacing.xl,
    },
    currencyTabs: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: 4,
        marginBottom: Spacing.lg,
    },
    currencyTab: {
        flex: 1,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        borderRadius: BorderRadius.sm,
    },
    currencyTabActive: {
        backgroundColor: Colors.surfaceLight,
    },
    currencyTabText: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.textMuted,
    },
    currencyTabTextActive: {
        color: Colors.textPrimary,
    },
    balanceBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.lg,
        marginBottom: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    balanceLabel: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    balanceAmount: {
        fontSize: FontSize.lg,
        fontWeight: '900',
        color: Colors.primary,
    },
    sectionTitle: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    levelsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
    },
    levelCard: {
        width: '30%',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    levelDisabled: {
        opacity: 0.35,
    },
    levelBadge: {
        width: 32,
        height: 32,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.xs,
    },
    levelNumber: {
        fontSize: FontSize.sm,
        fontWeight: '900',
        color: '#000',
    },
    levelBet: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    levelPrize: {
        fontSize: FontSize.xs,
        color: Colors.success,
        marginTop: 2,
    },
    levelCommission: {
        fontSize: FontSize.xs,
        color: Colors.textMuted,
        marginTop: 2,
    },
    playButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.xl,
    },
    playButtonText: {
        fontSize: FontSize.lg,
        fontWeight: '900',
        color: '#000',
        letterSpacing: 2,
    },
    queueContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.xxl,
        gap: Spacing.md,
    },
    queueText: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.primary,
    },
    queueSubtext: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
    },
    cancelButton: {
        backgroundColor: Colors.surfaceLight,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.xxl,
        paddingVertical: Spacing.md,
        marginTop: Spacing.md,
    },
    cancelButtonText: {
        color: Colors.error,
        fontWeight: '700',
        fontSize: FontSize.md,
    },
});
