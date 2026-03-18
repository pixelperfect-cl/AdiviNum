import { useState, useEffect } from 'react';
import { adminApi } from '../api';

export default function Tournaments() {
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    useEffect(() => {
        loadTournaments();
    }, []);

    const loadTournaments = async () => {
        try {
            const data = await adminApi.getTournaments();
            setTournaments(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await adminApi.createTournament({
                ...form,
                startsAt: new Date(form.startsAt).toISOString(),
                registrationDeadline: new Date(form.registrationDeadline).toISOString(),
            });
            setShowForm(false);
            loadTournaments();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStart = async (id: string) => {
        try {
            await adminApi.startTournament(id);
            loadTournaments();
        } catch (err: any) {
            alert(err.message);
        }
    };

    const getStatusBadge = (status: string) => {
        const map: Record<string, { cls: string; label: string }> = {
            REGISTRATION: { cls: 'badge-green', label: '🟢 Registro' },
            IN_PROGRESS: { cls: 'badge-orange', label: '🟡 En curso' },
            FINISHED: { cls: 'badge-purple', label: '⚫ Finalizado' },
        };
        const info = map[status] ?? { cls: '', label: status };
        return <span className={`badge ${info.cls}`}>{info.label}</span>;
    };

    if (loading) {
        return <div className="loading-spinner">⏳ Cargando torneos...</div>;
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1>Torneos</h1>
                    <p>Crear y gestionar torneos</p>
                </div>
                <button className="btn btn-gold" onClick={() => setShowForm(!showForm)}>
                    {showForm ? '✕ Cancelar' : '➕ Nuevo torneo'}
                </button>
            </div>

            {/* Create Form */}
            {showForm && (
                <div className="data-table-wrapper" style={{ padding: 24, marginBottom: 24 }}>
                    <h2 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>🏟️ Crear torneo</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                Nombre
                            </label>
                            <input
                                className="table-search"
                                style={{ width: '100%' }}
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                                placeholder="Copa AdiviNum #1"
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                Descripción
                            </label>
                            <input
                                className="table-search"
                                style={{ width: '100%' }}
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                placeholder="Torneo semanal..."
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                Formato
                            </label>
                            <select
                                className="table-search"
                                style={{ width: '100%' }}
                                value={form.format}
                                onChange={(e) => setForm({ ...form, format: e.target.value })}
                            >
                                <option value="SINGLE_ELIMINATION">Eliminación directa</option>
                                <option value="ROUND_ROBIN">Round Robin</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                Max jugadores
                            </label>
                            <select
                                className="table-search"
                                style={{ width: '100%' }}
                                value={form.maxPlayers}
                                onChange={(e) => setForm({ ...form, maxPlayers: Number(e.target.value) })}
                            >
                                <option value={8}>8</option>
                                <option value={16}>16</option>
                                <option value={32}>32</option>
                                <option value={64}>64</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                Cuota de entrada
                            </label>
                            <input
                                className="table-search"
                                style={{ width: '100%' }}
                                type="number"
                                value={form.entryFee}
                                onChange={(e) => setForm({ ...form, entryFee: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                Moneda
                            </label>
                            <select
                                className="table-search"
                                style={{ width: '100%' }}
                                value={form.currencyType}
                                onChange={(e) => setForm({ ...form, currencyType: e.target.value })}
                            >
                                <option value="VIRTUAL">Virtual (demo)</option>
                                <option value="FIAT">Fiat (real)</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                Nivel
                            </label>
                            <input
                                className="table-search"
                                style={{ width: '100%' }}
                                type="number"
                                min={1}
                                max={10}
                                value={form.level}
                                onChange={(e) => setForm({ ...form, level: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                Inicio del torneo
                            </label>
                            <input
                                className="table-search"
                                style={{ width: '100%' }}
                                type="datetime-local"
                                value={form.startsAt}
                                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                Cierre de registro
                            </label>
                            <input
                                className="table-search"
                                style={{ width: '100%' }}
                                type="datetime-local"
                                value={form.registrationDeadline}
                                onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })}
                            />
                        </div>
                    </div>
                    <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                        <button 
                            className="btn btn-gold" 
                            onClick={handleCreate}
                            disabled={isSubmitting}
                            style={{ opacity: isSubmitting ? 0.7 : 1, cursor: isSubmitting ? 'wait' : 'pointer' }}
                        >
                            {isSubmitting ? '⏳ Creando...' : '🏟️ Crear torneo'}
                        </button>
                        <button className="btn" onClick={() => setShowForm(false)}>
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Tournament List */}
            <div className="data-table-wrapper">
                <div className="table-header">
                    <h2>🏟️ Torneos ({tournaments.length})</h2>
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
                            tournaments.map((t) => (
                                <tr key={t.id}>
                                    <td>
                                        <div>
                                            <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{t.name}</div>
                                            {t.description && (
                                                <div className="text-muted" style={{ fontSize: 12 }}>{t.description}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td>{t.format === 'SINGLE_ELIMINATION' ? '🏆 Eliminación' : '🔄 Liga'}</td>
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
                                                onClick={() => handleStart(t.id)}
                                                style={{ fontSize: 12 }}
                                            >
                                                🚀 Iniciar
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
