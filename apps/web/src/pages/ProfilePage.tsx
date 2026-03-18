import { useState, useEffect } from 'react';
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
    unlocked: boolean;
    unlockedAt: string | null;
}

type Tab = 'personal' | 'stats' | 'wallet' | 'achievements';

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
    const [activeTab, setActiveTab] = useState<Tab>('personal');
    const [eloHistory, setEloHistory] = useState<EloPoint[]>([]);
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [showAllAchievements, setShowAllAchievements] = useState(false);

    // Editable fields
    const [editingUsername, setEditingUsername] = useState(false);
    const [usernameInput, setUsernameInput] = useState('');
    const [savingUsername, setSavingUsername] = useState(false);

    useEffect(() => {
        api.get<EloPoint[]>('/users/me/elo-history')
            .then(setEloHistory)
            .catch(console.error);
        api.get<Achievement[]>('/users/me/achievements')
            .then(setAchievements)
            .catch(console.error);
    }, []);

    if (!user) {
        return (
            <div className="loading-page">
                <div className="spinner" />
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

                    <div className="stat-row">
                        <span className="stat-label">País</span>
                        <span className="stat-value">{user.country || '🌍 Sin configurar'}</span>
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
                    <div className="card" style={{ marginBottom: '16px' }}>
                        <p className="section-subtitle">Estadísticas</p>
                        <div className="stat-row">
                            <span className="stat-label">Partidas jugadas</span>
                            <span className="stat-value">{user.gamesPlayed}</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Victorias</span>
                            <span className="stat-value" style={{ color: 'var(--success)' }}>
                                {user.gamesWon}
                            </span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Win Rate</span>
                            <span className="stat-value">{winRate}%</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Rating ELO</span>
                            <span className="stat-value" style={{ color: 'var(--gold)' }}>
                                {user.eloRating}
                            </span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Racha actual</span>
                            <span className="stat-value">🔥 {user.streakCurrent}</span>
                        </div>
                    </div>

                    {/* ELO Chart */}
                    {eloHistory.length >= 2 && (
                        <div className="card">
                            <p className="section-subtitle">📈 Progreso ELO</p>
                            <EloSparkline data={eloHistory} />
                        </div>
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
