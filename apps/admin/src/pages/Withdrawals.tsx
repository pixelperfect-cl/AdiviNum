import { useState, useEffect } from 'react';
import { adminApi } from '../api';

export default function Withdrawals() {
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminApi.getWithdrawals()
            .then(setWithdrawals)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        try {
            if (action === 'approve') {
                await adminApi.approveWithdrawal(id);
            } else {
                await adminApi.rejectWithdrawal(id);
            }
            setWithdrawals(withdrawals.map(w =>
                w.id === id ? { ...w, status: action === 'approve' ? 'APPROVED' : 'REJECTED' } : w
            ));
        } catch (err) {
            console.error(`${action} failed:`, err);
        }
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, { cls: string; label: string }> = {
            PENDING: { cls: 'badge-orange', label: '⏳ Pendiente' },
            APPROVED: { cls: 'badge-green', label: '✅ Aprobado' },
            REJECTED: { cls: 'badge-red', label: '❌ Rechazado' },
            COMPLETED: { cls: 'badge-blue', label: '💸 Completado' },
        };
        const info = map[status] ?? { cls: '', label: status };
        return <span className={`badge ${info.cls}`}>{info.label}</span>;
    };

    const pending = withdrawals.filter(w => w.status === 'PENDING');
    const totalPending = pending.reduce((sum, w) => sum + (w.amount || 0), 0);

    if (loading) {
        return <div className="loading-spinner">⏳ Cargando retiros...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1>Retiros</h1>
                <p>Gestionar solicitudes de retiro</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-info">
                        <div className="stat-value">{pending.length}</div>
                        <div className="stat-label">Pendientes</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                        <div className="stat-value">${totalPending.toLocaleString()}</div>
                        <div className="stat-label">Monto pendiente</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-info">
                        <div className="stat-value">{withdrawals.length}</div>
                        <div className="stat-label">Total solicitudes</div>
                    </div>
                </div>
            </div>

            <div className="data-table-wrapper">
                <div className="table-header">
                    <h2>💸 Solicitudes de retiro</h2>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>Monto</th>
                            <th>Método</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {withdrawals.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-muted" style={{ textAlign: 'center', padding: '40px' }}>
                                    No hay solicitudes de retiro
                                </td>
                            </tr>
                        ) : (
                            withdrawals.map((w) => (
                                <tr key={w.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar">
                                                {w.user?.username?.[0]?.toUpperCase() ?? '?'}
                                            </div>
                                            <div>
                                                <div className="user-name">{w.user?.username ?? 'N/A'}</div>
                                                <div className="user-email">{w.user?.email ?? ''}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-gold font-bold">
                                        ${w.amount?.toLocaleString()}
                                    </td>
                                    <td>{w.method ?? 'Transferencia'}</td>
                                    <td>{getStatusBadge(w.status)}</td>
                                    <td className="text-muted">
                                        {new Date(w.createdAt).toLocaleDateString('es', {
                                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </td>
                                    <td>
                                        {w.status === 'PENDING' && (
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <button
                                                    className="btn btn-green"
                                                    onClick={() => handleAction(w.id, 'approve')}
                                                    style={{ fontSize: '12px' }}
                                                >
                                                    ✅ Aprobar
                                                </button>
                                                <button
                                                    className="btn btn-red"
                                                    onClick={() => handleAction(w.id, 'reject')}
                                                    style={{ fontSize: '12px' }}
                                                >
                                                    ❌ Rechazar
                                                </button>
                                            </div>
                                        )}
                                        {w.status !== 'PENDING' && (
                                            <span className="text-muted">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
