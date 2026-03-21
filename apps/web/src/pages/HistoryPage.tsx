import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SkeletonCard } from '../components/Skeleton';

interface MatchRecord {
    id: string;
    level: number;
    betAmount: number;
    currencyType: string;
    opponent: string;
    result: 'WIN' | 'LOSS' | 'DRAW';
    resultDetail: string;
    isAbandon: boolean;
    isTimeout: boolean;
    totalAttempts: number;
    finishedAt: string;
    createdAt: string;
}

interface MatchAttempt {
    player: string;
    guess: string;
    toques: number;
    famas: number;
    turnNumber: number;
}

interface MatchDetail {
    id: string;
    level: number;
    betAmount: number;
    currencyType: string;
    opponent: string;
    result: string;
    resultDetail: string;
    secretA: string;
    secretB: string;
    myRole: string;
    timeUsedA: number;
    timeUsedB: number;
    finishedAt: string;
    createdAt: string;
    attempts: MatchAttempt[];
}

export function HistoryPage() {
    const [matches, setMatches] = useState<MatchRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<MatchRecord[]>('/users/me/matches')
            .then(data => setMatches(data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="fade-in" style={{ padding: '10px' }}>
                <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '20px' }}>
                    📋 Historial de Partidas
                </h2>
                <SkeletonCard count={4} />
            </div>
        );
    }

    const stats = {
        total: matches.length,
        wins: matches.filter(m => m.result === 'WIN').length,
        losses: matches.filter(m => m.result === 'LOSS').length,
        draws: matches.filter(m => m.result === 'DRAW').length,
    };
    const winRate = stats.total > 0 ? Math.round((stats.wins / stats.total) * 100) : 0;

    return (
        <div className="fade-in">
            <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '20px' }}>
                📋 Historial de Partidas
            </h2>

            {/* Summary stats */}
            <div className="quick-stats" style={{ marginBottom: '24px' }}>
                <div className="card quick-stat">
                    <div className="quick-stat__value">{stats.total}</div>
                    <div className="quick-stat__label">Total</div>
                </div>
                <div className="card quick-stat">
                    <div className="quick-stat__value" style={{ color: 'var(--success)' }}>{stats.wins}</div>
                    <div className="quick-stat__label">Victorias</div>
                </div>
                <div className="card quick-stat">
                    <div className="quick-stat__value" style={{ color: 'var(--error)' }}>{stats.losses}</div>
                    <div className="quick-stat__label">Derrotas</div>
                </div>
                <div className="card quick-stat">
                    <div className="quick-stat__value" style={{ color: 'var(--gold)' }}>{winRate}%</div>
                    <div className="quick-stat__label">Win Rate</div>
                </div>
            </div>

            {/* Match list */}
            {matches.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <p style={{ fontSize: '2rem', marginBottom: '8px' }}>🎮</p>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Aún no has jugado ninguna partida.
                    </p>
                </div>
            ) : (
                <div className="history-list">
                    {matches.map((match) => (
                        <MatchCard key={match.id} match={match} />
                    ))}
                </div>
            )}
        </div>
    );
}

function MatchCard({ match }: { match: MatchRecord }) {
    const [expanded, setExpanded] = useState(false);
    const [detail, setDetail] = useState<MatchDetail | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const resultConfig = {
        WIN: { emoji: '🏆', label: 'Victoria', color: 'var(--success)', className: 'history-card--win' },
        LOSS: { emoji: '😔', label: 'Derrota', color: 'var(--error)', className: 'history-card--loss' },
        DRAW: { emoji: '🤝', label: 'Empate', color: 'var(--text-secondary)', className: 'history-card--draw' },
    };

    const config = resultConfig[match.result];
    const timeAgo = formatTimeAgo(match.finishedAt);
    const detailLabel = match.isAbandon
        ? 'Abandono'
        : match.isTimeout
            ? 'Tiempo agotado'
            : `${match.totalAttempts} intentos`;

    // Calculate match duration
    const durationMs = new Date(match.finishedAt).getTime() - new Date(match.createdAt).getTime();
    const durationStr = formatDuration(durationMs);

    const toggleExpand = async () => {
        if (expanded) {
            setExpanded(false);
            return;
        }
        setExpanded(true);
        if (!detail) {
            setLoadingDetail(true);
            try {
                const data = await api.get<MatchDetail>(`/users/me/matches/${match.id}`);
                setDetail(data);
            } catch (err) {
                console.error(err);
            }
            setLoadingDetail(false);
        }
    };

    return (
        <div className={`card history-card ${config.className} ${expanded ? 'history-card--expanded' : ''}`}>
            <div className="history-card__header">
                <span className="history-card__result" style={{ color: config.color }}>
                    {config.emoji} {config.label}
                </span>
                <span className="history-card__time">
                    {timeAgo}
                </span>
            </div>
            <div className="history-card__body">
                <div className="history-card__opponent">
                    <span className="history-card__label">vs</span>
                    <span className="history-card__opponent-name">{match.opponent}</span>
                </div>
                <div className="history-card__details">
                    <span className="history-card__level">Nivel {match.level}</span>
                    <span className="history-card__dot">•</span>
                    <span className="history-card__bet">
                        {match.currencyType === 'VIRTUAL' ? '🪙' : '💰'} {match.betAmount.toLocaleString()}
                    </span>
                    <span className="history-card__dot">•</span>
                    <span>{detailLabel}</span>
                    <span className="history-card__dot">•</span>
                    <span>⏱ {durationStr}</span>
                </div>
            </div>

            {/* Expand / Collapse button */}
            <button className="history-card__toggle" onClick={toggleExpand}>
                <span>{expanded ? 'Ocultar detalle' : 'Ver detalle'}</span>
                <span className={`history-card__toggle-chevron ${expanded ? 'history-card__toggle-chevron--open' : ''}`}>▾</span>
            </button>

            {/* Expanded detail */}
            {expanded && (
                <div className="history-detail">
                    {loadingDetail ? (
                        <div style={{ textAlign: 'center', padding: '12px' }}>
                            <div className="spinner" style={{ width: '16px', height: '16px' }} />
                        </div>
                    ) : detail ? (
                        <>
                            {/* Secrets & time comparison */}
                            <div className="history-detail__stats-grid">
                                <div className="history-detail__stat-box">
                                    <div className="history-detail__stat-label">
                                        {detail.myRole === 'A' ? '🔒 Tu secreto' : '🔓 Secreto rival'}
                                    </div>
                                    <div className="history-detail__stat-value history-detail__secret-digits">
                                        {(detail.secretA || '????').split('').map((d, i) => (
                                            <span key={i} className="history-detail__digit">{d}</span>
                                        ))}
                                    </div>
                                    <div className="history-detail__stat-sub">
                                        ⏱ {formatDuration(detail.timeUsedA)}
                                    </div>
                                </div>
                                <div className="history-detail__stat-box">
                                    <div className="history-detail__stat-label">
                                        {detail.myRole === 'B' ? '🔒 Tu secreto' : '🔓 Secreto rival'}
                                    </div>
                                    <div className="history-detail__stat-value history-detail__secret-digits">
                                        {(detail.secretB || '????').split('').map((d, i) => (
                                            <span key={i} className="history-detail__digit">{d}</span>
                                        ))}
                                    </div>
                                    <div className="history-detail__stat-sub">
                                        ⏱ {formatDuration(detail.timeUsedB)}
                                    </div>
                                </div>
                            </div>

                            {/* Attempts timeline */}
                            <div className="history-detail__section-title">
                                📊 Intentos ({detail.attempts.length})
                            </div>
                            <div className="history-detail__attempts">
                                {detail.attempts.length === 0 ? (
                                    <p className="text-muted" style={{ textAlign: 'center', fontSize: '0.8rem' }}>
                                        Sin intentos registrados
                                    </p>
                                ) : (
                                    detail.attempts.map((a, i) => {
                                        const isMe = a.player === detail.myRole;
                                        return (
                                            <div key={i} className={`history-attempt ${isMe ? 'history-attempt--me' : 'history-attempt--opp'}`}>
                                                <span className="history-attempt__turn">#{a.turnNumber}</span>
                                                <span className="history-attempt__player">
                                                    {isMe ? '🧠 Tú' : '🎭 Rival'}
                                                </span>
                                                <span className="history-attempt__guess">{a.guess}</span>
                                                <span className="history-attempt__result">
                                                    {a.famas > 0 && <span className="fama-badge">🎯{a.famas}F</span>}
                                                    {a.toques > 0 && <span className="toque-badge">💡{a.toques}T</span>}
                                                    {a.famas === 0 && a.toques === 0 && <span className="miss-badge">✗ Miss</span>}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </>
                    ) : null}
                </div>
            )}
        </div>
    );
}

function formatTimeAgo(dateStr: string): string {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return 'Ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHour < 24) return `Hace ${diffHour}h`;
    if (diffDay < 7) return `Hace ${diffDay}d`;
    return new Date(dateStr).toLocaleDateString();
}

function formatDuration(ms: number): string {
    if (!ms || ms < 0) return '0s';
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    if (min === 0) return `${sec}s`;
    return `${min}m ${sec}s`;
}
