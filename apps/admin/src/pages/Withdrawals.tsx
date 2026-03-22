import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api';
import { Banknote, Clock, DollarSign, CheckCircle, XCircle, BarChart3 } from 'lucide-react';

export default function Withdrawals() {
    const queryClient = useQueryClient();

    const { data: withdrawals = [], isLoading } = useQuery({
        queryKey: ['withdrawals'],
        queryFn: adminApi.getWithdrawals,
    });

    const approveMut = useMutation({
        mutationFn: adminApi.approveWithdrawal,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['withdrawals'] }),
    });

    const rejectMut = useMutation({
        mutationFn: adminApi.rejectWithdrawal,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['withdrawals'] }),
    });

    const getStatusBadge = (status: string) => {
        const map: Record<string, { cls: string; label: string }> = {
            PENDING: { cls: 'badge-orange', label: 'Pendiente' },
            APPROVED: { cls: 'badge-green', label: 'Aprobado' },
            REJECTED: { cls: 'badge-red', label: 'Rechazado' },
            COMPLETED: { cls: 'badge-blue', label: 'Completado' },
        };
        const info = map[status] ?? { cls: '', label: status };
        return <span className={`badge ${info.cls}`}>{info.label}</span>;
    };

    const pending = withdrawals.filter((w: any) => w.status === 'PENDING');
    const totalPending = pending.reduce((sum: number, w: any) => sum + (w.amount || 0), 0);

    if (isLoading) {
        return <div className="loading-spinner">Cargando retiros...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="flex items-center gap-3"><Banknote size={28} /> Retiros</h1>
                <p>Gestionar solicitudes de retiro</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ color: 'var(--color-orange)' }}><Clock size={28} /></div>
                    <div className="stat-info">
                        <div className="stat-value">{pending.length}</div>
                        <div className="stat-label">Pendientes</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ color: 'var(--color-gold)' }}><DollarSign size={28} /></div>
                    <div className="stat-info">
                        <div className="stat-value">${totalPending.toLocaleString()}</div>
                        <div className="stat-label">Monto pendiente</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ color: 'var(--color-blue)' }}><BarChart3 size={28} /></div>
                    <div className="stat-info">
                        <div className="stat-value">{withdrawals.length}</div>
                        <div className="stat-label">Total solicitudes</div>
                    </div>
                </div>
            </div>

            <div className="data-table-wrapper">
                <div className="table-header">
                    <h2 className="flex items-center gap-2"><Banknote size={18} /> Solicitudes de retiro</h2>
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
                            withdrawals.map((w: any) => (
                                <tr key={w.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar">
                                                {w.wallet?.user?.username?.[0]?.toUpperCase() ?? '?'}
                                            </div>
                                            <div>
                                                <div className="user-name">{w.wallet?.user?.username ?? 'N/A'}</div>
                                                <div className="user-email">{w.wallet?.user?.email ?? ''}</div>
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
                                            <div className="flex gap-2">
                                                <button
                                                    className="btn btn-green"
                                                    onClick={() => approveMut.mutate(w.id)}
                                                    disabled={approveMut.isPending}
                                                    style={{ fontSize: '12px' }}
                                                >
                                                    <CheckCircle size={14} /> Aprobar
                                                </button>
                                                <button
                                                    className="btn btn-red"
                                                    onClick={() => rejectMut.mutate(w.id)}
                                                    disabled={rejectMut.isPending}
                                                    style={{ fontSize: '12px' }}
                                                >
                                                    <XCircle size={14} /> Rechazar
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
