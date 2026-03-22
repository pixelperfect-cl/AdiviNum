import { useState } from 'react';
import { FileText, Tag, Sparkles, Bug, AlertCircle, Clock, Code2, Timer, Monitor, Shield } from 'lucide-react';

/* ─── APP CHANGELOG ─── */
const APP_CHANGELOG = [
    {
        version: '1.0.6-BETA',
        date: '2026-03-22',
        sections: [
            {
                type: 'new' as const,
                items: [
                    'Timeout de número secreto — si un jugador no envía a tiempo, la partida se cancela automáticamente.',
                    'Reembolso de apuestas al cancelar por timeout del secreto.',
                    'Bloqueo de input a 0s para evitar envíos tardíos.',
                    'Pantalla de Game Over clara indicando la cancelación.',
                ],
            },
            {
                type: 'fixed' as const,
                items: [
                    'Compilación TS — errores de tipo NodeJS.Timeout y MessagePayload corregidos.',
                    'Mejora en la desconexión de listeners de socket al salir de la partida.',
                    'Fix en la reconexión del socket de chat.',
                ],
            },
        ],
    },
    {
        version: '1.0.5-BETA',
        date: '2026-03-21',
        sections: [
            {
                type: 'new' as const,
                items: [
                    'Sistema de Rondas — elige entre 1, 3 o 5 rondas al buscar match.',
                    'Social FAB — botón flotante con hub centralizado para amigos, chats y salas.',
                    'Tab Espectador en la app móvil.',
                    'Torneos en mobile — pestaña con listado, registro e info.',
                    'Historial expandible — tarjetas que se expanden/colapsan para ver detalles.',
                    'Empates añadidos al perfil para estadísticas completas.',
                ],
            },
            {
                type: 'fixed' as const,
                items: [
                    'Corrección de bugs en timers y victoria/derrota.',
                    'Mecánica "última oportunidad" cuando se agota el tiempo.',
                    'CORS configurado para requests desde el cliente web.',
                    'Setup de la app web (apps/web) con Vite + React independiente del mobile.',
                    'Fix: Social FAB chat y menú overflow de amigos.',
                ],
            },
        ],
    },
    {
        version: '1.0.4-BETA',
        date: '2026-03-19',
        sections: [
            {
                type: 'new' as const,
                items: [
                    'Sistema de XP — experiencia por partidas jugadas con leveling progresivo.',
                    'Recompensas por logros — medallas otorgan bonos de monedas y XP.',
                    'Rediseño de navegación — sidebar y layout mejorados.',
                ],
            },
            {
                type: 'fixed' as const,
                items: [
                    'Null safety completo en userStore y todas las páginas.',
                    'Fix JSON parse en respuestas del servidor.',
                    'Fix deploy.sh — ruta correcta de Prisma schema.',
                ],
            },
        ],
    },
    {
        version: '1.0.3-BETA',
        date: '2026-03-19',
        sections: [
            {
                type: 'new' as const,
                items: [
                    'Script de deploy (deploy.sh) — un solo comando para deployar todo en Cloudways.',
                    'Badge de versión premium en sidebar.',
                    'Apuesta + Tiempo — layout 2 columnas en desktop.',
                ],
            },
            {
                type: 'fixed' as const,
                items: [
                    'Google Login configurado con Supabase real.',
                    'Guard refactorizado: Supabase token → dev-user header → 401.',
                ],
            },
        ],
    },
    {
        version: '1.0.2-BETA',
        date: '2026-03-19',
        sections: [
            {
                type: 'new' as const,
                items: [
                    'Reconexión automática a partida en progreso (30s de gracia).',
                    'Auto-timeout en turno — el servidor termina la partida si se agota el tiempo.',
                    'Selector de tiempo: 3, 5 o 10 minutos.',
                    'NumPad móvil — teclado numérico en pantalla.',
                ],
            },
        ],
    },
    {
        version: '1.0.1-BETA',
        date: '2026-03-18',
        sections: [
            {
                type: 'new' as const,
                items: [
                    'Backend desplegado en Cloudways vía PM2.',
                    'Timer de barra de energía (reemplaza circular).',
                    'Tabs rediseñados con iconos dorados.',
                ],
            },
            {
                type: 'fixed' as const,
                items: [
                    'Endpoint /users/me/history corregido a /users/me/matches.',
                    'Socket.io usa long-polling en producción.',
                ],
            },
        ],
    },
    {
        version: '1.0.0-BETA',
        date: '2026-03-17',
        sections: [
            {
                type: 'new' as const,
                items: [
                    'Juego 1v1 de deducción numérica — Famas & Toques.',
                    'Sistema de 7 niveles, matchmaking, turnos alternados con timer.',
                    'Rankings ELO, Ligas semanales, Torneos Single Elimination.',
                    'Sistema de amigos, retos directos, perfil de jugador.',
                    'Billetera virtual/real, apuestas con comisión, MercadoPago.',
                    'Push notifications vía Expo, i18n (ES/EN).',
                    'Tutorial onboarding de 8 pasos.',
                ],
            },
        ],
    },
];

/* ─── ADMIN CHANGELOG ─── */
const ADMIN_CHANGELOG = [
    {
        version: '1.0.0',
        date: '2026-03-22',
        sections: [
            {
                type: 'new' as const,
                items: [
                    'Stack moderno: Tailwind CSS v4, React Query, Lucide Icons, React Hook Form, Zod.',
                    'Gestión de Usuarios (Drawer): Abonar/debitar billeteras, fijar/resetear nivel, toggle VIP, ban/unban.',
                    'Modo Espectador GOD: Vista en vivo de partidas vía WebSocket, tableros duales, GOD Chat admin.',
                    'Logros: CRUD completo (crear, editar, eliminar logros con recompensas).',
                    'Configuración Global: Saldo virtual inicial configurable (se aplica al registrar usuarios).',
                    'Gestión de Retiros: Aprobar o rechazar solicitudes con reembolso automático.',
                    'Admin Changelog: Página dedicada para registrar cambios del panel.',
                ],
            },
            {
                type: 'refactored' as const,
                items: [
                    'Todas las páginas migradas a React Query (caching, loading, invalidación automática).',
                    'Emojis reemplazados por Lucide React icons.',
                    'api.ts extendido con todos los endpoints (wallet, level, config, achievements, settings, withdrawals).',
                    'Tournaments.tsx y Withdrawals.tsx refactorizados con mutaciones React Query.',
                ],
            },
            {
                type: 'fixed' as const,
                items: [
                    'Proxy Vite apuntaba al puerto 5555 (web app) en vez de 3000 (backend).',
                    'Path rewrite eliminado — NestJS usa prefijo /api global.',
                ],
            },
            {
                type: 'pending' as const,
                items: [
                    'Más configuraciones globales (XP por nivel, comisiones, etc.).',
                ],
            },
        ],
    },
];

/* ─── STYLES ─── */
const SECTION_STYLES: Record<string, { icon: any; label: string; color: string; bg: string }> = {
    new: { icon: Sparkles, label: 'Nuevo', color: 'var(--color-green)', bg: 'rgba(34, 197, 94, 0.1)' },
    refactored: { icon: Tag, label: 'Refactorizado', color: 'var(--color-blue)', bg: 'rgba(59, 130, 246, 0.1)' },
    fixed: { icon: Bug, label: 'Corregido', color: 'var(--color-orange)', bg: 'rgba(249, 115, 22, 0.1)' },
    pending: { icon: Clock, label: 'Pendiente', color: 'var(--color-purple)', bg: 'rgba(168, 85, 247, 0.1)' },
};

type Tab = 'admin' | 'app';

export default function Changelog() {
    const [activeTab, setActiveTab] = useState<Tab>('admin');
    const data = activeTab === 'admin' ? ADMIN_CHANGELOG : APP_CHANGELOG;

    return (
        <div>
            <div className="page-header">
                <h1 className="flex items-center gap-3"><FileText size={28} /> Changelog</h1>
                <p>Historial completo de cambios del proyecto AdiviNum</p>
            </div>

            {/* Stats Badges */}
            <div className="flex items-center gap-4 mb-6" style={{ flexWrap: 'wrap' }}>
                <StatBadge icon={<Code2 size={18} />} value="~21,000" label="Líneas de código" color="var(--color-gold)" />
                <StatBadge icon={<Timer size={18} />} value="~510h" label="Desarrollo estimado" color="var(--color-blue)" />
                <StatBadge icon={<Monitor size={18} />} value="4" label="Plataformas" color="var(--color-green)" />
                <StatBadge icon={<Shield size={18} />} value={`${APP_CHANGELOG.length + ADMIN_CHANGELOG.length}`} label="Releases totales" color="var(--color-purple)" />
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6">
                <TabButton active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} label="🛡️ Admin Panel" count={ADMIN_CHANGELOG.length} />
                <TabButton active={activeTab === 'app'} onClick={() => setActiveTab('app')} label="🎮 AdiviNum App" count={APP_CHANGELOG.length} />
            </div>

            {/* Release List */}
            {data.map((release) => (
                <ReleaseCard key={`${activeTab}-${release.version}`} release={release} />
            ))}
        </div>
    );
}

/* ─── SUB COMPONENTS ─── */

function StatBadge({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
    return (
        <div
            className="data-table-wrapper flex items-center gap-3"
            style={{
                padding: '12px 20px',
                border: `1px solid ${color}33`,
                background: `linear-gradient(135deg, ${color}12, transparent)`,
            }}
        >
            <div style={{ color }}>{icon}</div>
            <div>
                <div style={{ fontWeight: 800, fontSize: 18, color }}>{value}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            </div>
        </div>
    );
}

function TabButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-sm)',
                border: `1px solid ${active ? 'var(--color-gold)' : 'rgba(255,255,255,0.08)'}`,
                background: active
                    ? 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.05))'
                    : 'rgba(255,255,255,0.02)',
                color: active ? 'var(--color-gold)' : 'var(--color-text-muted)',
                fontWeight: active ? 700 : 500,
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
            }}
        >
            {label}
            <span style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 6,
                background: active ? 'var(--color-gold)' : 'rgba(255,255,255,0.06)',
                color: active ? '#000' : 'var(--color-text-muted)',
            }}>{count}</span>
        </button>
    );
}

function ReleaseCard({ release }: { release: typeof ADMIN_CHANGELOG[0] }) {
    return (
        <div className="data-table-wrapper" style={{ padding: 24, marginBottom: 24 }}>
            {/* Version Header */}
            <div className="flex items-center gap-3 mb-6">
                <span
                    style={{
                        background: 'var(--color-gold)',
                        color: 'var(--color-bg-primary)',
                        fontWeight: 800,
                        fontSize: 14,
                        padding: '4px 12px',
                        borderRadius: 'var(--radius-sm)',
                    }}
                >
                    v{release.version}
                </span>
                <span className="text-muted" style={{ fontSize: 14 }}>
                    {new Date(release.date).toLocaleDateString('es', {
                        day: '2-digit', month: 'long', year: 'numeric',
                    })}
                </span>
            </div>

            {/* Sections */}
            {release.sections.map((section) => {
                const style = SECTION_STYLES[section.type];
                if (!style) return null;
                const Icon = style.icon;
                return (
                    <div key={section.type} style={{ marginBottom: 20 }}>
                        <div
                            className="flex items-center gap-2 font-bold mb-2"
                            style={{ color: style.color, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                        >
                            <Icon size={16} />
                            {style.label}
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {section.items.map((item, i) => (
                                <li
                                    key={i}
                                    style={{
                                        padding: '8px 12px',
                                        background: style.bg,
                                        borderRadius: 'var(--radius-sm)',
                                        borderLeft: `3px solid ${style.color}`,
                                        fontSize: 13,
                                        color: 'var(--color-text-primary)',
                                    }}
                                >
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}
        </div>
    );
}
