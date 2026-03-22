import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api';
import { Trophy, Plus, X, Rocket } from 'lucide-react';

export default function Tournaments() {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        name: '',
        description: '',
        format: 'SINGLE_ELIMINATION',
        maxPlayers: 16,
        entryFee: 1000,
        currencyType: 'VIRTUAL',
        level: 1,
        prizeDistribution: [50, 25, 15, 10],
        startsAt: '',
        registrationDeadline: '',
    });

    const { data: tournaments = [], isLoading } = useQuery({
        queryKey: ['tournaments'],
        queryFn: adminApi.getTournaments,
    });

    const createMut = useMutation({
        mutationFn: adminApi.createTournament,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tournaments'] });
            setShowForm(false);
        },
    });

    const startMut = useMutation({
        mutationFn: adminApi.startTournament,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tournaments'] }),
        onError: (err: any) => alert(err.message),
    });

    const handleCreate = () => {
        createMut.mutate({
            ...form,
            startsAt: new Date(form.startsAt).toISOString(),
            registrationDeadline: new Date(form.registrationDeadline).toISOString(),
        });
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, { cls: string; label: string }> = {
            REGISTRATION: { cls: 'badge-green', label: 'Registro' },
            IN_PROGRESS: { cls: 'badge-orange', label: 'En curso' },
            FINISHED: { cls: 'badge-purple', label: 'Finalizado' },
        };
        const info = map[status] ?? { cls: '', label: status };
        return <span className={`badge ${info.cls}`}>{info.label}</span>;
    };

    if (isLoading) {
        return <div className="loading-spinner">Cargando torneos...</div>;
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="flex items-center gap-3"><Trophy size={28} /> Torneos</h1>
                    <p>Crear y gestionar torneos</p>
                </div>
                <button className="btn btn-gold" onClick={() => setShowForm(!showForm)}>
                    {showForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> Nuevo torneo</>}
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="data-table-wrapper" style={{ padding: 24, marginBottom: 24 }}>
                    <h2 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>
                        <Trophy size={16} className="inline mr-2" />Crear torneo
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label className="text-xs text-muted font-semibold block mb-1">Nombre</label>
                            <input className="table-search w-full" value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Copa AdiviNum #1" />
                        </div>
                        <div>
                            <label className="text-xs text-muted font-semibold block mb-1">Descripción</label>
                            <input className="table-search w-full" value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Torneo semanal..." />
                        </div>
                        <div>
                            <label className="text-xs text-muted font-semibold block mb-1">Formato</label>
                            <select className="table-search w-full" value={form.format}
                                onChange={(e) => setForm({ ...form, format: e.target.value })}>
                                <option value="SINGLE_ELIMINATION">Eliminación directa</option>
                                <option value="ROUND_ROBIN">Round Robin</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-muted font-semibold block mb-1">Max jugadores</label>
                            <select className="table-search w-full" value={form.maxPlayers}
                                onChange={(e) => setForm({ ...form, maxPlayers: Number(e.target.value) })}>
                                <option value={8}>8</option>
                                <option value={16}>16</option>
                                <option value={32}>32</option>
                                <option value={64}>64</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-muted font-semibold block mb-1">Cuota de entrada</label>
                            <input className="table-search w-full" type="number" value={form.entryFee}
                                onChange={(e) => setForm({ ...form, entryFee: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label className="text-xs text-muted font-semibold block mb-1">Moneda</label>
                            <select className="table-search w-full" value={form.currencyType}
                                onChange={(e) => setForm({ ...form, currencyType: e.target.value })}>
                                <option value="VIRTUAL">Virtual (demo)</option>
                                <option value="FIAT">Fiat (real)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-muted font-semibold block mb-1">Nivel</label>
                            <input className="table-search w-full" type="number" min={1} max={10} value={form.level}
                                onChange={(e) => setForm({ ...form, level: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label className="text-xs text-muted font-semibold block mb-1">Inicio del torneo</label>
                            <input className="table-search w-full" type="datetime-local" value={form.startsAt}
                                onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs text-muted font-semibold block mb-1">Cierre de registro</label>
                            <input className="table-search w-full" type="datetime-local" value={form.registrationDeadline}
                                onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                        <button className="btn btn-gold" onClick={handleCreate} disabled={createMut.isPending}
                            style={{ opacity: createMut.isPending ? 0.7 : 1 }}>
                            {createMut.isPending ? 'Creando...' : <><Trophy size={14} /> Crear torneo</>}
                        </button>
                        <button className="btn" onClick={() => setShowForm(false)}>Cancelar</button>
                    </div>
                </div>
            )}

            {/* Tournament List */}
            <div className="data-table-wrapper">
                <div className="table-header">
                    <h2 className="flex items-center gap-2"><Trophy size={18} /> Torneos ({tournaments.length})</h2>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Formato</th>
                            <th>Jugadores</th>
                            <th>Cuota</th>
                            <th>Pozo</th>
                            <th>Estado</th>
                            <th>Inicio</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tournaments.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="text-muted" style={{ textAlign: 'center', padding: '40px' }}>
                                    No hay torneos creados
                                </td>
                            </tr>
                        ) : (
                            tournaments.map((t: any) => (
                                <tr key={t.id}>
                                    <td>
                                        <div>
                                            <div className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{t.name}</div>
                                            {t.description && (
                                                <div className="text-muted" style={{ fontSize: 12 }}>{t.description}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td>{t.format === 'SINGLE_ELIMINATION' ? 'Eliminación' : 'Liga'}</td>
                                    <td>{t._count?.participants ?? 0}/{t.maxPlayers}</td>
                                    <td>${t.entryFee?.toLocaleString()}</td>
                                    <td className="text-gold font-bold">${t.prizePool?.toLocaleString()}</td>
                                    <td>{getStatusBadge(t.status)}</td>
                                    <td className="text-muted">
                                        {new Date(t.startsAt).toLocaleDateString('es', {
                                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </td>
                                    <td>
                                        {t.status === 'REGISTRATION' && (
                                            <button
                                                className="btn btn-green"
                                                onClick={() => startMut.mutate(t.id)}
                                                disabled={startMut.isPending}
                                                style={{ fontSize: 12 }}
                                            >
                                                <Rocket size={14} /> Iniciar
                                            </button>
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
