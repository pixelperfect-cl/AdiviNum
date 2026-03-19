import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { api } from '../services/api';

interface EloPoint {
    date: string;
    elo: number;
}

interface Achievement {
    id: string;
    key: string;
    name: string;
    description: string;
    icon: string;
    reward: number;
    unlocked: boolean;
    unlockedAt: string | null;
}

// Radar / Spider chart component
function RadarChart({ winRate, streak, wins, games, elo }: {
    winRate: number; streak: number; wins: number; games: number; elo: number;
}) {
    const size = 200;
    const cx = size / 2;
    const cy = size / 2;
    const levels = 4;
    const radius = 80;

    const axes = [
        { label: 'Win %', value: Math.min(winRate / 100, 1) },
        { label: 'Racha', value: Math.min(streak / 10, 1) },
        { label: 'Victorias', value: Math.min(wins / 50, 1) },
        { label: 'Partidas', value: Math.min(games / 100, 1) },
        { label: 'ELO', value: Math.min((elo - 800) / 700, 1) },
    ];

    const n = axes.length;
    const angleStep = (2 * Math.PI) / n;
    const startAngle = -Math.PI / 2;

    const getPoint = (i: number, r: number) => ({
        x: cx + r * Math.cos(startAngle + i * angleStep),
        y: cy + r * Math.sin(startAngle + i * angleStep),
    });

    // Grid polygons
    const gridPolygons = Array.from({ length: levels }, (_, lvl) => {
        const r = (radius / levels) * (lvl + 1);
        const pts = Array.from({ length: n }, (_, i) => getPoint(i, r));
        return pts.map(p => `${p.x},${p.y}`).join(' ');
    });

    // Data polygon
    const dataPoints = axes.map((a, i) => {
        const r = Math.max(a.value, 0.05) * radius;
        return getPoint(i, r);
    });
    const dataPolygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

    // Axis lines & labels
    const axisElements = axes.map((a, i) => {
        const end = getPoint(i, radius);
        const labelPos = getPoint(i, radius + 16);
        return { ...a, end, labelPos, dot: dataPoints[i] };
    });

    return (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
            <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="180" style={{ maxWidth: '220px' }}>
                {/* Grid */}
                {gridPolygons.map((pts, i) => (
                    <polygon
                        key={i}
                        points={pts}
                        fill="none"
                        stroke="rgba(255,255,255,0.06)"
                        strokeWidth="1"
                    />
                ))}

                {/* Axis lines */}
                {axisElements.map((a, i) => (
                    <line key={i} x1={cx} y1={cy} x2={a.end.x} y2={a.end.y}
                        stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                ))}

                {/* Data fill */}
                <polygon
                    points={dataPolygon}
                    fill="rgba(234, 179, 8, 0.15)"
                    stroke="var(--gold)"
                    strokeWidth="1.5"
                />

                {/* Data dots */}
                {axisElements.map((a, i) => (
                    <circle key={i} cx={a.dot.x} cy={a.dot.y} r="3"
                        fill="var(--gold)" stroke="var(--bg)" strokeWidth="1" />
                ))}

                {/* Labels */}
                {axisElements.map((a, i) => (
                    <text key={i} x={a.labelPos.x} y={a.labelPos.y}
                        textAnchor="middle" dominantBaseline="middle"
                        fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="Inter, sans-serif">
                        {a.label}
                    </text>
                ))}
            </svg>
        </div>
    );
}
type Tab = 'personal' | 'stats' | 'history' | 'wallet' | 'achievements';

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

function EloSparkline({ data }: { data: EloPoint[] }) {
    if (data.length < 2) return null;

    const elos = data.map(d => d.elo);
    const minElo = Math.min(...elos);
    const maxElo = Math.max(...elos);
    const range = maxElo - minElo || 1;

    const width = 280;
    const height = 60;
    const padding = 4;

    const points = data.map((d, i) => {
        const x = padding + (i / (data.length - 1)) * (width - padding * 2);
        const y = height - padding - ((d.elo - minElo) / range) * (height - padding * 2);
        return `${x},${y}`;
    }).join(' ');

    const lastPoint = data[data.length - 1];
    const firstPoint = data[0];
    const isUp = lastPoint.elo >= firstPoint.elo;

    return (
        <div className="elo-sparkline">
            <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
                <defs>
                    <linearGradient id="eloGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={isUp ? 'var(--success)' : 'var(--error)'} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={isUp ? 'var(--success)' : 'var(--error)'} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon
                    points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
                    fill="url(#eloGrad)"
                />
                <polyline
                    points={points}
                    fill="none"
                    stroke={isUp ? 'var(--success)' : 'var(--error)'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {(() => {
                    const lastX = padding + ((data.length - 1) / (data.length - 1)) * (width - padding * 2);
                    const lastY = height - padding - ((lastPoint.elo - minElo) / range) * (height - padding * 2);
                    return (
                        <circle cx={lastX} cy={lastY} r="3" fill={isUp ? 'var(--success)' : 'var(--error)'} />
                    );
                })()}
            </svg>
            <div className="elo-sparkline-labels">
                <span>{minElo}</span>
                <span>{maxElo}</span>
            </div>
        </div>
    );
}

export function ProfilePage() {
    const { user, wallet, logout, googleAvatarUrl, googleDisplayName, updateProfile } = useUserStore();
    const [searchParams] = useSearchParams();
    const initialTab = (searchParams.get('tab') as Tab) || 'personal';
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);
    const [eloHistory, setEloHistory] = useState<EloPoint[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [showAllAchievements, setShowAllAchievements] = useState(false);
    const [matchHistory, setMatchHistory] = useState<MatchRecord[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // Editable fields
    const [editingUsername, setEditingUsername] = useState(false);
    const [usernameInput, setUsernameInput] = useState('');
    const [savingUsername, setSavingUsername] = useState(false);

    useEffect(() => {
        api.get<EloPoint[]>('/users/me/elo-history')
            .then(data => setEloHistory(data || []))
            .catch(console.error);
        api.get<Achievement[]>('/users/me/achievements')
            .then(data => setAchievements(data || []))
            .catch(console.error);
    }, []);

    // Update active tab when URL changes
    useEffect(() => {
        const tab = searchParams.get('tab') as Tab;
        if (tab && ['personal', 'stats', 'history', 'wallet', 'achievements'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    // Lazy-load history when tab opens
    useEffect(() => {
        if (activeTab === 'history' && matchHistory.length === 0 && !historyLoading) {
            setHistoryLoading(true);
            api.get<MatchRecord[]>('/users/me/matches')
                .then(data => setMatchHistory(data || []))
                .catch(console.error)
                .finally(() => setHistoryLoading(false));
        }
    }, [activeTab]);

    if (!user) {
        return (
            <div className="page" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '16px' }}>⚠️ No se pudo cargar tu perfil</p>
                <button className="btn btn--primary" onClick={() => window.location.reload()}>Reintentar</button>
            </div>
        );
    }

    const winRate = user.gamesPlayed > 0
        ? Math.round((user.gamesWon / user.gamesPlayed) * 100)
        : 0;

    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const displayedAchievements = showAllAchievements ? achievements : achievements.slice(0, 6);
    const displayName = googleDisplayName || user.username;

    const handleSaveUsername = async () => {
        if (!usernameInput.trim() || usernameInput === user.username) {
            setEditingUsername(false);
            return;
        }
        setSavingUsername(true);
        await updateProfile({ username: usernameInput.trim() });
        setSavingUsername(false);
        setEditingUsername(false);
    };

    const tabs: { key: Tab; label: string; icon: string }[] = [
        { key: 'personal', label: 'Perfil', icon: '👤' },
        { key: 'stats', label: 'Estadísticas', icon: '📊' },
        { key: 'history', label: 'Historial', icon: '📋' },
        { key: 'wallet', label: 'Billetera', icon: '💰' },
        { key: 'achievements', label: 'Logros', icon: '🏅' },
    ];

    return (
        <div className="fade-in">
            {/* Profile header */}
            <div className="card" style={{ textAlign: 'center', padding: '28px 20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                    {googleAvatarUrl ? (
                        <img
                            src={googleAvatarUrl}
                            alt="avatar"
                            style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--gold)' }}
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div className="avatar avatar--lg" style={{ margin: 0 }}>
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    <div style={{ textAlign: 'left' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '2px' }}>
                            {displayName}
                        </h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '6px' }}>
                            {user.email}
                        </p>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <span className="badge badge--gold">⭐ Nivel {user.currentLevel}</span>
                            {user.isPremium && <span className="badge badge--blue">💎 Premium</span>}
                            {user.country && <span className="badge badge--green">🌍 {user.country}</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab bar */}
            <div style={{
                display: 'flex',
                gap: '4px',
                marginBottom: '16px',
                background: 'var(--bg-card, #1e1e2a)',
                borderRadius: '12px',
                padding: '4px',
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            flex: 1,
                            padding: '10px 8px',
                            borderRadius: '10px',
                            border: 'none',
                            background: activeTab === tab.key ? 'var(--gold)' : 'transparent',
                            color: activeTab === tab.key ? '#000' : 'var(--text-muted)',
                            fontWeight: activeTab === tab.key ? 700 : 400,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <span style={{ marginRight: '4px' }}>{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            {activeTab === 'personal' && (
                <div className="card" style={{ padding: '24px' }}>
                    <p className="section-subtitle">Datos Personales</p>

                    {/* Username */}
                    <div className="stat-row" style={{ alignItems: 'center' }}>
                        <span className="stat-label">Nombre de usuario</span>
                        {editingUsername ? (
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    value={usernameInput}
                                    onChange={e => setUsernameInput(e.target.value)}
                                    style={{
                                        padding: '6px 10px',
                                        borderRadius: '6px',
                                        border: '1px solid var(--border-color, #555)',
                                        background: 'var(--bg-main, #16161f)',
                                        color: 'var(--text-color, #fff)',
                                        fontSize: '0.9rem',
                                        width: '160px',
                                    }}
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && handleSaveUsername()}
                                />
                                <button
                                    onClick={handleSaveUsername}
                                    disabled={savingUsername}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: 'var(--success, #22c55e)',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    {savingUsername ? '...' : '✓'}
                                </button>
                                <button
                                    onClick={() => setEditingUsername(false)}
                                    style={{
                                        padding: '6px 10px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: 'var(--error, #ef4444)',
                                        color: '#fff',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        ) : (
                            <span
                                className="stat-value"
                                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                onClick={() => { setUsernameInput(user.username); setEditingUsername(true); }}
                            >
                                {user.username}
                                <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>✏️</span>
                            </span>
                        )}
                    </div>

                    <div className="stat-row">
                        <span className="stat-label">Email</span>
                        <span className="stat-value">{user.email}</span>
                    </div>

                    <div className="stat-row" style={{ alignItems: 'center' }}>
                        <span className="stat-label">País</span>
                        <select
                            value={user.country || ''}
                            onChange={async (e) => {
                                await updateProfile({ country: e.target.value });
                            }}
                            style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                border: '1px solid var(--border-color, #555)',
                                background: 'var(--bg-main, #16161f)',
                                color: 'var(--text-color, #fff)',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                appearance: 'auto',
                            }}
                        >
                            <option value="">🌍 Seleccionar</option>
                            <option value="CL">🇨🇱 Chile</option>
                            <option value="AR">🇦🇷 Argentina</option>
                            <option value="MX">🇲🇽 México</option>
                            <option value="CO">🇨🇴 Colombia</option>
                            <option value="PE">🇵🇪 Perú</option>
                            <option value="BR">🇧🇷 Brasil</option>
                            <option value="UY">🇺🇾 Uruguay</option>
                            <option value="EC">🇪🇨 Ecuador</option>
                            <option value="VE">🇻🇪 Venezuela</option>
                            <option value="BO">🇧🇴 Bolivia</option>
                            <option value="PY">🇵🇾 Paraguay</option>
                            <option value="US">🇺🇸 Estados Unidos</option>
                            <option value="ES">🇪🇸 España</option>
                        </select>
                    </div>

                    <div className="stat-row">
                        <span className="stat-label">Cuenta Premium</span>
                        <span className="stat-value">{user.isPremium ? '💎 Sí' : 'No'}</span>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
                        <button
                            className="btn btn--danger"
                            style={{ flex: 1 }}
                            onClick={() => logout()}
                        >
                            🚪 Cerrar Sesión
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'stats' && (
                <div>
                    {/* Charts row: ELO + Radar side by side */}
                    <div className="stats-charts-row">
                        {/* ELO Chart */}
                        <div className="card" style={{ flex: 1 }}>
                            <p className="section-subtitle">📈 Progreso ELO</p>
                            {eloHistory.length >= 2 ? (
                                <EloSparkline data={eloHistory} />
                            ) : (
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', padding: '20px 0' }}>
                                    Juega más partidas para ver tu progreso
                                </p>
                            )}
                        </div>

                        {/* Radar Chart */}
                        <div className="card" style={{ flex: 1 }}>
                            <p className="section-subtitle">🕸️ Perfil de Jugador</p>
                            <RadarChart
                                winRate={winRate}
                                streak={user.streakCurrent}
                                wins={user.gamesWon}
                                games={user.gamesPlayed}
                                elo={user.eloRating}
                            />
                        </div>
                    </div>

                    {/* Stat summary cards */}
                    <div className="perf-cards" style={{ marginTop: '16px' }}>
                        <div className="card perf-card">
                            <div className="perf-card__icon">⚔️</div>
                            <div className="perf-card__value">{user.gamesPlayed}</div>
                            <div className="perf-card__label">Partidas</div>
                        </div>
                        <div className="card perf-card">
                            <div className="perf-card__icon">🏆</div>
                            <div className="perf-card__value" style={{ color: 'var(--success)' }}>{user.gamesWon}</div>
                            <div className="perf-card__label">Victorias</div>
                        </div>
                        <div className="card perf-card">
                            <div className="perf-card__icon">📊</div>
                            <div className="perf-card__value">{winRate}%</div>
                            <div className="perf-card__label">Win Rate</div>
                        </div>
                        <div className="card perf-card">
                            <div className="perf-card__icon">🏅</div>
                            <div className="perf-card__value" style={{ color: 'var(--gold)' }}>{user.eloRating}</div>
                            <div className="perf-card__label">ELO</div>
                        </div>
                        <div className="card perf-card">
                            <div className="perf-card__icon">🔥</div>
                            <div className="perf-card__value">{user.streakCurrent}</div>
                            <div className="perf-card__label">Racha</div>
                        </div>
                        <div className="card perf-card">
                            <div className="perf-card__icon">💀</div>
                            <div className="perf-card__value" style={{ color: 'var(--error)' }}>{user.gamesPlayed - user.gamesWon}</div>
                            <div className="perf-card__label">Derrotas</div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div>
                    {historyLoading ? (
                        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                            <div className="spinner" />
                        </div>
                    ) : matchHistory.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <p style={{ fontSize: '2rem', marginBottom: '8px' }}>🎮</p>
                            <p style={{ color: 'var(--text-secondary)' }}>Aún no has jugado ninguna partida.</p>
                        </div>
                    ) : (
                        <>
                            {/* Quick stats */}
                            <div className="quick-stats" style={{ marginBottom: '16px' }}>
                                <div className="card quick-stat">
                                    <div className="quick-stat__value">{matchHistory.length}</div>
                                    <div className="quick-stat__label">Total</div>
                                </div>
                                <div className="card quick-stat">
                                    <div className="quick-stat__value" style={{ color: 'var(--success)' }}>{matchHistory.filter(m => m.result === 'WIN').length}</div>
                                    <div className="quick-stat__label">Victorias</div>
                                </div>
                                <div className="card quick-stat">
                                    <div className="quick-stat__value" style={{ color: 'var(--error)' }}>{matchHistory.filter(m => m.result === 'LOSS').length}</div>
                                    <div className="quick-stat__label">Derrotas</div>
                                </div>
                            </div>
                            {/* Match list */}
                            <div className="history-list">
                                {matchHistory.map(match => {
                                    const rc = { WIN: { e: '🏆', l: 'Victoria', c: 'var(--success)', cn: 'history-card--win' }, LOSS: { e: '😔', l: 'Derrota', c: 'var(--error)', cn: 'history-card--loss' }, DRAW: { e: '🤝', l: 'Empate', c: 'var(--text-secondary)', cn: 'history-card--draw' } };
                                    const cfg = rc[match.result];
                                    const dMs = new Date(match.finishedAt).getTime() - new Date(match.createdAt).getTime();
                                    const tSec = Math.floor(dMs / 1000);
                                    const dur = tSec >= 60 ? `${Math.floor(tSec / 60)}m ${tSec % 60}s` : `${tSec}s`;
                                    const ago = (() => { const d = Date.now() - new Date(match.finishedAt).getTime(); const m = Math.floor(d / 60000); if (m < 60) return `${m}min`; const h = Math.floor(d / 3600000); if (h < 24) return `${h}h`; return `${Math.floor(d / 86400000)}d`; })();
                                    return (
                                        <div key={match.id} className={`card history-card ${cfg.cn}`}>
                                            <div className="history-card__header">
                                                <span className="history-card__result" style={{ color: cfg.c }}>{cfg.e} {cfg.l}</span>
                                                <span className="history-card__time">{ago}</span>
                                            </div>
                                            <div className="history-card__body">
                                                <div className="history-card__opponent">
                                                    <span className="history-card__label">vs</span>
                                                    <span className="history-card__opponent-name">{match.opponent}</span>
                                                </div>
                                                <div className="history-card__details">
                                                    <span>Nv{match.level}</span>
                                                    <span className="history-card__dot">•</span>
                                                    <span>{match.currencyType === 'VIRTUAL' ? '🪙' : '💰'} {match.betAmount.toLocaleString()}</span>
                                                    <span className="history-card__dot">•</span>
                                                    <span>⏱ {dur}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === 'wallet' && (
                <div className="card card--gold">
                    <p className="section-subtitle">Billetera</p>
                    <div className="stat-row">
                        <span className="stat-label">🪙 Monedas virtuales</span>
                        <span className="stat-value" style={{ color: 'var(--gold)' }}>
                            {(wallet?.balanceVirtual ?? 0).toLocaleString()}
                        </span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">💰 Saldo real</span>
                        <span className="stat-value">
                            ${((wallet?.balanceFiat ?? 0) / 100).toLocaleString()} CLP
                        </span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">🏦 Ahorro</span>
                        <span className="stat-value">
                            ${((wallet?.balanceSavings ?? 0) / 100).toLocaleString()} CLP
                        </span>
                    </div>
                </div>
            )}

            {activeTab === 'achievements' && achievements.length > 0 && (
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <p className="section-subtitle" style={{ margin: 0 }}>🏅 Logros</p>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {unlockedCount}/{achievements.length}
                        </span>
                    </div>

                    <div className="achievements-progress" style={{ marginBottom: '14px' }}>
                        <div
                            className="achievements-progress-fill"
                            style={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
                        />
                    </div>

                    <div className="achievements-grid">
                        {displayedAchievements.map(a => (
                            <div key={a.id} className={`achievement-card ${a.unlocked ? 'achievement-card--unlocked' : 'achievement-card--locked'}`}>
                                <div className="achievement-icon">{a.icon || '🔒'}</div>
                                <div className="achievement-info">
                                    <div className="achievement-name">{a.name}</div>
                                    <div className="achievement-desc">{a.description}</div>
                                    {a.reward > 0 && (
                                        <div style={{ fontSize: '0.7rem', color: 'var(--gold)', marginTop: '2px' }}>
                                            🪙 {a.reward.toLocaleString()} monedas
                                        </div>
                                    )}
                                    {a.unlocked && a.unlockedAt && (
                                        <div className="achievement-date">
                                            ✅ {new Date(a.unlockedAt).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {achievements.length > 6 && (
                        <button
                            className="btn btn--ghost"
                            style={{ width: '100%', marginTop: '10px', fontSize: '0.8rem' }}
                            onClick={() => setShowAllAchievements(!showAllAchievements)}
                        >
                            {showAllAchievements ? 'Ver menos ▲' : `Ver todos (${achievements.length}) ▾`}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
