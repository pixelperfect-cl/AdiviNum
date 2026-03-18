import { useState, useEffect } from 'react';
import { useUserStore } from '../stores/userStore';
import { api } from '../services/api';
import { Skeleton, SkeletonCard } from '../components/Skeleton';

interface RecentMatch {
    id: string;
    opponent: string;
    result: 'WIN' | 'DRAW' | 'LOSS';
    level: number;
    finishedAt: string;
}

export function HomePage() {
    const { user, wallet, isLoading } = useUserStore();
    const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([]);

    useEffect(() => {
        api.get<RecentMatch[]>('/users/me/history?limit=3')
            .then(setRecentMatches)
            .catch(console.error);
    }, []);

    if (isLoading || !user) {
        return (
            <div className="page" style={{ padding: '20px', maxWidth: '480px', margin: '0 auto' }}>
                <Skeleton width="50%" height="28px" style={{ marginBottom: '16px' }} />
                <Skeleton width="80%" height="16px" style={{ marginBottom: '24px' }} />
                <SkeletonCard count={3} />
            </div>
        );
    }

    const winRate = user.gamesPlayed > 0
        ? Math.round((user.gamesWon / user.gamesPlayed) * 100)
        : 0;

    return (
        <div className="fade-in">
            {/* Welcome */}
            <div className="welcome-section">
                <p className="welcome-greeting">¡Bienvenido de vuelta!</p>
                <h1 className="welcome-name">{user.username}</h1>
                <span className="welcome-level">
                    ⭐ Nivel {user.currentLevel}
                </span>
            </div>

            {/* Quick Stats */}
            <div className="quick-stats">
                <div className="card quick-stat">
                    <div className="quick-stat__value">{user.gamesPlayed}</div>
                    <div className="quick-stat__label">Partidas</div>
                </div>
                <div className="card quick-stat">
                    <div className="quick-stat__value" style={{ color: 'var(--success)' }}>{user.gamesWon}</div>
                    <div className="quick-stat__label">Victorias</div>
                </div>
                <div className="card quick-stat">
                    <div className="quick-stat__value" style={{ color: 'var(--gold)' }}>{user.eloRating}</div>
                    <div className="quick-stat__label">ELO</div>
                </div>
                <div className="card quick-stat">
                    <div className="quick-stat__value">{winRate}%</div>
                    <div className="quick-stat__label">Win Rate</div>
                </div>
            </div>

            {/* Desktop: 2-column layout for cards */}
            <div className="home-grid">
                {/* Performance Card */}
                <div className="card">
                    <p className="section-subtitle">Rendimiento</p>
                    <div className="stat-row">
                        <span className="stat-label">🏅 Rating ELO</span>
                        <span className="stat-value" style={{ color: 'var(--gold)' }}>
                            {user.eloRating}
                        </span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">🔥 Racha actual</span>
                        <span className="stat-value">{user.streakCurrent}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">🪙 Monedas</span>
                        <span className="stat-value" style={{ color: 'var(--gold)' }}>
                            {(wallet?.balanceVirtual ?? 0).toLocaleString()}
                        </span>
                    </div>
                </div>

                {/* Recent Matches */}
                <div className="card">
                    <p className="section-subtitle">Partidas Recientes</p>
                    {recentMatches.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {recentMatches.map(m => (
                                <div key={m.id} className="stat-row" style={{ padding: '6px 0' }}>
                                    <span className="stat-label">
                                        {m.result === 'WIN' ? '✅' : m.result === 'DRAW' ? '🤝' : '❌'}{' '}
                                        vs {m.opponent}
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: '6px' }}>
                                            Nv.{m.level}
                                        </span>
                                    </span>
                                    <span className="stat-value" style={{
                                        color: m.result === 'WIN' ? 'var(--success)' : m.result === 'DRAW' ? 'var(--gold)' : 'var(--error)',
                                        fontSize: '0.8rem',
                                    }}>
                                        {m.result === 'WIN' ? 'Victoria' : m.result === 'DRAW' ? 'Empate' : 'Derrota'}
                                    </span>
                                </div>
                            ))}
                            <a href="/history" style={{ fontSize: '0.8rem', color: 'var(--gold)', textAlign: 'center', marginTop: '4px' }}>
                                Ver todo el historial →
                            </a>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '16px 0' }}>
                            ¡Aún no tienes partidas! Comienza a jugar.
                        </p>
                    )}
                </div>
            </div>

            {/* Play CTA */}
            <div className="play-cta">
                <a href="/play">
                    <button className="btn btn--primary btn--large pulse-gold">
                        🎯 ¡Jugar Ahora!
                    </button>
                </a>
            </div>
        </div>
    );
}
