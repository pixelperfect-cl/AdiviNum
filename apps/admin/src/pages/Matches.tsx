import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api';
import { Gamepad2, Eye, Clock, CheckCircle, Zap, Radio } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import SpectatorView from '../components/SpectatorView';

const WS_URL = import.meta.env.PROD
    ? 'https://phpstack-1279051-6287800.cloudwaysapps.com'
    : 'http://localhost:3000';

interface LiveMatch {
    matchId: string;
    level: number;
    betAmount: number;
    currentTurn: 'A' | 'B';
    attemptsA: number;
    attemptsB: number;
    timeRemainingA: number;
    timeRemainingB: number;
    usernameA: string;
    usernameB: string;
    avatarA: string | null;
    avatarB: string | null;
}

export default function Matches() {
    const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
    const [spectatingMatch, setSpectatingMatch] = useState<string | null>(null);
    const socketRef = useRef<Socket | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['matches'],
        queryFn: () => adminApi.getMatches(100),
    });

    const matches: any[] = (data as any)?.matches || (data as any)?.data || [];

    // WebSocket for live matches list
    useEffect(() => {
        const socket = io(`${WS_URL}/game`, {
            auth: { userId: `admin_lobby_${Date.now()}` },
            transports: ['websocket'],
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            socket.emit('list_matches');
        });

        socket.on('active_matches', (data: { matches: LiveMatch[] }) => {
            setLiveMatches(data.matches || []);
        });

        // Poll every 5 seconds
        const interval = setInterval(() => {
            if (socket.connected) {
                socket.emit('list_matches');
            }
        }, 5000);

        return () => {
            clearInterval(interval);
            socket.disconnect();
        };
    }, []);

    const getStatusBadge = (status: string) => {
        const map: Record<string, { cls: string; label: string }> = {
            WAITING: { cls: 'badge-orange', label: 'Esperando' },
            COIN_FLIP: { cls: 'badge-blue', label: 'Coin Flip' },
            IN_PROGRESS: { cls: 'badge-green', label: 'En juego' },
            FINISHED: { cls: 'badge-purple', label: 'Terminada' },
            ABANDONED: { cls: 'badge-red', label: 'Abandonada' },
        };
        const info = map[status] ?? { cls: '', label: status };
        return <span className={`badge ${info.cls}`}>{info.label}</span>;
    };

    const getResultLabel = (result: string | null) => {
        if (!result) return '—';
        const map: Record<string, string> = {
            PLAYER_A_WINS: 'Jugador A',
            PLAYER_B_WINS: 'Jugador B',
            DRAW: 'Empate',
            TIMEOUT_A: 'Timeout A',
            TIMEOUT_B: 'Timeout B',
            ABANDON_A: 'Abandono A',
            ABANDON_B: 'Abandono B',
        };
        return map[result] ?? result;
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

    const formatTime = (ms: number) => {
        const s = Math.max(0, Math.floor(ms / 1000));
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const finished = matches.filter(m => m.status === 'FINISHED');

    if (isLoading) {
        return <div className="loading-spinner">Cargando partidas...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="flex items-center gap-3"><Gamepad2 size={28} /> Partidas</h1>
                <p>Partidas en vivo e historial completo</p>
            </div>

            <div className="stats-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ color: 'var(--color-blue)' }}><Gamepad2 size={28} /></div>
                    <div className="stat-info">
                        <div className="stat-value">{matches.length}</div>
                        <div className="stat-label">Total partidas</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ color: 'var(--color-green)' }}>
                        <Radio size={28} style={{ animation: liveMatches.length > 0 ? 'pulse 2s infinite' : 'none' }} />
                    </div>
                    <div className="stat-info">
                        <div className="stat-value">{liveMatches.length}</div>
                        <div className="stat-label">En vivo ahora</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ color: 'var(--color-purple)' }}><CheckCircle size={28} /></div>
                    <div className="stat-info">
                        <div className="stat-value">{finished.length}</div>
                        <div className="stat-label">Terminadas</div>
                    </div>
                </div>
            </div>

            {/* LIVE MATCHES */}
            {liveMatches.length > 0 && (
                <div className="data-table-wrapper" style={{ marginBottom: 24, padding: 20 }}>
                    <div className="table-header" style={{ marginBottom: 16 }}>
                        <h2 className="flex items-center gap-2">
                            <Radio size={18} style={{ color: 'var(--color-green)' }} />
                            Partidas en Vivo
                            <span style={{
                                background: 'var(--color-green)', color: '#000', fontWeight: 700,
                                fontSize: 11, padding: '2px 8px', borderRadius: 10, marginLeft: 4,
                            }}>
                                {liveMatches.length}
                            </span>
                        </h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
                        {liveMatches.map(live => (
                            <div key={live.matchId} style={{
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 'var(--radius-md)', padding: 16, position: 'relative',
                                transition: 'border-color 0.2s',
                            }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--color-gold)')}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
                            >
                                {/* Live indicator */}
                                <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-green)', animation: 'pulse 2s infinite' }} />
                                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-green)', letterSpacing: '0.05em' }}>
                                        EN VIVO
                                    </span>
                                    <span style={{ fontSize: 10, color: 'var(--color-text-muted)', marginLeft: 'auto' }}>
                                        <Zap size={10} style={{ display: 'inline', verticalAlign: 'middle' }} /> Nivel {live.level}
                                    </span>
                                </div>

                                {/* Players */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: '50%', margin: '0 auto 4px',
                                            background: live.avatarA ? `url(${live.avatarA}) center/cover` : 'var(--color-bg-secondary)',
                                            border: `2px solid ${live.currentTurn === 'A' ? 'var(--color-gold)' : 'rgba(255,255,255,0.15)'}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                                        }}>
                                            {!live.avatarA && live.usernameA[0]?.toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: 12, fontWeight: live.currentTurn === 'A' ? 700 : 400, color: live.currentTurn === 'A' ? 'var(--color-gold)' : 'var(--color-text-primary)' }}>
                                            {live.usernameA}
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                                            {formatTime(live.timeRemainingA)} · {live.attemptsA} int.
                                        </div>
                                    </div>
                                    <div style={{
                                        fontSize: 12, fontWeight: 800, color: 'var(--color-gold)',
                                        padding: '4px 10px', borderRadius: 'var(--radius-sm)',
                                        background: 'rgba(234,179,8,0.1)',
                                    }}>
                                        VS
                                    </div>
                                    <div style={{ flex: 1, textAlign: 'center' }}>
                                        <div style={{
                                            width: 32, height: 32, borderRadius: '50%', margin: '0 auto 4px',
                                            background: live.avatarB ? `url(${live.avatarB}) center/cover` : 'var(--color-bg-secondary)',
                                            border: `2px solid ${live.currentTurn === 'B' ? 'var(--color-gold)' : 'rgba(255,255,255,0.15)'}`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                                        }}>
                                            {!live.avatarB && live.usernameB[0]?.toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: 12, fontWeight: live.currentTurn === 'B' ? 700 : 400, color: live.currentTurn === 'B' ? 'var(--color-gold)' : 'var(--color-text-primary)' }}>
                                            {live.usernameB}
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                                            {formatTime(live.timeRemainingB)} · {live.attemptsB} int.
                                        </div>
                                    </div>
                                </div>

                                {/* Spectate Button */}
                                <button
                                    onClick={() => setSpectatingMatch(live.matchId)}
                                    style={{
                                        width: '100%', background: 'rgba(234,179,8,0.15)', border: '1px solid var(--color-gold)',
                                        color: 'var(--color-gold)', padding: '8px 0', borderRadius: 'var(--radius-sm)',
                                        cursor: 'pointer', fontWeight: 700, fontSize: 12,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                                        transition: 'background 0.2s',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(234,179,8,0.25)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(234,179,8,0.15)')}
                                >
                                    <Eye size={14} /> Espectrar
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No live matches placeholder */}
            {liveMatches.length === 0 && (
                <div className="data-table-wrapper" style={{ marginBottom: 24, padding: 20, textAlign: 'center' }}>
                    <Radio size={28} style={{ color: 'var(--color-text-muted)', margin: '0 auto 8px' }} />
                    <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
                        No hay partidas en vivo en este momento
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: 11, marginTop: 4 }}>
                        Las partidas activas aparecerán aquí automáticamente
                    </div>
                </div>
            )}

            {/* MATCH HISTORY */}
            <div className="data-table-wrapper">
                <div className="table-header">
                    <h2 className="flex items-center gap-2"><Clock size={18} /> Historial</h2>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Jugador A</th>
                            <th>Jugador B</th>
                            <th>Nivel</th>
                            <th>Apuesta</th>
                            <th>Estado</th>
                            <th>Resultado</th>
                            <th>Fecha</th>
                        </tr>
                    </thead>
                    <tbody>
                        {matches.map((match: any) => (
                            <tr key={match.id}>
                                <td>
                                    <div className="user-cell">
                                        <div className="user-avatar">
                                            {match.playerA?.username?.[0]?.toUpperCase() ?? 'A'}
                                        </div>
                                        <span className="user-name">{match.playerA?.username ?? 'N/A'}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="user-cell">
                                        <div className="user-avatar">
                                            {match.playerB?.username?.[0]?.toUpperCase() ?? 'B'}
                                        </div>
                                        <span className="user-name">{match.playerB?.username ?? 'N/A'}</span>
                                    </div>
                                </td>
                                <td>{match.level}</td>
                                <td className="text-gold font-bold">
                                    ${match.betAmount?.toLocaleString()}
                                </td>
                                <td>{getStatusBadge(match.status)}</td>
                                <td>{getResultLabel(match.result)}</td>
                                <td className="text-muted">{formatDate(match.createdAt)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* SPECTATOR VIEW OVERLAY */}
            {spectatingMatch && (
                <SpectatorView
                    matchId={spectatingMatch}
                    onClose={() => setSpectatingMatch(null)}
                />
            )}
        </div>
    );
}
