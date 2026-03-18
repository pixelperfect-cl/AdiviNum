import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { SkeletonCard } from '../components/Skeleton';

interface RankingUser {
    id: string;
    username: string;
    eloRating: number;
    gamesWon: number;
    gamesPlayed: number;
    country: string | null;
}

export function RankingPage() {
    const [rankings, setRankings] = useState<RankingUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [tab, setTab] = useState<'global' | 'country'>('global');

    useEffect(() => {
        loadRankings();
    }, [tab]);

    const loadRankings = async () => {
        setIsLoading(true);
        try {
            const path = tab === 'global' ? '/ranking/global' : '/ranking/country/CL';
            const data = await api.get<RankingUser[]>(path);
            setRankings(data);
        } catch {
            setRankings([]);
        }
        setIsLoading(false);
    };

    const getPositionClass = (pos: number) => {
        if (pos === 1) return 'gold';
        if (pos === 2) return 'silver';
        if (pos === 3) return 'bronze';
        return '';
    };

    const getMedal = (pos: number) => {
        if (pos === 1) return '🥇';
        if (pos === 2) return '🥈';
        if (pos === 3) return '🥉';
        return `${pos}`;
    };

    return (
        <div className="fade-in">
            <h2 className="section-title" style={{ textAlign: 'center' }}>🏆 Ranking</h2>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                    className={`btn ${tab === 'global' ? 'btn--primary' : 'btn--secondary'}`}
                    style={{ flex: 1 }}
                    onClick={() => setTab('global')}
                >
                    🌍 Global
                </button>
                <button
                    className={`btn ${tab === 'country' ? 'btn--primary' : 'btn--secondary'}`}
                    style={{ flex: 1 }}
                    onClick={() => setTab('country')}
                >
                    🇨🇱 Chile
                </button>
            </div>

            {/* List */}
            {isLoading ? (
                <div style={{ padding: '8px' }}>
                    <SkeletonCard count={5} />
                </div>
            ) : rankings.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
                    <p style={{ color: 'var(--text-muted)' }}>Aún no hay jugadores en el ranking</p>
                </div>
            ) : (
                <div className="card" style={{ padding: '8px' }}>
                    {rankings.map((player, i) => (
                        <div className="ranking-item" key={player.id}>
                            <div className={`ranking-position ${getPositionClass(i + 1)}`}>
                                {getMedal(i + 1)}
                            </div>
                            <div className="avatar">
                                {player.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="ranking-info">
                                <div className="ranking-name">{player.username}</div>
                                <div className="ranking-stats">
                                    {player.gamesWon}W / {player.gamesPlayed}P
                                    {player.country && ` · ${player.country}`}
                                </div>
                            </div>
                            <div className="ranking-elo">{player.eloRating}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
