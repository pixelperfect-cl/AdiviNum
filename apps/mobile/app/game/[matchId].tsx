import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useGameStore } from '@/stores/gameStore';
import { useUserStore } from '@/stores/userStore';
import { setSecret, makeGuess, surrender, joinQueue } from '@/services/socketService';
import { isValidSecret, isValidGuess, getLevelConfig } from '@adivinum/shared';

export default function GameScreen() {
    const { matchId } = useLocalSearchParams<{ matchId: string }>();
    const phase = useGameStore((s) => s.phase);
    const myRole = useGameStore((s) => s.myRole);
    const currentTurn = useGameStore((s) => s.currentTurn);
    const isMyTurn = useGameStore((s) => s.isMyTurn);
    const myAttempts = useGameStore((s) => s.myAttempts);
    const opponentAttempts = useGameStore((s) => s.opponentAttempts);
    const myTimeRemaining = useGameStore((s) => s.myTimeRemaining);
    const opponentTimeRemaining = useGameStore((s) => s.opponentTimeRemaining);
    const level = useGameStore((s) => s.level);
    const result = useGameStore((s) => s.result);
    const winnerId = useGameStore((s) => s.winnerId);
    const winnerFirebaseUid = useGameStore((s) => s.winnerFirebaseUid);
    const winnerPrize = useGameStore((s) => s.winnerPrize);
    const isLastChance = useGameStore((s) => s.isLastChance);
    const secretTimerSeconds = useGameStore((s) => s.secretTimerSeconds);
    const totalRounds = useGameStore((s) => s.totalRounds);
    const currentRound = useGameStore((s) => s.currentRound);
    const myWins = useGameStore((s) => s.myWins);
    const opponentWins = useGameStore((s) => s.opponentWins);
    const resetGame = useGameStore((s) => s.resetGame);
    const myUserId = useUserStore((s) => s.user?.id);

    const [inputDigits, setInputDigits] = useState<string[]>(['', '', '', '']);
    const [secretSet, setSecretSet] = useState(false);
    const [myTimer, setMyTimer] = useState(myTimeRemaining);
    const [oppTimer, setOppTimer] = useState(opponentTimeRemaining);
    const [localSecretTimer, setLocalSecretTimer] = useState<number | null>(null);

    const config = getLevelConfig(level);

    // Reset secretSet when a new round begins
    useEffect(() => {
        if (currentRound > 1) {
            setSecretSet(false);
            setInputDigits(['', '', '', '']);
        }
    }, [currentRound]);

    // Secret timer countdown
    useEffect(() => {
        if (secretTimerSeconds !== null) {
            setLocalSecretTimer(secretTimerSeconds);
        }
    }, [secretTimerSeconds]);

    useEffect(() => {
        if (localSecretTimer === null || localSecretTimer <= 0 || secretSet && phase === 'set_secret') return;
        if (phase === 'playing' || phase === 'game_over') {
            setLocalSecretTimer(null);
            return;
        }
        const interval = setInterval(() => {
            setLocalSecretTimer((t) => (t !== null ? Math.max(0, t - 1) : null));
        }, 1000);
        return () => clearInterval(interval);
    }, [localSecretTimer, phase, secretSet]);

    // Timer countdown
    useEffect(() => {
        setMyTimer(myTimeRemaining);
        setOppTimer(opponentTimeRemaining);
    }, [myTimeRemaining, opponentTimeRemaining]);

    useEffect(() => {
        if (phase !== 'playing') return;
        const interval = setInterval(() => {
            if (isMyTurn) {
                setMyTimer((t) => Math.max(0, t - 1000));
            } else {
                setOppTimer((t) => Math.max(0, t - 1000));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [phase, isMyTurn]);

    const formatTime = (ms: number) => {
        const mins = Math.floor(ms / 60000);
        const secs = Math.floor((ms % 60000) / 1000);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleDigitPress = (digit: string) => {
        const firstEmpty = inputDigits.findIndex((d) => d === '');
        if (firstEmpty === -1) return;
        const newDigits = [...inputDigits];
        newDigits[firstEmpty] = digit;
        setInputDigits(newDigits);
    };

    const handleDelete = () => {
        const lastFilled = inputDigits.reduce((last, d, i) => (d !== '' ? i : last), -1);
        if (lastFilled === -1) return;
        const newDigits = [...inputDigits];
        newDigits[lastFilled] = '';
        setInputDigits(newDigits);
    };

    const handleSubmit = () => {
        const number = inputDigits.join('');
        if (number.length !== 4) return;

        if (!secretSet) {
            if (!isValidSecret(number)) {
                Alert.alert('Número inválido', '4 cifras únicas, sin comenzar en 0');
                return;
            }
            setSecret(matchId!, number);
            useGameStore.getState().setSecret(number);
            useGameStore.getState().setPhase('set_secret');
            setSecretSet(true);
            setInputDigits(['', '', '', '']);
        } else {
            if (!isValidGuess(number)) {
                Alert.alert('Intento inválido', '4 cifras únicas, sin comenzar en 0');
                return;
            }
            makeGuess(matchId!, number);
            setInputDigits(['', '', '', '']);
        }
    };

    const handleSurrender = () => {
        Alert.alert('¿Rendirte?', 'Perderás el 100% de tu apuesta', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Sí, rendirme',
                style: 'destructive',
                onPress: () => surrender(matchId!),
            },
        ]);
    };

    const handleGoHome = () => {
        resetGame();
        router.replace('/(tabs)');
    };

    const handleSearchMatch = () => {
        resetGame();
        router.replace('/(tabs)/play');
    };

    // Use winnerFirebaseUid (socket-level ID) for correct comparison
    const iWon = winnerFirebaseUid ? winnerFirebaseUid === myUserId : winnerId === myUserId;
    const isDraw = result?.includes('DRAW');
    const isTimeout = result?.includes('TIMEOUT');
    const isAbandon = result?.includes('ABANDON');
    const isSecretTimeout = isTimeout && !(myAttempts.length > 0 || opponentAttempts.length > 0);

    // ---- Game Over Screen ----
    if (phase === 'game_over') {
        let emoji = '😔';
        let title = 'Derrota';
        let subtitle = '';
        let gradientColors: [string, string] = ['#0A0E1A', '#2E0A0A'];

        if (isDraw) {
            emoji = '🤝';
            title = '¡EMPATE!';
            subtitle = 'Ambos adivinaron el número';
            gradientColors = ['#0A0E1A', '#1A1A0A'];
        } else if (iWon) {
            emoji = '🏆';
            title = '¡VICTORIA!';
            gradientColors = ['#0A0E1A', '#1A2E0A'];
            if (isTimeout) subtitle = 'Tu oponente se quedó sin tiempo';
            else if (isAbandon) subtitle = 'Tu oponente abandonó la partida';
            else subtitle = '¡Adivinaste el número secreto!';
        } else {
            emoji = '😔';
            title = 'Derrota';
            if (isSecretTimeout) subtitle = 'No fijaste tu número secreto a tiempo';
            else if (isTimeout) subtitle = 'Se te acabó el tiempo';
            else if (isAbandon) subtitle = 'Abandonaste la partida';
            else subtitle = 'Tu oponente adivinó tu número';
        }

        return (
            <LinearGradient
                colors={gradientColors}
                style={styles.container}
            >
                <View style={styles.gameOverContainer}>
                    <Text style={styles.gameOverEmoji}>{emoji}</Text>
                    <Text style={styles.gameOverTitle}>{title}</Text>
                    <Text style={styles.gameOverResult}>{subtitle}</Text>
                    {iWon && winnerPrize > 0 && (
                        <Text style={styles.prizeText}>+${winnerPrize.toLocaleString()}</Text>
                    )}
                    <TouchableOpacity style={styles.searchButton} onPress={handleSearchMatch}>
                        <LinearGradient
                            colors={['#FFD700', '#F59E0B']}
                            style={styles.searchButtonGradient}
                        >
                            <Text style={styles.searchButtonText}>🔍 Buscar nueva partida</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.homeButton} onPress={handleGoHome}>
                        <Text style={styles.homeButtonText}>Volver al inicio</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        );
    }

    // Available digits (excluding already typed ones)
    const usedDigits = new Set(inputDigits.filter((d) => d !== ''));

    return (
        <View style={styles.container}>
            {/* Header with timers */}
            <View style={styles.header}>
                <View style={[styles.timerBox, !isMyTurn && phase === 'playing' && styles.timerActive]}>
                    <Text style={styles.timerLabel}>Oponente</Text>
                    <Text style={[styles.timerValue, !isMyTurn && styles.timerValueActive]}>
                        {formatTime(oppTimer || config.timeSeconds * 1000)}
                    </Text>
                </View>
                <View style={styles.headerCenter}>
                    <Text style={styles.levelIndicator}>Nv.{level}</Text>
                    <Text style={styles.vsText}>VS</Text>
                </View>
                <View style={[styles.timerBox, isMyTurn && phase === 'playing' && styles.timerActive]}>
                    <Text style={styles.timerLabel}>Tú</Text>
                    <Text style={[styles.timerValue, isMyTurn && styles.timerValueActive]}>
                        {formatTime(myTimer || config.timeSeconds * 1000)}
                    </Text>
                </View>
            </View>

            {/* Round indicator for multi-round matches */}
            {totalRounds > 1 && (
                <View style={styles.roundBar}>
                    <Text style={{ color: '#94A3B8', fontSize: FontSize.xs }}>
                        🔄 Ronda {currentRound}/{totalRounds}
                    </Text>
                    <Text style={{ color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' }}>
                        {myWins} - {opponentWins}
                    </Text>
                </View>
            )}

            {/* Phase indicator */}
            {!secretSet && phase !== 'playing' && (
                <View style={styles.phaseBar}>
                    <Text style={styles.phaseText}>
                        🔐 Elige tu número secreto {localSecretTimer !== null && localSecretTimer > 0 ? `(${localSecretTimer}s)` : ''}
                    </Text>
                </View>
            )}
            {secretSet && phase === 'set_secret' && (
                <View style={styles.phaseBar}>
                    <Text style={styles.phaseText}>
                        ⏳ Esperando al oponente... {localSecretTimer !== null && localSecretTimer > 0 ? `(${localSecretTimer}s)` : ''}
                    </Text>
                </View>
            )}
            {phase === 'playing' && (
                <View style={[styles.phaseBar, isMyTurn ? styles.myTurnBar : styles.oppTurnBar]}>
                    <Text style={styles.phaseText}>
                        {isLastChance && isMyTurn
                            ? '⚡ ¡MATCH POINT! Tu oponente adivinó. ¡Último intento!'
                            : isLastChance && !isMyTurn
                            ? '⚡ ¡MATCH POINT! Esperando último intento del oponente...'
                            : isMyTurn ? '🎯 ¡Tu turno!' : '⏳ Turno del oponente'}
                    </Text>
                </View>
            )}

            {/* Attempts History */}
            <ScrollView style={styles.attemptsContainer}>
                <Text style={styles.attemptsTitle}>Mis intentos ({myAttempts.length}/10)</Text>
                {myAttempts.map((a, i) => (
                    <View key={i} style={styles.attemptRow}>
                        <Text style={styles.attemptNumber}>#{i + 1}</Text>
                        <View style={styles.attemptDigits}>
                            {a.guess.split('').map((d, j) => (
                                <View key={j} style={styles.digitBox}>
                                    <Text style={styles.digitText}>{d}</Text>
                                </View>
                            ))}
                        </View>
                        <View style={styles.attemptResult}>
                            <Text style={styles.famasBadge}>{a.famas}F</Text>
                            <Text style={styles.toquesBadge}>{a.toques}T</Text>
                        </View>
                    </View>
                ))}

                {opponentAttempts.length > 0 && (
                    <>
                        <Text style={[styles.attemptsTitle, { marginTop: Spacing.lg }]}>
                            Oponente ({opponentAttempts.length}/10)
                        </Text>
                        {opponentAttempts.map((a, i) => (
                            <View key={i} style={styles.attemptRow}>
                                <Text style={styles.attemptNumber}>#{i + 1}</Text>
                                <View style={styles.attemptDigits}>
                                    {a.guess.split('').map((d, j) => (
                                        <View key={j} style={[styles.digitBox, styles.digitBoxOpponent]}>
                                            <Text style={styles.digitText}>{d}</Text>
                                        </View>
                                    ))}
                                </View>
                                <View style={styles.attemptResult}>
                                    <Text style={styles.famasBadge}>{a.famas}F</Text>
                                    <Text style={styles.toquesBadge}>{a.toques}T</Text>
                                </View>
                            </View>
                        ))}
                    </>
                )}
            </ScrollView>

            {/* Input Area */}
            <View style={styles.inputArea}>
                {/* Display digits */}
                <View style={styles.inputDisplay}>
                    {inputDigits.map((d, i) => (
                        <View key={i} style={[styles.inputSlot, d ? styles.inputSlotFilled : null]}>
                            <Text style={styles.inputSlotText}>{d || '·'}</Text>
                        </View>
                    ))}
                </View>

                {/* Numpad */}
                <View style={styles.numpad}>
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
                        <TouchableOpacity
                            key={n}
                            style={[styles.numKey, usedDigits.has(n) && styles.numKeyUsed]}
                            onPress={() => handleDigitPress(n)}
                            disabled={usedDigits.has(n) || inputDigits.every((d) => d !== '') || (phase === 'playing' && !isMyTurn)}
                        >
                            <Text style={[styles.numKeyText, usedDigits.has(n) && styles.numKeyTextUsed]}>
                                {n}
                            </Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={styles.numKey} onPress={handleSurrender}>
                        <Text style={[styles.numKeyText, { color: Colors.error, fontSize: 18 }]}>🏳️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.numKey, usedDigits.has('0') && styles.numKeyUsed]}
                        onPress={() => handleDigitPress('0')}
                        disabled={usedDigits.has('0') || inputDigits.every((d) => d !== '')}
                    >
                        <Text style={[styles.numKeyText, usedDigits.has('0') && styles.numKeyTextUsed]}>0</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.numKey} onPress={handleDelete}>
                        <Text style={[styles.numKeyText, { fontSize: 20 }]}>⌫</Text>
                    </TouchableOpacity>
                </View>

                {/* Submit button */}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        inputDigits.some((d) => d === '') && styles.submitButtonDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={inputDigits.some((d) => d === '') || (phase === 'playing' && !isMyTurn)}
                >
                    <LinearGradient
                        colors={
                            inputDigits.every((d) => d !== '')
                                ? ['#FFD700', '#F59E0B']
                                : [Colors.surfaceLight, Colors.surfaceLight]
                        }
                        style={styles.submitGradient}
                    >
                        <Text
                            style={[
                                styles.submitText,
                                inputDigits.some((d) => d === '') && { color: Colors.textMuted },
                            ]}
                        >
                            {!secretSet ? '🔐 FIJAR SECRETO' : '🎯 ADIVINAR'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: 50,
        paddingBottom: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    timerBox: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        alignItems: 'center',
        minWidth: 100,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    timerActive: { borderColor: Colors.primary },
    timerLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '600' },
    timerValue: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.textSecondary },
    timerValueActive: { color: Colors.primary },
    headerCenter: { alignItems: 'center' },
    levelIndicator: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: '700' },
    vsText: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.textPrimary },
    // Phase
    phaseBar: {
        paddingVertical: Spacing.md,
        alignItems: 'center',
        backgroundColor: Colors.surface,
    },
    myTurnBar: { backgroundColor: Colors.primary + '15' },
    oppTurnBar: { backgroundColor: Colors.surface },
    phaseText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
    // Attempts
    attemptsContainer: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
    attemptsTitle: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginBottom: Spacing.sm,
    },
    attemptRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
        gap: Spacing.md,
    },
    attemptNumber: { fontSize: FontSize.xs, color: Colors.textMuted, width: 24 },
    attemptDigits: { flexDirection: 'row', gap: Spacing.xs },
    digitBox: {
        width: 36,
        height: 36,
        backgroundColor: Colors.surfaceLight,
        borderRadius: BorderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
    },
    digitBoxOpponent: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
    digitText: { fontSize: FontSize.md, fontWeight: '800', color: Colors.textPrimary },
    attemptResult: { flexDirection: 'row', gap: Spacing.xs },
    famasBadge: {
        fontSize: FontSize.sm,
        fontWeight: '900',
        color: Colors.fama,
        backgroundColor: Colors.fama + '20',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
        overflow: 'hidden',
    },
    toquesBadge: {
        fontSize: FontSize.sm,
        fontWeight: '900',
        color: Colors.toque,
        backgroundColor: Colors.toque + '20',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: BorderRadius.sm,
        overflow: 'hidden',
    },
    // Input
    inputArea: {
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        padding: Spacing.md,
        backgroundColor: Colors.backgroundLight,
    },
    inputDisplay: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    inputSlot: {
        width: 52,
        height: 52,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: Colors.border,
    },
    inputSlotFilled: { borderColor: Colors.primary },
    inputSlotText: {
        fontSize: FontSize.xxl,
        fontWeight: '900',
        color: Colors.textPrimary,
    },
    numpad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    numKey: {
        width: 60,
        height: 44,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    numKeyUsed: { opacity: 0.25 },
    numKeyText: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary },
    numKeyTextUsed: { color: Colors.textMuted },
    submitButton: { borderRadius: BorderRadius.md, overflow: 'hidden' },
    submitButtonDisabled: { opacity: 0.5 },
    submitGradient: {
        paddingVertical: Spacing.lg,
        alignItems: 'center',
        borderRadius: BorderRadius.md,
    },
    submitText: { fontSize: FontSize.md, fontWeight: '900', color: '#000', letterSpacing: 1 },
    // Game over
    gameOverContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xxl,
    },
    gameOverEmoji: { fontSize: 80, marginBottom: Spacing.lg },
    gameOverTitle: { fontSize: FontSize.display, fontWeight: '900', color: Colors.textPrimary },
    gameOverResult: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.sm },
    prizeText: {
        fontSize: FontSize.xxxl,
        fontWeight: '900',
        color: Colors.success,
        marginTop: Spacing.lg,
    },
    homeButton: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.xxxl,
        paddingVertical: Spacing.lg,
        marginTop: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    homeButtonText: { color: Colors.primary, fontWeight: '700', fontSize: FontSize.md },
    searchButton: {
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
        marginTop: Spacing.xxl,
        width: '100%',
    },
    searchButtonGradient: {
        paddingVertical: Spacing.lg,
        alignItems: 'center',
        borderRadius: BorderRadius.md,
    },
    searchButtonText: { fontSize: FontSize.md, fontWeight: '900', color: '#000', letterSpacing: 1 },
    roundBar: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.primary + '08',
        borderBottomWidth: 1,
        borderBottomColor: Colors.primary + '20',
    },
});
