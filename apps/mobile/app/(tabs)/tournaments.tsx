import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { api } from '@/services/apiClient';
import { useUserStore } from '@/stores/userStore';

interface Tournament {
    id: string;
    name: string;
    description?: string;
    format: string;
    level: number;
    entryFee: number;
    currencyType: string;
    prizePool: number;
    maxPlayers: number;
    status: string;
    startsAt: string;
    registrationDeadline: string;
    _count: { participants: number };
}

type TournamentTabKey = 'daily' | 'weekly' | 'monthly' | 'active';

const TOURNAMENT_TABS: { key: TournamentTabKey; label: string; icon: string }[] = [
    { key: 'daily', label: 'Diarios', icon: '📅' },
    { key: 'weekly', label: 'Semanales', icon: '📆' },
    { key: 'monthly', label: 'Mensuales', icon: '🗓️' },
    { key: 'active', label: 'Activos', icon: '🔴' },
];

export default function TournamentsScreen() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TournamentTabKey>('daily');
    const user = useUserStore((s) => s.user);

    useEffect(() => {
        loadTournaments();
    }, [activeTab]);

    const loadTournaments = async () => {
        setLoading(true);
        try {
            let data: Tournament[];
            if (activeTab === 'active') {
                data = await api.listTournaments({ status: 'IN_PROGRESS' }) as Tournament[];
            } else {
                data = await api.listTournaments({ schedule: activeTab }) as Tournament[];
            }
            setTournaments(data);
        } catch (err) {
            console.error('Failed to load tournaments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (tournament: Tournament) => {
        if (!user) return;

        Alert.alert(
            'Confirmar inscripción',
            `¿Inscribirte en "${tournament.name}" por $${tournament.entryFee.toLocaleString()}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Inscribirse',
                    onPress: async () => {
                        setRegistering(tournament.id);
                        try {
                            await api.registerForTournament(tournament.id, user.id);
                            Alert.alert('✅ ¡Inscrito!', 'Ya estás en el torneo');
                            loadTournaments(); // Refresh
                        } catch (err: any) {
                            Alert.alert('Error', err.message);
                        } finally {
                            setRegistering(null);
                        }
                    },
                },
            ],
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'REGISTRATION': return '#10B981';
            case 'IN_PROGRESS': return '#F59E0B';
            case 'FINISHED': return '#6B7280';
            default: return Colors.textMuted;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'REGISTRATION': return '🟢 Abierto';
            case 'IN_PROGRESS': return '🟡 En curso';
            case 'FINISHED': return '⚫ Finalizado';
            default: return status;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const renderTournament = ({ item }: { item: Tournament }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.tournamentName}>{item.name}</Text>
                    {item.description && (
                        <Text style={styles.description}>{item.description}</Text>
                    )}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {getStatusLabel(item.status)}
                    </Text>
                </View>
            </View>

            <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Nivel</Text>
                    <Text style={styles.infoValue}>{item.level}</Text>
                </View>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Inscripción</Text>
                    <Text style={styles.infoValue}>
                        ${item.entryFee.toLocaleString()}
                    </Text>
                </View>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Pozo</Text>
                    <Text style={[styles.infoValue, { color: Colors.primary }]}>
                        ${item.prizePool.toLocaleString()}
                    </Text>
                </View>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Jugadores</Text>
                    <Text style={styles.infoValue}>
                        {item._count.participants}/{item.maxPlayers}
                    </Text>
                </View>
            </View>

            <View style={styles.dateRow}>
                <Text style={styles.dateText}>📅 {formatDate(item.startsAt)}</Text>
                <Text style={styles.formatBadge}>
                    {item.format === 'SINGLE_ELIMINATION' ? '🏆 Eliminación' : '🔄 Liga'}
                </Text>
            </View>

            {item.status === 'REGISTRATION' && (
                <TouchableOpacity
                    style={styles.registerButton}
                    onPress={() => handleRegister(item)}
                    disabled={registering === item.id}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#FFD700', '#F59E0B']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientBtn}
                    >
                        {registering === item.id ? (
                            <ActivityIndicator color="#000" size="small" />
                        ) : (
                            <Text style={styles.registerText}>⚔️ Inscribirse</Text>
                        )}
                    </LinearGradient>
                </TouchableOpacity>
            )}
            {item.status === 'IN_PROGRESS' && (
                <TouchableOpacity
                    style={[styles.registerButton, { opacity: 0.85 }]}
                    activeOpacity={0.8}
                >
                    <View style={[styles.gradientBtn, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: '#F59E0B40' }]}>
                        <Text style={[styles.registerText, { color: '#F59E0B' }]}>👁️ Espectador</Text>
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>🏟️ TORNEOS</Text>
                <Text style={styles.subtitle}>Compite por premios mayores</Text>
            </View>

            {/* Sub-tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabBar}
                contentContainerStyle={styles.tabBarContent}
            >
                {TOURNAMENT_TABS.map((tab) => (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.tabItem,
                            activeTab === tab.key && styles.tabItemActive,
                        ]}
                        onPress={() => setActiveTab(tab.key)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.tabIcon}>{tab.icon}</Text>
                        <Text style={[
                            styles.tabLabel,
                            activeTab === tab.key && styles.tabLabelActive,
                        ]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {loading ? (
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : tournaments.length === 0 ? (
                <View style={styles.centered}>
                    <Text style={styles.emptyIcon}>
                        {activeTab === 'active' ? '🏟️' : '🕐'}
                    </Text>
                    <Text style={styles.emptyText}>
                        {activeTab === 'active' ? 'No hay torneos en curso' : 'No hay torneos disponibles'}
                    </Text>
                    <Text style={styles.emptySubtext}>
                        {activeTab === 'active' ? 'Vuelve cuando haya torneos activos' : 'Vuelve pronto para nuevos torneos'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={tournaments}
                    keyExtractor={(item) => item.id}
                    renderItem={renderTournament}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        paddingHorizontal: Spacing.xl,
        paddingTop: 60,
        paddingBottom: Spacing.sm,
    },
    title: {
        fontSize: FontSize.xxl,
        fontWeight: '900',
        color: Colors.primary,
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    // Tab bar
    tabBar: {
        maxHeight: 56,
        marginBottom: Spacing.sm,
    },
    tabBarContent: {
        paddingHorizontal: Spacing.lg,
        gap: 8,
    },
    tabItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 6,
    },
    tabItemActive: {
        backgroundColor: '#FFD70020',
        borderColor: '#FFD700',
    },
    tabIcon: { fontSize: 16 },
    tabLabel: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    tabLabelActive: {
        color: Colors.primary,
        fontWeight: '800',
    },
    // List
    list: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },
    card: {
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    tournamentName: {
        fontSize: FontSize.lg,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    description: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
    },
    statusBadge: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
    },
    statusText: { fontSize: FontSize.xs, fontWeight: '700' },
    infoGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    infoItem: { alignItems: 'center' },
    infoLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 2 },
    infoValue: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    dateText: { fontSize: FontSize.sm, color: Colors.textSecondary },
    formatBadge: { fontSize: FontSize.xs, color: Colors.primary },
    registerButton: {
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
    },
    gradientBtn: {
        paddingVertical: Spacing.md,
        alignItems: 'center',
        borderRadius: BorderRadius.md,
    },
    registerText: {
        fontSize: FontSize.md,
        fontWeight: '800',
        color: '#000',
        letterSpacing: 1,
    },
    emptyIcon: { fontSize: 64, marginBottom: Spacing.md },
    emptyText: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    emptySubtext: {
        fontSize: FontSize.sm,
        color: Colors.textMuted,
        marginTop: Spacing.xs,
    },
});

