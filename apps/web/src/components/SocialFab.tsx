import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { ChatEvent } from '@adivinum/shared';
import {
    getChatSocket,
    onChatEvent,
    sendDM,
    requestDMHistory,
    sendTypingIndicator,
    joinRoom,
    leaveRoom,
    sendRoomMessage,
    requestRoomHistory,
} from '../services/chatSocket';

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

interface ChatMsg {
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
    sender: { id: string; username: string; avatarUrl: string | null };
}

interface Conversation {
    partner: { id: string; username: string; avatarUrl: string | null; eloRating: number };
    lastMessage: { content: string; createdAt: string; fromMe: boolean };
}

interface ChatRoom {
    id: string;
    name: string;
    description: string | null;
    iconEmoji: string;
    isOfficial: boolean;
    maxMembers: number;
    memberCount: number;
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
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

    // Chat data
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeChat, setActiveChat] = useState<{ id: string; username: string; avatarUrl: string | null } | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Rooms data
    const [rooms, setRooms] = useState<ChatRoom[]>([]);
    const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
    const [roomMessages, setRoomMessages] = useState<ChatMsg[]>([]);
    const [roomInput, setRoomInput] = useState('');

    const panelRef = useRef<HTMLDivElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const roomChatEndRef = useRef<HTMLDivElement>(null);

    /* ── Friends data fetching ── */

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

    /* ── Chat Socket Setup ── */

    useEffect(() => {
        if (!open) return;
        // Ensure socket is connected when panel opens
        getChatSocket();

        const unsubs: (() => void)[] = [];

        // DM new message
        unsubs.push(onChatEvent(ChatEvent.DM_NEW, (msg: ChatMsg) => {
            setChatMessages(prev => {
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
            // Also update conversations
            loadConversations();
        }));

        // DM history response
        unsubs.push(onChatEvent(ChatEvent.DM_HISTORY, (data: { otherUserId: string; messages: ChatMsg[] }) => {
            setChatMessages(data.messages);
        }));

        // DM typing indicator
        unsubs.push(onChatEvent(ChatEvent.DM_TYPING_INDICATOR, () => {
            setIsTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
        }));

        // Room message
        unsubs.push(onChatEvent(ChatEvent.ROOM_MESSAGE, (msg: ChatMsg) => {
            setRoomMessages(prev => {
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
        }));

        // Room history response
        unsubs.push(onChatEvent(ChatEvent.ROOM_HISTORY, (data: { roomId: string; messages: ChatMsg[] }) => {
            setRoomMessages(data.messages);
        }));

        // Room joined confirmation
        unsubs.push(onChatEvent(ChatEvent.ROOM_JOINED, (data: { roomId: string; name: string }) => {
            const room = rooms.find(r => r.id === data.roomId);
            if (room) {
                setActiveRoom(room);
                requestRoomHistory(data.roomId);
            }
        }));

        // Room member count update
        unsubs.push(onChatEvent(ChatEvent.ROOM_MEMBER_COUNT, (data: { roomId: string; count: number }) => {
            setRooms(prev => prev.map(r => r.id === data.roomId ? { ...r, memberCount: data.count } : r));
        }));

        return () => unsubs.forEach(fn => fn());
    }, [open, rooms]);

    // Scroll to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    useEffect(() => {
        roomChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [roomMessages]);

    /* ── Chat data loading ── */

    const loadConversations = useCallback(async () => {
        try {
            const data = await api.get<Conversation[]>('/chat/conversations');
            setConversations(data);
        } catch { setConversations([]); }
    }, []);

    const loadRooms = useCallback(async () => {
        try {
            const data = await api.get<ChatRoom[]>('/chat/rooms');
            setRooms(data);
        } catch { setRooms([]); }
    }, []);

    useEffect(() => {
        if (open && tab === 'chats') loadConversations();
        if (open && tab === 'rooms') loadRooms();
    }, [open, tab, loadConversations, loadRooms]);

    /* ── Friends Actions ── */

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

    /* ── Chat Actions ── */

    const openChat = (partner: { id: string; username: string; avatarUrl: string | null }) => {
        setTab('chats');
        setActiveChat(partner);
        setChatMessages([]);
        requestDMHistory(partner.id);
    };

    const handleSendDM = () => {
        if (!activeChat || !chatInput.trim()) return;
        sendDM(activeChat.id, chatInput.trim());
        setChatInput('');
    };

    const handleChatInputChange = (val: string) => {
        setChatInput(val);
        if (activeChat) sendTypingIndicator(activeChat.id);
    };

    /* ── Room Actions ── */

    const handleJoinRoom = (room: ChatRoom) => {
        setRoomMessages([]);
        joinRoom(room.id);
    };

    const handleLeaveRoom = () => {
        if (activeRoom) {
            leaveRoom(activeRoom.id);
            setActiveRoom(null);
            setRoomMessages([]);
        }
    };

    const handleSendRoomMsg = () => {
        if (!activeRoom || !roomInput.trim()) return;
        sendRoomMessage(activeRoom.id, roomInput.trim());
        setRoomInput('');
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

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return 'ahora';
        if (diffMin < 60) return `${diffMin}m`;
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 24) return `${diffH}h`;
        return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
    };

    /* ── Friends Renders ── */

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
                            className="social-panel__icon-btn"
                            onClick={() => openChat(f.friend)}
                            title="Chatear"
                        >💬</button>
                        <div className="social-panel__menu-wrap">
                            <button
                                className="social-panel__icon-btn"
                                onClick={() => setMenuOpenId(menuOpenId === f.friendshipId ? null : f.friendshipId)}
                                title="Opciones"
                            >⋮</button>
                            {menuOpenId === f.friendshipId && (
                                <div className="social-panel__dropdown">
                                    <button
                                        className="social-panel__dropdown-item social-panel__dropdown-item--danger"
                                        onClick={() => { setMenuOpenId(null); removeFriend(f.friendshipId); }}
                                        disabled={actionLoading === f.friendshipId}
                                    >
                                        🗑 Eliminar amigo
                                    </button>
                                </div>
                            )}
                        </div>
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

    /* ── Chats Renders ── */

    const renderConversationList = () => (
        <div className="social-panel__list">
            {conversations.length === 0 ? (
                <div className="social-panel__empty">
                    <span className="social-panel__empty-icon">💬</span>
                    <p>No tienes conversaciones aún</p>
                    <button className="social-panel__action-btn" onClick={() => { setTab('friends'); setFriendsSubTab('list'); }}>
                        👥 Ir a amigos
                    </button>
                </div>
            ) : (
                conversations.map(c => (
                    <div
                        key={c.partner.id}
                        className="social-panel__user-row social-panel__user-row--clickable"
                        onClick={() => openChat(c.partner)}
                    >
                        {renderAvatar(c.partner.username, c.partner.avatarUrl)}
                        <div className="social-panel__user-info">
                            <span className="social-panel__username">{c.partner.username}</span>
                            <span className="social-panel__meta social-panel__meta--msg">
                                {c.lastMessage.fromMe ? 'Tú: ' : ''}{c.lastMessage.content.slice(0, 30)}
                                {c.lastMessage.content.length > 30 ? '...' : ''}
                            </span>
                        </div>
                        <span className="social-panel__time">{formatTime(c.lastMessage.createdAt)}</span>
                    </div>
                ))
            )}
        </div>
    );

    const renderChatView = () => (
        <div className="chat-view">
            <div className="chat-view__header">
                <button className="chat-view__back" onClick={() => setActiveChat(null)}>←</button>
                {renderAvatar(activeChat!.username, activeChat!.avatarUrl)}
                <span className="chat-view__name">{activeChat!.username}</span>
            </div>
            <div className="chat-view__messages">
                {chatMessages.map(m => (
                    <div
                        key={m.id}
                        className={`chat-bubble ${m.senderId === activeChat!.id ? 'chat-bubble--received' : 'chat-bubble--sent'}`}
                    >
                        <p className="chat-bubble__text">{m.content}</p>
                        <span className="chat-bubble__time">{formatTime(m.createdAt)}</span>
                    </div>
                ))}
                {isTyping && (
                    <div className="chat-bubble chat-bubble--received chat-bubble--typing">
                        <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <div className="chat-view__input">
                <input
                    type="text"
                    placeholder="Escribe un mensaje..."
                    value={chatInput}
                    onChange={e => handleChatInputChange(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendDM()}
                    maxLength={500}
                />
                <button onClick={handleSendDM} disabled={!chatInput.trim()}>➤</button>
            </div>
        </div>
    );

    const renderChatsTab = () => (
        activeChat ? renderChatView() : renderConversationList()
    );

    /* ── Rooms Renders ── */

    const renderRoomList = () => (
        <div className="social-panel__list">
            {rooms.length === 0 ? (
                <div className="social-panel__empty">
                    <span className="social-panel__empty-icon">🌐</span>
                    <p>No hay salas disponibles</p>
                </div>
            ) : (
                rooms.map(r => (
                    <div
                        key={r.id}
                        className="social-panel__user-row social-panel__user-row--clickable"
                        onClick={() => handleJoinRoom(r)}
                    >
                        <div className="social-avatar social-avatar--room">
                            {r.iconEmoji}
                        </div>
                        <div className="social-panel__user-info">
                            <span className="social-panel__username">{r.name}</span>
                            <span className="social-panel__meta">{r.description}</span>
                        </div>
                        <span className="social-panel__room-count">
                            👥 {r.memberCount}
                        </span>
                    </div>
                ))
            )}
        </div>
    );

    const renderRoomView = () => (
        <div className="chat-view">
            <div className="chat-view__header">
                <button className="chat-view__back" onClick={handleLeaveRoom}>←</button>
                <div className="social-avatar social-avatar--room">{activeRoom!.iconEmoji}</div>
                <span className="chat-view__name">{activeRoom!.name}</span>
            </div>
            <div className="chat-view__messages">
                {roomMessages.map(m => (
                    <div key={m.id} className="chat-bubble chat-bubble--room">
                        <div className="chat-bubble__sender">
                            {renderAvatar(m.sender.username, m.sender.avatarUrl)}
                            <span>{m.sender.username}</span>
                        </div>
                        <p className="chat-bubble__text">{m.content}</p>
                        <span className="chat-bubble__time">{formatTime(m.createdAt)}</span>
                    </div>
                ))}
                <div ref={roomChatEndRef} />
            </div>
            <div className="chat-view__input">
                <input
                    type="text"
                    placeholder="Escribe un mensaje..."
                    value={roomInput}
                    onChange={e => setRoomInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendRoomMsg()}
                    maxLength={500}
                />
                <button onClick={handleSendRoomMsg} disabled={!roomInput.trim()}>➤</button>
            </div>
        </div>
    );

    const renderRoomsTab = () => (
        activeRoom ? renderRoomView() : renderRoomList()
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
                            onClick={() => { setTab(t.key); setActiveChat(null); setActiveRoom(null); }}
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
                    {tab === 'chats' && renderChatsTab()}
                    {tab === 'rooms' && renderRoomsTab()}
                </div>
            </div>

            {/* FAB button — vertical tab */}
            <button
                className={`social-fab ${open ? 'social-fab--active' : ''}`}
                onClick={() => setOpen(!open)}
                title="Social"
            >
                <span className="social-fab__inner">
                    <span className="social-fab__icon">{open ? '✕' : '💬'}</span>
                    {!open && <span className="social-fab__label">Social</span>}
                </span>
                {!open && pendingCount > 0 && (
                    <span className="social-fab__badge">{pendingCount}</span>
                )}
            </button>
        </>
    );
}
