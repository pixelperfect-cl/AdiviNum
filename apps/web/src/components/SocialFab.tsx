import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

/* ── Types ─────────────────────────────── */

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

/* ── Component ─────────────────────────── */

export function SocialFab() {
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState<PanelTab>('friends');
    const [friendsSubTab, setFriendsSubTab] = useState<FriendsSubTab>('list');

    // Friends data
    const [friends, setFriends] = useState<Friend[]>([]);
    const [pending, setPending] = useState<PendingRequest[]>([]);
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const panelRef = useRef<HTMLDivElement>(null);

    /* ── Data fetching ── */

    const loadFriends = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.get<Friend[]>('/friends');
            setFriends(data);
        } catch { setFriends([]); }
        setLoading(false);
    }, []);

    const loadPending = useCallback(async () => {
        try {
            const data = await api.get<PendingRequest[]>('/friends/pending');
            setPending(data);
        } catch { setPending([]); }
    }, []);

    // Fetch data when panel opens
    useEffect(() => {
        if (open) {
            loadFriends();
            loadPending();
        }
    }, [open, loadFriends, loadPending]);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    /* ── Actions ── */

    const handleSearch = async (q: string) => {
        setSearchQuery(q);
        if (q.length < 2) { setSearchResults([]); return; }
        try {
            const data = await api.get<SearchUser[]>(`/friends/search?q=${encodeURIComponent(q)}`);
            setSearchResults(data);
        } catch { setSearchResults([]); }
    };

    const sendRequest = async (userId: string) => {
        setActionLoading(userId);
        try {
            await api.post(`/friends/request/${userId}`, {});
            setSearchResults(prev => prev.filter(u => u.id !== userId));
        } catch (err: any) {
            alert(err?.message || 'Error al enviar solicitud');
        }
        setActionLoading(null);
    };

    const acceptRequest = async (friendshipId: string) => {
        setActionLoading(friendshipId);
        try {
            await api.post(`/friends/${friendshipId}/accept`, {});
            setPending(prev => prev.filter(p => p.friendshipId !== friendshipId));
            loadFriends();
        } catch { /* ignore */ }
        setActionLoading(null);
    };

    const rejectRequest = async (friendshipId: string) => {
        setActionLoading(friendshipId);
        try {
            await api.post(`/friends/${friendshipId}/reject`, {});
            setPending(prev => prev.filter(p => p.friendshipId !== friendshipId));
        } catch { /* ignore */ }
        setActionLoading(null);
    };

    const removeFriend = async (friendshipId: string) => {
        if (!confirm('¿Eliminar amigo?')) return;
        setActionLoading(friendshipId);
        try {
            await api.delete(`/friends/${friendshipId}`);
            setFriends(prev => prev.filter(f => f.friendshipId !== friendshipId));
        } catch { /* ignore */ }
        setActionLoading(null);
    };

    const pendingCount = pending.length;

    /* ── Panel tabs ── */

    const tabs: { key: PanelTab; icon: string; label: string }[] = [
        { key: 'friends', icon: '👥', label: 'Amigos' },
        { key: 'chats', icon: '💬', label: 'Chats' },
        { key: 'rooms', icon: '🌐', label: 'Salas' },
    ];

    const friendsSubTabs: { key: FriendsSubTab; icon: string; label: string; badge?: number }[] = [
        { key: 'list', icon: '👥', label: 'Amigos', badge: friends.length },
        { key: 'pending', icon: '📩', label: 'Solicitudes', badge: pending.length },
        { key: 'search', icon: '🔍', label: 'Buscar' },
    ];

    /* ── Render helpers ── */

    const renderAvatar = (username: string, avatarUrl: string | null) => (
        <div className="social-avatar">
            {avatarUrl ? (
                <img src={avatarUrl} alt="" referrerPolicy="no-referrer" />
            ) : (
                username.charAt(0).toUpperCase()
            )}
        </div>
    );

    const renderFriendsList = () => (
        <div className="social-panel__list">
            {loading ? (
                <div className="social-panel__empty">
                    <div className="social-panel__spinner" />
                </div>
            ) : friends.length === 0 ? (
                <div className="social-panel__empty">
                    <span className="social-panel__empty-icon">👥</span>
                    <p>Aún no tienes amigos</p>
                    <button className="social-panel__action-btn" onClick={() => setFriendsSubTab('search')}>
                        🔍 Buscar jugadores
                    </button>
                </div>
            ) : (
                friends.map(f => (
                    <div key={f.friendshipId} className="social-panel__user-row">
                        {renderAvatar(f.friend.username, f.friend.avatarUrl)}
                        <div className="social-panel__user-info">
                            <span className="social-panel__username">{f.friend.username}</span>
                            <span className="social-panel__meta">⭐ {f.friend.eloRating}</span>
                        </div>
                        <button
                            className="social-panel__icon-btn social-panel__icon-btn--danger"
                            onClick={() => removeFriend(f.friendshipId)}
                            disabled={actionLoading === f.friendshipId}
                            title="Eliminar amigo"
                        >
                            ✕
                        </button>
                    </div>
                ))
            )}
        </div>
    );

    const renderPending = () => (
        <div className="social-panel__list">
            {pending.length === 0 ? (
                <div className="social-panel__empty">
                    <span className="social-panel__empty-icon">📩</span>
                    <p>No tienes solicitudes pendientes</p>
                </div>
            ) : (
                pending.map(p => (
                    <div key={p.friendshipId} className="social-panel__user-row">
                        {renderAvatar(p.sender.username, p.sender.avatarUrl)}
                        <div className="social-panel__user-info">
                            <span className="social-panel__username">{p.sender.username}</span>
                            <span className="social-panel__meta">⭐ {p.sender.eloRating}</span>
                        </div>
                        <div className="social-panel__row-actions">
                            <button
                                className="social-panel__icon-btn social-panel__icon-btn--success"
                                onClick={() => acceptRequest(p.friendshipId)}
                                disabled={actionLoading === p.friendshipId}
                            >✓</button>
                            <button
                                className="social-panel__icon-btn social-panel__icon-btn--danger"
                                onClick={() => rejectRequest(p.friendshipId)}
                                disabled={actionLoading === p.friendshipId}
                            >✕</button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );

    const renderSearch = () => (
        <div className="social-panel__list">
            <div className="social-panel__search-box">
                <input
                    type="text"
                    placeholder="Buscar jugadores..."
                    value={searchQuery}
                    onChange={e => handleSearch(e.target.value)}
                    autoFocus
                />
            </div>
            {searchResults.length > 0 ? (
                searchResults.map(u => (
                    <div key={u.id} className="social-panel__user-row">
                        {renderAvatar(u.username, u.avatarUrl)}
                        <div className="social-panel__user-info">
                            <span className="social-panel__username">{u.username}</span>
                            <span className="social-panel__meta">⭐ {u.eloRating}</span>
                        </div>
                        <button
                            className="social-panel__action-btn social-panel__action-btn--sm"
                            onClick={() => sendRequest(u.id)}
                            disabled={actionLoading === u.id}
                        >
                            {actionLoading === u.id ? '...' : '➕'}
                        </button>
                    </div>
                ))
            ) : searchQuery.length >= 2 ? (
                <div className="social-panel__empty">
                    <p>No se encontraron jugadores</p>
                </div>
            ) : null}
        </div>
    );

    const renderFriendsContent = () => (
        <>
            {/* Sub-tabs */}
            <div className="social-panel__subtabs">
                {friendsSubTabs.map(st => (
                    <button
                        key={st.key}
                        className={`social-panel__subtab ${friendsSubTab === st.key ? 'active' : ''}`}
                        onClick={() => setFriendsSubTab(st.key)}
                    >
                        <span>{st.icon}</span>
                        <span>{st.label}</span>
                        {(st.badge ?? 0) > 0 && (
                            <span className="social-panel__subtab-badge">{st.badge}</span>
                        )}
                    </button>
                ))}
            </div>

            {friendsSubTab === 'list' && renderFriendsList()}
            {friendsSubTab === 'pending' && renderPending()}
            {friendsSubTab === 'search' && renderSearch()}
        </>
    );

    const renderChatsPlaceholder = () => (
        <div className="social-panel__placeholder">
            <span className="social-panel__placeholder-icon">💬</span>
            <h3>Chats</h3>
            <p>Próximamente podrás chatear con tus amigos en tiempo real.</p>
        </div>
    );

    const renderRoomsPlaceholder = () => (
        <div className="social-panel__placeholder">
            <span className="social-panel__placeholder-icon">🌐</span>
            <h3>Salas Públicas</h3>
            <p>Próximamente podrás unirte a salas de chat grupales y conocer otros jugadores.</p>
        </div>
    );

    /* ── Main render ── */

    return (
        <>
            {/* Overlay */}
            {open && (
                <div
                    className="social-overlay"
                    onClick={() => setOpen(false)}
                />
            )}

            {/* Panel */}
            <div
                ref={panelRef}
                className={`social-panel ${open ? 'social-panel--open' : ''}`}
            >
                {/* Header */}
                <div className="social-panel__header">
                    <h3 className="social-panel__title">Social</h3>
                    <button
                        className="social-panel__close"
                        onClick={() => setOpen(false)}
                    >
                        ✕
                    </button>
                </div>

                {/* Main tabs */}
                <div className="social-panel__tabs">
                    {tabs.map(t => (
                        <button
                            key={t.key}
                            className={`social-panel__tab ${tab === t.key ? 'active' : ''}`}
                            onClick={() => setTab(t.key)}
                        >
                            <span>{t.icon}</span>
                            <span>{t.label}</span>
                            {t.key === 'friends' && pendingCount > 0 && (
                                <span className="social-panel__tab-badge">{pendingCount}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="social-panel__content">
                    {tab === 'friends' && renderFriendsContent()}
                    {tab === 'chats' && renderChatsPlaceholder()}
                    {tab === 'rooms' && renderRoomsPlaceholder()}
                </div>
            </div>

            {/* FAB button */}
            <button
                className={`social-fab ${open ? 'social-fab--active' : ''}`}
                onClick={() => setOpen(!open)}
                title="Social"
            >
                <span className="social-fab__icon">{open ? '✕' : '💬'}</span>
                {!open && pendingCount > 0 && (
                    <span className="social-fab__badge">{pendingCount}</span>
                )}
            </button>
        </>
    );
}
