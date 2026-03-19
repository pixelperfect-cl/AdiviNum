import { useState, useEffect, useRef } from 'react';
import { useUserStore } from '../stores/userStore';
import { api } from '../services/api';
import { Skeleton, SkeletonCard } from '../components/Skeleton';

interface MatchHistory {
    id: string;
    result: 'WIN' | 'DRAW' | 'LOSS';
    finishedAt: string;
}

interface LevelInfo {
    level: number;
    xp: number;
    xpInLevel: number;
    xpNeeded: number;
    progress: number;
    isMaxLevel: boolean;
}

// Mini bar chart component for wins/losses
function WinLossChart({ matches }: { matches: MatchHistory[] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || matches.length === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const w = rect.width;
        const h = rect.height;

        // Group last 10 matches (newest first → reverse to show oldest→newest)
        const last = [...matches].slice(0, 10).reverse();

        // Clear
        ctx.clearRect(0, 0, w, h);

        const barWidth = Math.min(40, (w - 20) / last.length - 4);
        const gap = 4;
        const totalWidth = last.length * (barWidth + gap) - gap;
        const startX = (w - totalWidth) / 2;
        const midY = h / 2;
        const maxBarH = midY - 20;

        // Draw center line
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(10, midY);
        ctx.lineTo(w - 10, midY);
        ctx.stroke();

        // Labels
        ctx.fillStyle = 'rgba(76, 175, 80, 0.6)';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Victorias', 10, 14);
        ctx.fillStyle = 'rgba(244, 67, 54, 0.6)';
        ctx.fillText('Derrotas', 10, h - 6);

        last.forEach((m, i) => {
            const x = startX + i * (barWidth + gap);

            if (m.result === 'WIN') {
                const barH = maxBarH * 0.8;
                const gradient = ctx.createLinearGradient(x, midY - barH, x, midY);
                gradient.addColorStop(0, 'rgba(76, 175, 80, 0.9)');
                gradient.addColorStop(1, 'rgba(76, 175, 80, 0.3)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.roundRect(x, midY - barH, barWidth, barH, [4, 4, 0, 0]);
                ctx.fill();
            } else if (m.result === 'LOSS') {
                const barH = maxBarH * 0.8;
                const gradient = ctx.createLinearGradient(x, midY, x, midY + barH);
                gradient.addColorStop(0, 'rgba(244, 67, 54, 0.3)');
                gradient.addColorStop(1, 'rgba(244, 67, 54, 0.9)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.roundRect(x, midY, barWidth, barH, [0, 0, 4, 4]);
                ctx.fill();
            } else {
                // Draw
                const barH = maxBarH * 0.3;
                ctx.fillStyle = 'rgba(234, 179, 8, 0.5)';
                ctx.beginPath();
                ctx.roundRect(x, midY - barH / 2, barWidth, barH, 4);
                ctx.fill();
            }
        });
    }, [matches]);

    if (matches.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                ¡Aún no tienes partidas! Comienza a jugar.
            </div>
        );
    }

    return (
        <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '160px', display: 'block' }}
        />
    );
}

export function HomePage() {
    const { user, wallet, isLoading } = useUserStore();
    const [matches, setMatches] = useState<MatchHistory[]>([]);
    const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);

    useEffect(() => {
        api.get<MatchHistory[]>('/users/me/matches')
            .then(setMatches)
            .catch(console.error);
        api.get<LevelInfo>('/users/me/level-info')
            .then(setLevelInfo)
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

    const losses = user.gamesPlayed - user.gamesWon;

    return (
        <div className="fade-in">
            {/* Welcome */}
            <div className="welcome-section">
                <p className="welcome-greeting">¡Bienvenido de vuelta!</p>
                <h1 className="welcome-name">{user.username}</h1>
                <span className="welcome-level">
                    ⭐ Nivel {user.currentLevel}
                </span>
                {/* XP Progress Bar */}
                {levelInfo && !levelInfo.isMaxLevel && (
                    <div style={{ maxWidth: '300px', margin: '10px auto 0' }}>
                        <div className="xp-bar__track">
                            <div className="xp-bar__fill" style={{ width: `${levelInfo.progress}%` }} />
                        </div>
                        <span className="xp-bar__label">
                            {levelInfo.xpInLevel}/{levelInfo.xpNeeded} XP — Nivel {levelInfo.level + 1}
                        </span>
                    </div>
                )}
                {levelInfo && levelInfo.isMaxLevel && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--gold)', marginTop: '6px' }}>
                        🏆 ¡Nivel máximo alcanzado!
                    </div>
                )}
            </div>

            {/* Quick Stats — 4 cards */}
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
                    <div className="quick-stat__value" style={{ color: 'var(--error)' }}>{losses}</div>
                    <div className="quick-stat__label">Derrotas</div>
                </div>
                <div className="card quick-stat">
                    <div className="quick-stat__value">{winRate}%</div>
                    <div className="quick-stat__label">Win Rate</div>
                </div>
            </div>

            {/* Performance — 3 stat cards */}
            <div className="perf-cards">
                <div className="card perf-card">
                    <div className="perf-card__icon">🏅</div>
                    <div className="perf-card__value" style={{ color: 'var(--gold)' }}>{user.eloRating}</div>
                    <div className="perf-card__label">Rating ELO</div>
                </div>
                <div className="card perf-card">
                    <div className="perf-card__icon">🔥</div>
                    <div className="perf-card__value">{user.streakCurrent}</div>
                    <div className="perf-card__label">Racha actual</div>
                </div>
                <div className="card perf-card">
                    <div className="perf-card__icon">🪙</div>
                    <div className="perf-card__value" style={{ color: 'var(--gold)' }}>
                        {(wallet?.balanceVirtual ?? 0).toLocaleString()}
                    </div>
                    <div className="perf-card__label">Monedas</div>
                </div>
            </div>

            {/* Wins/Losses Chart — full width */}
            <div className="card" style={{ marginTop: '16px' }}>
                <p className="section-subtitle">Últimas Partidas</p>
                <WinLossChart matches={matches} />
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
