import { useState, useEffect } from 'react';
import { adminApi } from '../api';

export default function Dashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminApi.getDashboard()
            .then(setStats)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="loading-spinner">⏳ Cargando dashboard...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1>Dashboard</h1>
                <p>Resumen general de AdiviNum</p>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats?.totalUsers?.toLocaleString() ?? '—'}</div>
                        <div className="stat-label">Usuarios</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">🎮</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats?.activeMatches?.toLocaleString() ?? '—'}</div>
                        <div className="stat-label">Partidas activas</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                        <div className="stat-value">${stats?.totalRevenue?.toLocaleString() ?? '—'}</div>
                        <div className="stat-label">Ingresos totales</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats?.pendingWithdrawals?.toLocaleString() ?? '—'}</div>
                        <div className="stat-label">Retiros pendientes</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">🏟️</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats?.activeTournaments ?? '—'}</div>
                        <div className="stat-label">Torneos activos</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">🔗</div>
                    <div className="stat-info">
                        <div className="stat-value">{stats?.totalReferrals ?? '—'}</div>
                        <div className="stat-label">Referidos</div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="data-table-wrapper">
                <div className="table-header">
                    <h2>📋 Actividad reciente</h2>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Evento</th>
                            <th>Detalle</th>
                            <th>Tiempo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats?.recentActivity?.length > 0 ? (
                            stats.recentActivity.map((a: any, i: number) => (
                                <tr key={i}>
                                    <td><span className={`badge ${a.badgeClass}`}>{a.type}</span></td>
                                    <td>{a.detail}</td>
                                    <td className="text-muted">{a.time}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="text-muted" style={{ textAlign: 'center', padding: '40px' }}>
                                    Sin actividad reciente
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
