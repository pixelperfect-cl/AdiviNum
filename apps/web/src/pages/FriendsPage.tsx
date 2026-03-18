import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { SkeletonCard } from '../components/Skeleton';

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

type Tab = 'friends' | 'pending' | 'search';

export function FriendsPage() {
    const [tab, setTab] = useState<Tab>('friends');
    const [friends, setFriends] = useState<Friend[]>([]);
    const [pending, setPending] = useState<PendingRequest[]>([]);
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

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

    useEffect(() => {
        loadFriends();
        loadPending();
    }, [loadFriends, loadPending]);

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
            // Remove from search results
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

    const tabs: { key: Tab; label: string; icon: string; badge?: number }[] = [
        { key: 'friends', label: 'Amigos', icon: '👥', badge: friends.length },
        { key: 'pending', label: 'Solicitudes', icon: '📩', badge: pending.length },
        { key: 'search', label: 'Buscar', icon: '🔍' },
    ];

    return (
        <div className="fade-in">
            <h2 className="section-title" style={{ textAlign: 'center' }}>👥 Amigos</h2>

            {/* Tab bar */}
            <div style={{
                display: 'flex', gap: '4px', marginBottom: '16px',
                background: 'var(--bg-card, #1e1e2a)', borderRadius: '12px', padding: '4px',
            }}>
                {tabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        style={{
                            flex: 1, padding: '10px 8px', borderRadius: '10px', border: 'none',
                            background: tab === t.key ? 'var(--gold)' : 'transparent',
                            color: tab === t.key ? '#000' : 'var(--text-muted)',
                            fontWeight: tab === t.key ? 700 : 400, fontSize: '0.85rem',
                            cursor: 'pointer', transition: 'all 0.2s ease',
                            position: 'relative',
                        }}
                    >
                        <span style={{ marginRight: '4px' }}>{t.icon}</span>
                        {t.label}
                        {(t.badge ?? 0) > 0 && (
                            <span style={{
                                position: 'absolute', top: 2, right: 6,
                                background: 'var(--danger)', color: '#fff',
                                borderRadius: '50%', width: 18, height: 18,
                                fontSize: '0.65rem', display: 'flex',
                                alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700,
                            }}>
                                {t.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Friends list */}
            {tab === 'friends' && (
                <div>
                    {loading ? (
                        <SkeletonCard count={3} />
                    ) : friends.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
                            <p style={{ fontSize: '2rem', marginBottom: '8px' }}>👥</p>
                            <p style={{ color: 'var(--text-muted)' }}>Aún no tienes amigos</p>
                            <button
                                className="btn btn--primary"
                                style={{ marginTop: '12px' }}
                                onClick={() => setTab('search')}
                            >
                                🔍 Buscar jugadores
                            </button>
                        </div>
                    ) : (
                        friends.map(f => (
                            <div key={f.friendshipId} className="card" style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '14px 16px', marginBottom: '8px',
                            }}>
                                <div className="avatar">
                                    {f.friend.avatarUrl ? (
                                        <img src={f.friend.avatarUrl} alt="" style={{
                                            width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover',
                                        }} referrerPolicy="no-referrer" />
                                    ) : f.friend.username.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                        {f.friend.username}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        ⭐ {f.friend.eloRating} · {f.friend.gamesWon}W / {f.friend.gamesPlayed}P
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                        className="btn btn--sm btn--ghost"
                                        onClick={() => removeFriend(f.friendshipId)}
                                        disabled={actionLoading === f.friendshipId}
                                        title="Eliminar amigo"
                                        style={{ fontSize: '0.75rem' }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Pending requests */}
            {tab === 'pending' && (
                <div>
                    {pending.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
                            <p style={{ color: 'var(--text-muted)' }}>No tienes solicitudes pendientes</p>
                        </div>
                    ) : (
                        pending.map(p => (
                            <div key={p.friendshipId} className="card" style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '14px 16px', marginBottom: '8px',
                            }}>
                                <div className="avatar">
                                    {p.sender.username.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                        {p.sender.username}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        ⭐ {p.sender.eloRating}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button
                                        className="btn btn--sm btn--primary"
                                        onClick={() => acceptRequest(p.friendshipId)}
                                        disabled={actionLoading === p.friendshipId}
                                    >
                                        ✓
                                    </button>
                                    <button
                                        className="btn btn--sm btn--ghost"
                                        onClick={() => rejectRequest(p.friendshipId)}
                                        disabled={actionLoading === p.friendshipId}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Search */}
            {tab === 'search' && (
                <div>
                    <div className="card" style={{ marginBottom: '12px', padding: '16px' }}>
                        <input
                            type="text"
                            placeholder="Buscar por nombre de usuario..."
                            value={searchQuery}
                            onChange={e => handleSearch(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 14px',
                                borderRadius: '10px', border: '1px solid var(--border)',
                                background: 'var(--bg-body)', color: 'var(--text-primary)',
                                fontSize: '0.9rem',
                            }}
                            autoFocus
                        />
                    </div>

                    {searchResults.length > 0 ? (
                        searchResults.map(u => (
                            <div key={u.id} className="card" style={{
                                display: 'flex', alignItems: 'center', gap: '12px',
                                padding: '14px 16px', marginBottom: '8px',
                            }}>
                                <div className="avatar">
                                    {u.avatarUrl ? (
                                        <img src={u.avatarUrl} alt="" style={{
                                            width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover',
                                        }} referrerPolicy="no-referrer" />
                                    ) : u.username.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{u.username}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        ⭐ {u.eloRating}
                                    </div>
                                </div>
                                <button
                                    className="btn btn--sm btn--primary"
                                    onClick={() => sendRequest(u.id)}
                                    disabled={actionLoading === u.id}
                                >
                                    {actionLoading === u.id ? '...' : '➕ Agregar'}
                                </button>
                            </div>
                        ))
                    ) : searchQuery.length >= 2 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
                            <p style={{ color: 'var(--text-muted)' }}>No se encontraron jugadores</p>
                        </div>
                    ) : null}
                </div>
            )}
        </div>
    );
}
