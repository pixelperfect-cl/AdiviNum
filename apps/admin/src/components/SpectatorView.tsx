import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { X, Eye, Send, Crown, Clock, Zap, MessageSquare } from 'lucide-react';

const WS_URL = import.meta.env.PROD
    ? 'https://phpstack-1279051-6287800.cloudwaysapps.com'
    : 'http://localhost:3000';

interface Attempt {
    guess: string;
    toques: number;
    famas: number;
    timestamp: number;
}

interface SpectatorState {
    matchId: string;
    level: number;
    betAmount: number;
    currentTurn: 'A' | 'B';
    attemptsA: number;
    attemptsB: number;
    historyA: Attempt[];
    historyB: Attempt[];
    timeRemainingA: number;
    timeRemainingB: number;
    usernameA: string;
    usernameB: string;
    avatarA: string | null;
    avatarB: string | null;
}

interface ChatMsg {
    from: string;
    message: string;
    timestamp: number;
}

interface SpectatorViewProps {
    matchId: string;
    onClose: () => void;
}

export default function SpectatorView({ matchId, onClose }: SpectatorViewProps) {
    const [state, setState] = useState<SpectatorState | null>(null);
    const [connected, setConnected] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
    const [chatInput, setChatInput] = useState('');
    const socketRef = useRef<Socket | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const socket = io(`${WS_URL}/game`, {
            auth: { userId: `admin_spectator_${Date.now()}` },
            transports: ['websocket'],
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            socket.emit('spectate_match', { matchId });
        });

        socket.on('disconnect', () => setConnected(false));

        socket.on('spectate_state', (data: SpectatorState) => {
            setState(data);
        });

        socket.on('spectate_update', (data: any) => {
            setState(prev => {
                if (!prev) return prev;
                const updated = { ...prev };
                updated.currentTurn = data.currentTurn;
                updated.timeRemainingA = data.timeRemainingA;
                updated.timeRemainingB = data.timeRemainingB;
                updated.attemptsA = data.attemptsA ?? prev.attemptsA;
                updated.attemptsB = data.attemptsB ?? prev.attemptsB;
                // Add the guess to the correct player's history
                if (data.player && data.guess) {
                    const attempt: Attempt = {
                        guess: data.guess,
                        toques: data.toques,
                        famas: data.famas,
                        timestamp: Date.now(),
                    };
                    if (data.player === 'A') {
                        updated.historyA = [...prev.historyA, attempt];
                    } else {
                        updated.historyB = [...prev.historyB, attempt];
                    }
                }
                return updated;
            });
        });

        socket.on('spectate_game_over', (data: any) => {
            setChatMessages(prev => [...prev, {
                from: 'SYSTEM',
                message: `Partida terminada: ${data.result}`,
                timestamp: Date.now(),
            }]);
        });

        socket.on('admin_message', (data: ChatMsg) => {
            setChatMessages(prev => [...prev, data]);
        });

        return () => {
            socket.emit('leave_spectate', { matchId });
            socket.disconnect();
        };
    }, [matchId]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const sendAdminChat = () => {
        if (!chatInput.trim() || !socketRef.current) return;
        socketRef.current.emit('admin_chat', { matchId, message: chatInput.trim() });
        setChatMessages(prev => [...prev, {
            from: 'ADMIN',
            message: chatInput.trim(),
            timestamp: Date.now(),
        }]);
        setChatInput('');
    };

    const formatTime = (ms: number) => {
        const s = Math.max(0, Math.floor(ms / 1000));
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', flexDirection: 'column',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.5)',
            }}>
                <div className="flex items-center gap-3">
                    <Eye size={20} style={{ color: 'var(--color-gold)' }} />
                    <span style={{ fontWeight: 700, fontSize: 16 }}>Modo GOD</span>
                    <span style={{
                        background: connected ? 'var(--color-green)' : 'var(--color-red)',
                        width: 8, height: 8, borderRadius: '50%', display: 'inline-block',
                    }} />
                    <span className="text-muted" style={{ fontSize: 12 }}>
                        {connected ? 'Conectado' : 'Desconectado'}
                    </span>
                </div>
                <button onClick={onClose} className="btn-icon" style={{ color: 'var(--color-text-muted)' }}>
                    <X size={20} />
                </button>
            </div>

            {!state ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                    Esperando datos de la partida...
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Main game view */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, gap: 20, overflow: 'auto' }}>
                        {/* Match Info Bar */}
                        <div style={{
                            display: 'flex', justifyContent: 'center', gap: 16,
                            padding: '10px 20px', borderRadius: 'var(--radius-md)',
                            background: 'rgba(255,255,255,0.05)',
                        }}>
                            <span className="flex items-center gap-1" style={{ color: 'var(--color-gold)', fontSize: 13, fontWeight: 600 }}>
                                <Zap size={14} /> Nivel {state.level}
                            </span>
                            <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                                Apuesta: {state.betAmount.toLocaleString()}
                            </span>
                        </div>

                        {/* Players side by side */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, flex: 1 }}>
                            {/* Player A */}
                            <PlayerBoard
                                username={state.usernameA}
                                avatar={state.avatarA}
                                role="A"
                                isActive={state.currentTurn === 'A'}
                                timeRemaining={state.timeRemainingA}
                                attempts={state.historyA}
                                formatTime={formatTime}
                            />

                            {/* Player B */}
                            <PlayerBoard
                                username={state.usernameB}
                                avatar={state.avatarB}
                                role="B"
                                isActive={state.currentTurn === 'B'}
                                timeRemaining={state.timeRemainingB}
                                attempts={state.historyB}
                                formatTime={formatTime}
                            />
                        </div>
                    </div>

                    {/* Chat Panel */}
                    <div style={{
                        width: 320, borderLeft: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.3)',
                    }}>
                        <div style={{
                            padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)',
                            fontWeight: 700, fontSize: 14,
                        }}
                            className="flex items-center gap-2"
                        >
                            <MessageSquare size={16} style={{ color: 'var(--color-gold)' }} />
                            GOD Chat
                        </div>

                        <div style={{ flex: 1, overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {chatMessages.length === 0 && (
                                <div style={{ color: 'var(--color-text-muted)', fontSize: 12, textAlign: 'center', padding: 20 }}>
                                    Los mensajes que envíes aquí serán visibles para ambos jugadores como mensajes del sistema.
                                </div>
                            )}
                            {chatMessages.map((msg, i) => (
                                <div key={i} style={{
                                    padding: '6px 10px', borderRadius: 'var(--radius-sm)',
                                    background: msg.from === 'ADMIN' ? 'rgba(234, 179, 8, 0.15)' : msg.from === 'SYSTEM' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.05)',
                                    borderLeft: msg.from === 'ADMIN' ? '3px solid var(--color-gold)' : msg.from === 'SYSTEM' ? '3px solid var(--color-red)' : '3px solid var(--color-text-muted)',
                                }}>
                                    <span style={{
                                        fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
                                        color: msg.from === 'ADMIN' ? 'var(--color-gold)' : 'var(--color-red)',
                                    }}>
                                        {msg.from === 'ADMIN' ? '👑 Admin' : '⚡ Sistema'}
                                    </span>
                                    <div style={{ fontSize: 13, marginTop: 2 }}>{msg.message}</div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        <div style={{
                            padding: 12, borderTop: '1px solid rgba(255,255,255,0.1)',
                            display: 'flex', gap: 8,
                        }}>
                            <input
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendAdminChat()}
                                placeholder="Escribir como Admin..."
                                style={{
                                    flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                                    borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 13,
                                    color: 'var(--color-text-primary)', outline: 'none',
                                }}
                            />
                            <button
                                onClick={sendAdminChat}
                                style={{
                                    background: 'var(--color-gold)', color: 'var(--color-bg-primary)',
                                    border: 'none', padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                                }}
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function PlayerBoard({
    username, avatar, role, isActive, timeRemaining, attempts, formatTime,
}: {
    username: string;
    avatar: string | null;
    role: 'A' | 'B';
    isActive: boolean;
    timeRemaining: number;
    attempts: Attempt[];
    formatTime: (ms: number) => string;
}) {
    return (
        <div style={{
            borderRadius: 'var(--radius-md)',
            background: isActive ? 'rgba(234, 179, 8, 0.08)' : 'rgba(255,255,255,0.03)',
            border: `2px solid ${isActive ? 'var(--color-gold)' : 'rgba(255,255,255,0.08)'}`,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            transition: 'border-color 0.3s, background 0.3s',
        }}>
            {/* Player Header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                borderBottom: `1px solid ${isActive ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.06)'}`,
            }}>
                <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: avatar ? `url(${avatar}) center/cover` : 'var(--color-bg-secondary)',
                    border: `2px solid ${isActive ? 'var(--color-gold)' : 'rgba(255,255,255,0.15)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                }}>
                    {!avatar && username[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-2">
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{username}</span>
                        <span style={{
                            fontSize: 10, fontWeight: 600, padding: '1px 6px',
                            borderRadius: 'var(--radius-sm)',
                            background: role === 'A' ? 'rgba(59,130,246,0.2)' : 'rgba(168,85,247,0.2)',
                            color: role === 'A' ? '#60a5fa' : '#a78bfa',
                        }}>
                            Jugador {role}
                        </span>
                    </div>
                    <div className="flex items-center gap-1" style={{ color: isActive ? 'var(--color-gold)' : 'var(--color-text-muted)', fontSize: 12 }}>
                        {isActive && <Crown size={12} />}
                        {isActive ? 'Su turno' : 'Esperando'}
                    </div>
                </div>
                <div className="flex items-center gap-1" style={{
                    fontSize: 16, fontWeight: 700, fontFamily: 'monospace',
                    color: timeRemaining < 30000 ? 'var(--color-red)' : 'var(--color-text-primary)',
                }}>
                    <Clock size={14} />
                    {formatTime(timeRemaining)}
                </div>
            </div>

            {/* Attempts */}
            <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px' }}>
                {attempts.length === 0 ? (
                    <div style={{ color: 'var(--color-text-muted)', fontSize: 12, textAlign: 'center', padding: 20 }}>
                        Sin intentos aún
                    </div>
                ) : (
                    <table style={{ width: '100%', borderSpacing: '0 4px', borderCollapse: 'separate' }}>
                        <thead>
                            <tr style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                                <th style={{ textAlign: 'left', padding: '4px 8px' }}>#</th>
                                <th style={{ textAlign: 'center', padding: '4px 8px' }}>Número</th>
                                <th style={{ textAlign: 'center', padding: '4px 8px' }}>Toques</th>
                                <th style={{ textAlign: 'center', padding: '4px 8px' }}>Famas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attempts.map((a, i) => (
                                <tr key={i} style={{
                                    background: a.famas === 4 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255,255,255,0.03)',
                                    borderRadius: 'var(--radius-sm)',
                                }}>
                                    <td style={{ padding: '6px 8px', fontSize: 12, color: 'var(--color-text-muted)' }}>{i + 1}</td>
                                    <td style={{
                                        padding: '6px 8px', textAlign: 'center',
                                        fontFamily: 'monospace', fontWeight: 700, fontSize: 16, letterSpacing: '0.15em',
                                        color: a.famas === 4 ? 'var(--color-green)' : 'var(--color-text-primary)',
                                    }}>
                                        {a.guess}
                                    </td>
                                    <td style={{ padding: '6px 8px', textAlign: 'center', fontSize: 14 }}>
                                        <span style={{
                                            color: 'var(--color-orange)', fontWeight: 700,
                                        }}>
                                            {a.toques}
                                        </span>
                                    </td>
                                    <td style={{ padding: '6px 8px', textAlign: 'center', fontSize: 14 }}>
                                        <span style={{
                                            color: a.famas > 0 ? 'var(--color-green)' : 'var(--color-text-muted)', fontWeight: 700,
                                        }}>
                                            {a.famas}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
