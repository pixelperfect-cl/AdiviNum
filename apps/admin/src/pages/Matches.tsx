import { useState, useEffect } from 'react';
import { adminApi } from '../api';

export default function Matches() {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminApi.getMatches(100)
            .then((res: any) => setMatches(res?.matches || res?.data || [])) // Some endpoints return { data: [] } or { matches: [] }
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const getStatusBadge = (status: string) => {
        const map: Record<string, { cls: string; label: string }> = {
            WAITING: { cls: 'badge-orange', label: '⏳ Esperando' },
            COIN_FLIP: { cls: 'badge-blue', label: '🪙 Coin Flip' },
            IN_PROGRESS: { cls: 'badge-green', label: '🎮 En juego' },
            FINISHED: { cls: 'badge-purple', label: '✅ Terminada' },
            ABANDONED: { cls: 'badge-red', label: '❌ Abandonada' },
        };
        const info = map[status] ?? { cls: '', label: status };
        return <span className={`badge ${info.cls}`}>{info.label}</span>;
    };

    const getResultLabel = (result: string | null) => {
        if (!result) return '—';
        const map: Record<string, string> = {
            PLAYER_A_WINS: '🏆 Jugador A',
            PLAYER_B_WINS: '🏆 Jugador B',
            DRAW: '🤝 Empate',
            TIMEOUT_A: '⏱️ Timeout A',
            TIMEOUT_B: '⏱️ Timeout B',
            ABANDON_A: '🏳️ Abandono A',
            ABANDON_B: '🏳️ Abandono B',
        };
        return map[result] ?? result;
    };

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('es', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

    if (loading) {
        return <div className="loading-spinner">⏳ Cargando partidas...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1>Partidas</h1>
                <p>Historial de todas las partidas</p>
            </div>

            <div className="stats-grid" style={{ marginBottom: 24 }}>
                <div className="stat-card">
                    <div className="stat-icon">🎮</div>
                    <div className="stat-info">
                        <div className="stat-value">{matches.length}</div>
                        <div className="stat-label">Total partidas</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🟢</div>
                    <div className="stat-info">
                        <div className="stat-value">
                            {matches.filter(m => m.status === 'IN_PROGRESS').length}
                        </div>
                        <div className="stat-label">En progreso</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                        <div className="stat-value">
                            {matches.filter(m => m.status === 'FINISHED').length}
                        </div>
                        <div className="stat-label">Terminadas</div>
                    </div>
                </div>
            </div>

            <div className="data-table-wrapper">
                <div className="table-header">
                    <h2>📋 Historial</h2>
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
                        {matches.map((match) => (
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
        </div>
    );
}
