import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api';
import { Settings as SettingsIcon, Save, Coins } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Setting {
    key: string;
    value: string;
    description?: string;
}

const SETTING_LABELS: Record<string, { label: string; description: string; icon: any }> = {
    INITIAL_VIRTUAL_BALANCE: {
        label: 'Saldo Virtual Inicial',
        description: 'Monedas virtuales que recibe un usuario al registrarse.',
        icon: Coins,
    },
};

export default function SettingsPage() {
    const queryClient = useQueryClient();
    const [localValues, setLocalValues] = useState<Record<string, string>>({});

    const { data: settings = [], isLoading } = useQuery({
        queryKey: ['settings'],
        queryFn: adminApi.getSettings,
    });

    useEffect(() => {
        if (settings.length > 0) {
            const map: Record<string, string> = {};
            settings.forEach((s: Setting) => { map[s.key] = s.value; });
            setLocalValues(map);
        }
    }, [settings]);

    const updateMut = useMutation({
        mutationFn: ({ key, value }: { key: string; value: string }) => adminApi.updateSetting(key, value),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
    });

    const handleSave = (key: string) => {
        updateMut.mutate({ key, value: localValues[key] });
    };

    if (isLoading) {
        return <div className="loading-spinner">Cargando configuración...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="flex items-center gap-3">
                    <SettingsIcon size={28} /> Configuración
                </h1>
                <p>Parámetros globales del juego</p>
            </div>

            <div className="data-table-wrapper" style={{ padding: 24 }}>
                <h2 className="flex items-center gap-2 mb-6" style={{ fontSize: 16, fontWeight: 700 }}>
                    <Coins size={18} /> Economía del Juego
                </h2>

                {settings.length === 0 ? (
                    <div className="text-muted" style={{ textAlign: 'center', padding: 40 }}>
                        No hay configuraciones disponibles. Los endpoints del backend aún no están implementados.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {settings.map((s: Setting) => {
                            const meta = SETTING_LABELS[s.key];
                            const Icon = meta?.icon || SettingsIcon;
                            return (
                                <div
                                    key={s.key}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 16,
                                        padding: 16,
                                        background: 'var(--color-bg-surface)',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--color-border)',
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div className="flex items-center gap-2 font-bold" style={{ color: 'var(--color-text-primary)', marginBottom: 4 }}>
                                            <Icon size={16} />
                                            {meta?.label || s.key}
                                        </div>
                                        <div className="text-muted" style={{ fontSize: 12 }}>
                                            {meta?.description || s.description || s.key}
                                        </div>
                                    </div>
                                    <input
                                        className="table-search"
                                        style={{ width: 140, textAlign: 'right', fontWeight: 700, fontSize: 16 }}
                                        value={localValues[s.key] ?? s.value}
                                        onChange={(e) => setLocalValues({ ...localValues, [s.key]: e.target.value })}
                                    />
                                    <button
                                        className="btn btn-gold"
                                        onClick={() => handleSave(s.key)}
                                        disabled={updateMut.isPending}
                                        style={{ minWidth: 100 }}
                                    >
                                        <Save size={14} /> Guardar
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
