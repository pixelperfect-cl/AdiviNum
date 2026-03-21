import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Modal,
    ScrollView,
    TextInput,
    Alert,
    Dimensions,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { API_URL } from '@/constants/theme';
import { getIdToken } from '@/services/supabaseAuth';

/* ── Types ── */

interface Friend {
    friendshipId: string;
    friend: {
        id: string;
        username: string;
        avatarUrl: string | null;
        eloRating: number;
        gamesWon: number;
        gamesPlayed: number;
    };
}

interface PendingRequest {
    friendshipId: string;
    sender: {
        id: string;
        username: string;
        avatarUrl: string | null;
        eloRating: number;
    };
    createdAt: string;
}

interface SearchUser {
    id: string;
    username: string;
    avatarUrl: string | null;
    eloRating: number;
}

type PanelTab = 'friends' | 'chats' | 'rooms';
type FriendsSubTab = 'list' | 'pending' | 'search';

/* ── API helper ── */

async function apiRequest<T>(path: string, method = 'GET', body?: object): Promise<T> {
    const token = await getIdToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `HTTP ${res.status}`);
    }
    return res.json();
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/* ── Component ── */

export function SocialFab() {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState<PanelTab>('friends');
    const [friendsSubTab, setFriendsSubTab] = useState<FriendsSubTab>('list');

    const [friends, setFriends] = useState<Friend[]>([]);
    const [pending, setPending] = useState<PendingRequest[]>([]);
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Pulse animation
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.08, duration: 1500, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    const loadFriends = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiRequest<Friend[]>('/friends');
            setFriends(data);
        } catch { setFriends([]); }
        setLoading(false);
    }, []);

    const loadPending = useCallback(async () => {
        try {
            const data = await apiRequest<PendingRequest[]>('/friends/pending');
            setPending(data);
        } catch { setPending([]); }
    }, []);

    useEffect(() => {
        if (open) {
            loadFriends();
            loadPending();
        }
    }, [open]);

    const handleSearch = async (q: string) => {
        setSearchQuery(q);
        if (q.length < 2) { setSearchResults([]); return; }
        try {
            const data = await apiRequest<SearchUser[]>(`/friends/search?q=${encodeURIComponent(q)}`);
            setSearchResults(data);
        } catch { setSearchResults([]); }
    };

    const sendRequest = async (userId: string) => {
        setActionLoading(userId);
        try {
            await apiRequest(`/friends/request/${userId}`, 'POST', {});
            setSearchResults(prev => prev.filter(u => u.id !== userId));
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Error al enviar solicitud');
        }
        setActionLoading(null);
    };

    const acceptRequest = async (friendshipId: string) => {
        setActionLoading(friendshipId);
        try {
            await apiRequest(`/friends/${friendshipId}/accept`, 'POST', {});
            setPending(prev => prev.filter(p => p.friendshipId !== friendshipId));
            loadFriends();
        } catch { /* ignore */ }
        setActionLoading(null);
    };

    const rejectRequest = async (friendshipId: string) => {
        setActionLoading(friendshipId);
        try {
            await apiRequest(`/friends/${friendshipId}/reject`, 'POST', {});
            setPending(prev => prev.filter(p => p.friendshipId !== friendshipId));
        } catch { /* ignore */ }
        setActionLoading(null);
    };

    const removeFriend = async (friendshipId: string) => {
        Alert.alert('Eliminar amigo', '¿Estás seguro?', [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Eliminar', style: 'destructive', onPress: async () => {
                    setActionLoading(friendshipId);
                    try {
                        await apiRequest(`/friends/${friendshipId}`, 'DELETE');
                        setFriends(prev => prev.filter(f => f.friendshipId !== friendshipId));
                    } catch { /* ignore */ }
                    setActionLoading(null);
                }
            },
        ]);
    };

    const pendingCount = pending.length;

    const handleFabPress = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 0.85, duration: 100, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();
        setOpen(true);
    };

    /* ── Render helpers ── */

    const renderAvatar = (username: string) => (
        <View style={s.avatar}>
            <Text style={s.avatarText}>{username.charAt(0).toUpperCase()}</Text>
        </View>
    );

    const renderFriendsList = () => (
        <ScrollView style={s.listScroll}>
            {loading ? (
                <Text style={s.emptyText}>Cargando...</Text>
            ) : friends.length === 0 ? (
                <View style={s.emptyState}>
                    <Text style={s.emptyIcon}>👥</Text>
                    <Text style={s.emptyText}>Aún no tienes amigos</Text>
                    <TouchableOpacity style={s.actionBtn} onPress={() => setFriendsSubTab('search')}>
                        <Text style={s.actionBtnText}>🔍 Buscar jugadores</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                friends.map(f => (
                    <View key={f.friendshipId} style={s.userRow}>
                        {renderAvatar(f.friend.username)}
                        <View style={s.userInfo}>
                            <Text style={s.username}>{f.friend.username}</Text>
                            <Text style={s.userMeta}>⭐ {f.friend.eloRating}</Text>
                        </View>
                        <TouchableOpacity
                            style={s.iconBtnDanger}
                            onPress={() => removeFriend(f.friendshipId)}
                            disabled={actionLoading === f.friendshipId}
                        >
                            <Text style={s.iconBtnText}>✕</Text>
                        </TouchableOpacity>
                    </View>
                ))
            )}
        </ScrollView>
    );

    const renderPending = () => (
        <ScrollView style={s.listScroll}>
            {pending.length === 0 ? (
                <View style={s.emptyState}>
                    <Text style={s.emptyIcon}>📩</Text>
                    <Text style={s.emptyText}>No tienes solicitudes pendientes</Text>
                </View>
            ) : (
                pending.map(p => (
                    <View key={p.friendshipId} style={s.userRow}>
                        {renderAvatar(p.sender.username)}
                        <View style={s.userInfo}>
                            <Text style={s.username}>{p.sender.username}</Text>
                            <Text style={s.userMeta}>⭐ {p.sender.eloRating}</Text>
                        </View>
                        <View style={s.rowActions}>
                            <TouchableOpacity
                                style={s.iconBtnSuccess}
                                onPress={() => acceptRequest(p.friendshipId)}
                                disabled={actionLoading === p.friendshipId}
                            >
                                <Text style={[s.iconBtnText, { color: Colors.success }]}>✓</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={s.iconBtnDanger}
                                onPress={() => rejectRequest(p.friendshipId)}
                                disabled={actionLoading === p.friendshipId}
                            >
                                <Text style={s.iconBtnText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))
            )}
        </ScrollView>
    );

    const renderSearch = () => (
        <ScrollView style={s.listScroll}>
            <View style={s.searchBox}>
                <TextInput
                    style={s.searchInput}
                    placeholder="Buscar jugadores..."
                    placeholderTextColor={Colors.textMuted}
                    value={searchQuery}
                    onChangeText={handleSearch}
                    autoFocus
                />
            </View>
            {searchResults.map(u => (
                <View key={u.id} style={s.userRow}>
                    {renderAvatar(u.username)}
                    <View style={s.userInfo}>
                        <Text style={s.username}>{u.username}</Text>
                        <Text style={s.userMeta}>⭐ {u.eloRating}</Text>
                    </View>
                    <TouchableOpacity
                        style={s.actionBtnSm}
                        onPress={() => sendRequest(u.id)}
                        disabled={actionLoading === u.id}
                    >
                        <Text style={s.actionBtnText}>{actionLoading === u.id ? '...' : '➕'}</Text>
                    </TouchableOpacity>
                </View>
            ))}
            {searchQuery.length >= 2 && searchResults.length === 0 && (
                <Text style={s.emptyText}>No se encontraron jugadores</Text>
            )}
        </ScrollView>
    );

    const renderPlaceholder = (icon: string, title: string, desc: string) => (
        <View style={s.placeholder}>
            <Text style={s.placeholderIcon}>{icon}</Text>
            <Text style={s.placeholderTitle}>{title}</Text>
            <Text style={s.placeholderDesc}>{desc}</Text>
        </View>
    );

    const panelTabs: { key: PanelTab; icon: string; label: string }[] = [
        { key: 'friends', icon: '👥', label: 'Amigos' },
        { key: 'chats', icon: '💬', label: 'Chats' },
        { key: 'rooms', icon: '🌐', label: 'Salas' },
    ];

    const subTabs: { key: FriendsSubTab; icon: string; label: string }[] = [
        { key: 'list', icon: '👥', label: 'Amigos' },
        { key: 'pending', icon: '📩', label: 'Solicitudes' },
        { key: 'search', icon: '🔍', label: 'Buscar' },
    ];

    return (
        <>
            {/* FAB */}
            <Animated.View style={[s.fabContainer, { transform: [{ scale: open ? 1 : Animated.multiply(scaleAnim, pulseAnim) }] }]}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={s.fab}
                    onPress={handleFabPress}
                >
                    <Text style={s.fabIcon}>💬</Text>
                    {pendingCount > 0 && (
                        <View style={s.fabBadge}>
                            <Text style={s.fabBadgeText}>{pendingCount}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>

            {/* Modal */}
            <Modal visible={open} animationType="slide" transparent>
                <View style={s.modalOverlay}>
                    <View style={s.panel}>
                        {/* Header */}
                        <View style={s.panelHeader}>
                            <Text style={s.panelTitle}>Social</Text>
                            <TouchableOpacity style={s.closeBtn} onPress={() => setOpen(false)}>
                                <Text style={s.closeBtnText}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Main tabs */}
                        <View style={s.tabsRow}>
                            {panelTabs.map(t => (
                                <TouchableOpacity
                                    key={t.key}
                                    style={[s.tabBtn, tab === t.key && s.tabBtnActive]}
                                    onPress={() => setTab(t.key)}
                                >
                                    <Text style={[s.tabBtnText, tab === t.key && s.tabBtnTextActive]}>
                                        {t.icon} {t.label}
                                    </Text>
                                    {t.key === 'friends' && pendingCount > 0 && (
                                        <View style={s.tabBadge}>
                                            <Text style={s.tabBadgeText}>{pendingCount}</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Content */}
                        <View style={s.panelContent}>
                            {tab === 'friends' && (
                                <>
                                    {/* Sub-tabs */}
                                    <View style={s.subTabsRow}>
                                        {subTabs.map(st => (
                                            <TouchableOpacity
                                                key={st.key}
                                                style={[s.subTabBtn, friendsSubTab === st.key && s.subTabBtnActive]}
                                                onPress={() => setFriendsSubTab(st.key)}
                                            >
                                                <Text style={[s.subTabText, friendsSubTab === st.key && s.subTabTextActive]}>
                                                    {st.icon} {st.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    {friendsSubTab === 'list' && renderFriendsList()}
                                    {friendsSubTab === 'pending' && renderPending()}
                                    {friendsSubTab === 'search' && renderSearch()}
                                </>
                            )}
                            {tab === 'chats' && renderPlaceholder('💬', 'Chats', 'Próximamente podrás chatear con tus amigos en tiempo real.')}
                            {tab === 'rooms' && renderPlaceholder('🌐', 'Salas Públicas', 'Próximamente podrás unirte a salas de chat grupales.')}
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

/* ── Styles ── */

const s = StyleSheet.create({
    fabContainer: {
        position: 'absolute',
        right: 16,
        bottom: 80, // Above tab bar
        zIndex: 100,
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    fabIcon: { fontSize: 24 },
    fabBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: Colors.error,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
        borderWidth: 2,
        borderColor: Colors.background,
    },
    fabBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '800',
    },

    /* Modal & Panel */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    panel: {
        backgroundColor: Colors.backgroundLight,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '85%',
        overflow: 'hidden',
    },
    panelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    panelTitle: {
        fontSize: FontSize.xl,
        fontWeight: '900',
        color: Colors.primary,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtnText: { color: Colors.textMuted, fontSize: 14 },

    /* Tabs */
    tabsRow: {
        flexDirection: 'row',
        gap: 4,
        paddingHorizontal: 12,
        paddingTop: 12,
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: BorderRadius.md,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 4,
    },
    tabBtnActive: {
        backgroundColor: Colors.surface,
    },
    tabBtnText: {
        fontSize: FontSize.sm,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    tabBtnTextActive: {
        color: Colors.primary,
        fontWeight: '700',
    },
    tabBadge: {
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: Colors.error,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    tabBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '800',
    },

    /* Sub-tabs */
    subTabsRow: {
        flexDirection: 'row',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    subTabBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: BorderRadius.sm,
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    subTabBtnActive: {
        backgroundColor: Colors.primary,
    },
    subTabText: {
        fontSize: FontSize.xs,
        color: Colors.textMuted,
        fontWeight: '500',
    },
    subTabTextActive: {
        color: '#000',
        fontWeight: '700',
    },

    /* Panel content */
    panelContent: {
        flex: 1,
        backgroundColor: Colors.surface,
    },

    /* List */
    listScroll: { flex: 1, paddingHorizontal: 12, paddingTop: 8 },

    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: BorderRadius.md,
        marginBottom: 2,
    },

    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.surfaceLight,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontWeight: '700',
        fontSize: FontSize.sm,
        color: Colors.primary,
    },

    userInfo: { flex: 1 },
    username: {
        fontWeight: '600',
        fontSize: FontSize.sm,
        color: Colors.textPrimary,
    },
    userMeta: {
        fontSize: FontSize.xs,
        color: Colors.textMuted,
    },

    rowActions: { flexDirection: 'row', gap: 4 },

    iconBtnSuccess: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.success,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBtnDanger: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBtnText: { fontSize: 12, color: Colors.textMuted },

    actionBtn: {
        backgroundColor: Colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: BorderRadius.md,
        marginTop: 12,
    },
    actionBtnSm: {
        backgroundColor: Colors.primary,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: BorderRadius.sm,
    },
    actionBtnText: {
        color: '#000',
        fontWeight: '700',
        fontSize: FontSize.sm,
    },

    /* Search */
    searchBox: { marginBottom: 8 },
    searchInput: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.md,
        paddingHorizontal: 14,
        paddingVertical: 10,
        color: Colors.textPrimary,
        fontSize: FontSize.sm,
    },

    /* Empty */
    emptyState: { alignItems: 'center', padding: 32 },
    emptyIcon: { fontSize: 32, marginBottom: 8 },
    emptyText: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', padding: 16 },

    /* Placeholder */
    placeholder: { alignItems: 'center', padding: 48 },
    placeholderIcon: { fontSize: 48, marginBottom: 12 },
    placeholderTitle: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    placeholderDesc: {
        fontSize: FontSize.sm,
        color: Colors.textMuted,
        textAlign: 'center',
        maxWidth: 240,
        lineHeight: 20,
    },
});
