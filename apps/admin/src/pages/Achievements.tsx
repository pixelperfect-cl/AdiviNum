import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api';
import { Plus, Pencil, Trash2, Award, Gift } from 'lucide-react';

export default function Achievements() {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ key: '', name: '', description: '', reward: 0 });

    const { data: achievements = [], isLoading } = useQuery({
        queryKey: ['achievements'],
        queryFn: adminApi.getAchievements,
    });

    const createMut = useMutation({
        mutationFn: adminApi.createAchievement,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['achievements'] });
            resetForm();
        },
    });

    const updateMut = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.updateAchievement(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['achievements'] });
            resetForm();
        },
    });

    const deleteMut = useMutation({
        mutationFn: adminApi.deleteAchievement,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['achievements'] }),
    });

    const resetForm = () => {
        setForm({ key: '', name: '', description: '', reward: 0 });
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = () => {
        if (editingId) {
            updateMut.mutate({ id: editingId, data: form });
        } else {
            createMut.mutate(form);
        }
    };

    const handleEdit = (a: any) => {
        setForm({ key: a.key, name: a.name, description: a.description, reward: a.reward });
        setEditingId(a.id);
        setShowForm(true);
    };

    if (isLoading) {
        return <div className="loading-spinner">Cargando logros...</div>;
    }

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="flex items-center gap-3">
                        <Award size={28} /> Logros
                    </h1>
                    <p>{achievements.length} logros configurados</p>
                </div>
                <button className="btn btn-gold" onClick={() => { resetForm(); setShowForm(!showForm); }}>
                    {showForm ? '✕ Cancelar' : <><Plus size={16} /> Nuevo logro</>}
                </button>
            </div>

            {/* Create / Edit Form */}
            {showForm && (
                <div className="data-table-wrapper" style={{ padding: 24, marginBottom: 24 }}>
                    <h2 style={{ marginBottom: 16, fontSize: 16, fontWeight: 700 }}>
                        {editingId ? '✏️ Editar logro' : '🏅 Crear logro'}
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label className="text-xs text-text-muted font-semibold block mb-1">Clave única</label>
                            <input
                                className="table-search w-full"
                                placeholder="win_10_games"
                                value={form.key}
                                onChange={(e) => setForm({ ...form, key: e.target.value })}
                                disabled={!!editingId}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-text-muted font-semibold block mb-1">Nombre</label>
                            <input
                                className="table-search w-full"
                                placeholder="Ganador Serial"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-text-muted font-semibold block mb-1">Descripción</label>
                            <input
                                className="table-search w-full"
                                placeholder="Gana 10 partidas consecutivas"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-xs text-text-muted font-semibold block mb-1">Recompensa (monedas)</label>
                            <input
                                className="table-search w-full"
                                type="number"
                                min={0}
                                value={form.reward}
                                onChange={(e) => setForm({ ...form, reward: Number(e.target.value) })}
                            />
                        </div>
                    </div>
                    <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                        <button className="btn btn-gold" onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}>
                            {(createMut.isPending || updateMut.isPending)
                                ? '⏳ Guardando...'
                                : editingId
                                    ? '💾 Guardar cambios'
                                    : '🏅 Crear logro'}
                        </button>
                        <button className="btn" onClick={resetForm}>Cancelar</button>
                    </div>
                </div>
            )}

            {/* Achievements Table */}
            <div className="data-table-wrapper">
                <div className="table-header">
                    <h2 className="flex items-center gap-2"><Award size={18} /> Logros ({achievements.length})</h2>
                </div>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Clave</th>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Recompensa</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {achievements.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-muted" style={{ textAlign: 'center', padding: '40px' }}>
                                    No hay logros configurados
                                </td>
                            </tr>
                        ) : (
                            achievements.map((a: any) => (
                                <tr key={a.id}>
                                    <td className="font-mono text-muted" style={{ fontSize: 12 }}>{a.key}</td>
                                    <td className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{a.name}</td>
                                    <td>{a.description}</td>
                                    <td className="text-gold font-bold">
                                        <Gift size={14} className="inline mr-1" />{a.reward}
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="btn" style={{ fontSize: 12 }} onClick={() => handleEdit(a)}>
                                                <Pencil size={14} /> Editar
                                            </button>
                                            <button
                                                className="btn btn-red"
                                                style={{ fontSize: 12 }}
                                                onClick={() => { if (confirm('¿Eliminar este logro?')) deleteMut.mutate(a.id); }}
                                            >
                                                <Trash2 size={14} /> Borrar
                                            </button>
                                        </div>
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
