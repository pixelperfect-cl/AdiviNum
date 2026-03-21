import { io, Socket } from 'socket.io-client';
import { useUserStore } from '../stores/userStore';
import { ChatEvent } from '@adivinum/shared';

const DEV_UID_MAP: Record<string, string> = {
    player: 'dev-player-uid',
    admin: 'dev-admin-uid',
    player2: 'dev-player2-uid',
};

let chatSocket: Socket | null = null;
let currentUserId: string | null = null;

/* ── Listeners registered by the UI ── */
type MessagePayload = {
    id: string;
    senderId: string;
    receiverId?: string | null;
    roomId?: string | null;
    content: string;
    createdAt: string;
    sender: { id: string; username: string; avatarUrl: string | null };
};

type Listener = (...args: any[]) => void;
const externalListeners = new Map<string, Set<Listener>>();

export function onChatEvent(event: string, fn: Listener) {
    if (!externalListeners.has(event)) externalListeners.set(event, new Set());
    externalListeners.get(event)!.add(fn);
    chatSocket?.on(event, fn);
    return () => {
        externalListeners.get(event)?.delete(fn);
        chatSocket?.off(event, fn);
    };
}

/* ── Connection ── */

export function getChatSocket(): Socket {
    let userId: string;
    if (localStorage.getItem('DEV_TOKEN')) {
        const devUser = localStorage.getItem('x-dev-user') || 'player';
        userId = DEV_UID_MAP[devUser] || DEV_UID_MAP.player;
    } else {
        const user = useUserStore.getState().user;
        userId = user?.supabaseUid || 'anonymous';
    }

    if (chatSocket && currentUserId === userId) return chatSocket;

    if (chatSocket && currentUserId !== userId) {
        chatSocket.removeAllListeners();
        chatSocket.disconnect();
        chatSocket = null;
    }

    currentUserId = userId;

    const SOCKET_URL = import.meta.env.PROD
        ? window.location.origin
        : 'http://localhost:3000';

    chatSocket = io(`${SOCKET_URL}/chat`, {
        auth: { userId },
        transports: import.meta.env.PROD ? ['polling'] : ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
    });

    chatSocket.on('connect', () => console.log('[Chat] Connected'));
    chatSocket.on('disconnect', (r) => console.log('[Chat] Disconnected:', r));

    // Re-attach external listeners
    for (const [event, fns] of externalListeners) {
        for (const fn of fns) chatSocket.on(event, fn);
    }

    return chatSocket;
}

export function disconnectChatSocket() {
    if (chatSocket) {
        chatSocket.removeAllListeners();
        chatSocket.disconnect();
        chatSocket = null;
        currentUserId = null;
    }
}

/* ── DM Actions ── */

export function sendDM(receiverId: string, content: string) {
    getChatSocket().emit(ChatEvent.DM_SEND, { receiverId, content });
}

export function requestDMHistory(otherUserId: string, cursor?: string) {
    getChatSocket().emit(ChatEvent.DM_HISTORY, { otherUserId, cursor });
}

export function sendTypingIndicator(receiverId: string) {
    getChatSocket().emit(ChatEvent.DM_TYPING, { receiverId });
}

/* ── Room Actions ── */

export function joinRoom(roomId: string) {
    getChatSocket().emit(ChatEvent.ROOM_JOIN, { roomId });
}

export function leaveRoom(roomId: string) {
    getChatSocket().emit(ChatEvent.ROOM_LEAVE, { roomId });
}

export function sendRoomMessage(roomId: string, content: string) {
    getChatSocket().emit(ChatEvent.ROOM_SEND, { roomId, content });
}

export function requestRoomHistory(roomId: string, cursor?: string) {
    getChatSocket().emit(ChatEvent.ROOM_HISTORY, { roomId, cursor });
}
