import { useState } from 'react';
import { FileText, Code2, Timer, Monitor, Shield, ChevronDown, Sparkles, Tag, Bug, Clock } from 'lucide-react';

/* ─── TYPES ─── */
interface ChangelogRelease {
    version: string;
    date: string;
    sections: {
        type: 'new' | 'refactored' | 'fixed' | 'pending';
        title: string;
        icon: string;
        items: string[];
    }[];
}

/* ─── APP CHANGELOG ─── */
const APP_CHANGELOG: ChangelogRelease[] = [
    {
        version: '1.0.6-BETA',
        date: '2026-03-22',
        sections: [
            {
                type: 'new', title: 'Secret Timer Timeout', icon: '⏱️',
                items: [
                    'Timeout de número secreto — si no envías a tiempo, la partida se cancela automáticamente',
                    'Reembolso de apuestas — las apuestas se devuelven íntegramente al cancelar por timeout',
                    'Bloqueo de input a 0s — el input se bloquea al llegar el timer a 0',
                    'Pantalla de Game Over clara indicando la cancelación de la partida',
                ],
            },
            {
                type: 'fixed', title: 'Bug Fixes', icon: '🐛',
                items: [
                    'Compilación TS — corrección de errores de tipo NodeJS.Timeout y MessagePayload',
                    'Mejora en la desconexión de listeners de socket al salir de la partida',
                    'Fix en la reconexión del socket de chat',
                ],
            },
        ],
    },
    {
        version: '1.0.5-BETA',
        date: '2026-03-21',
        sections: [
            {
                type: 'new', title: 'Sistema de Rondas', icon: '🎮',
                items: [
                    'Rondas por partida — elige entre 1, 3 o 5 rondas al buscar match',
                    'Solo emparejas con jugadores de la misma cantidad de rondas',
                    'Indicador visual de ronda actual y marcador de serie',
                    'El primero en ganar la mayoría de rondas gana la partida',
                    'Apuesta configurada una vez para toda la serie',
                ],
            },
            {
                type: 'new', title: 'Social FAB', icon: '💬',
                items: [
                    'Botón flotante social — hub centralizado para amigos, chats y salas',
                    'Animación de apertura/cierre con overlay',
                    'Fix: botón de chat navega correctamente a la pestaña de chats',
                    'Fix: confirmación con menú overflow para evitar borrados accidentales de amigos',
                ],
            },
            {
                type: 'new', title: 'Torneos', icon: '🏆',
                items: [
                    'Pestaña de torneos añadida a la app móvil con listado, registro e info',
                    'Scheduler mejorado con gestión de estados refinada',
                    'Tipos compartidos para torneos en packages/shared',
                ],
            },
            {
                type: 'new', title: 'Historial & UI', icon: '📜',
                items: [
                    'Tarjetas de historial expandibles/colapsables para ver detalles',
                    'Empates añadidos al perfil para mejorar estadísticas',
                    'Tab Espectador en la app móvil',
                ],
            },
            {
                type: 'fixed', title: 'Timer & Fairness', icon: '⏱️',
                items: [
                    'Corrección de bugs en duración de timers y victoria/derrota',
                    'Mensajes claros de feedback cuando un jugador agota su tiempo',
                    'Mecánica "última oportunidad" para el jugador sin tiempo',
                    'Corrección en flujo de revancha y retos directos',
                ],
            },
            {
                type: 'fixed', title: 'Bug Fixes', icon: '🐛',
                items: [
                    'CORS configurado para aceptar requests desde el cliente web',
                    'Setup de la app web (apps/web) con Vite + React independiente del mobile',
                ],
            },
        ],
    },
    {
        version: '1.0.4-BETA',
        date: '2026-03-19',
        sections: [
            {
                type: 'new', title: 'Sistema de Niveles y XP', icon: '⭐',
                items: [
                    'Sistema de experiencia (XP) — gana puntos con cada partida',
                    'Victoria +30 XP, Empate +10 XP, Derrota +5 XP',
                    '10 niveles progresivos (0 a 500 XP acumulados)',
                    'Barra de progreso XP en Home y sidebar',
                    'Endpoint /users/me/level-info para datos de nivel',
                ],
            },
            {
                type: 'new', title: 'Logros con Recompensas', icon: '🏅',
                items: [
                    '10 logros que se desbloquean automáticamente al cumplir criterios',
                    'Recompensas en monedas virtuales (hasta 30.000 🪙)',
                    'Las monedas se acreditan directamente en tu billetera',
                    'Los logros muestran su recompensa en la pestaña de Logros',
                    'Tracking de logros post-partida con detección automática',
                ],
            },
            {
                type: 'new', title: 'Rediseño de Navegación', icon: '🧭',
                items: [
                    'Menú dropdown al hacer click en avatar con acceso rápido a todas las secciones del perfil',
                    'Sidebar con botones estilo tarjeta en desktop',
                    'Historial movido como 5ª pestaña del perfil (Perfil → Estadísticas → Historial → Billetera → Logros)',
                    'Deep-linking con ?tab= para navegar directo a secciones del perfil',
                    'Barra XP dorada animada en sidebar',
                ],
            },
        ],
    },
    {
        version: '1.0.3-BETA',
        date: '2026-03-19',
        sections: [
            {
                type: 'new', title: 'Deploy Automatizado', icon: '🚀',
                items: [
                    'Script de deploy (deploy.sh) — un solo comando para deployar todo en Cloudways',
                    'NVM integrado para usar Node 20+ en el servidor',
                    'Build automático: shared → web → admin → server',
                    'Health check post-deploy',
                ],
            },
            {
                type: 'new', title: 'UI / Layout', icon: '🎨',
                items: [
                    'Badge de versión premium en sidebar con "🎮 AdiviNum v1.0.3 BETA"',
                    'Niveles desktop — 10 columnas en una sola línea',
                    'Apuesta + Tiempo — Layout 2 columnas con opciones apiladas verticalmente',
                    'Google Login configurado con Supabase real',
                ],
            },
            {
                type: 'new', title: 'Auth', icon: '🔐',
                items: [
                    'Dev players habilitados en producción para testing',
                    'Guard refactorizado: Supabase token → dev-user header → 401',
                ],
            },
        ],
    },
    {
        version: '1.0.2-BETA',
        date: '2026-03-19',
        sections: [
            {
                type: 'new', title: 'Reconexión a Partida', icon: '🔄',
                items: [
                    'Reconexión automática si refrescas la página durante una partida (30s de gracia)',
                    'El servidor restaura todo el estado: matchId, rol, oponente, secreto, historial de intentos y tiempos',
                    'Navegación automática de vuelta a /game al reconectar',
                ],
            },
            {
                type: 'new', title: 'Auto-Timeout en Turno', icon: '⏰',
                items: [
                    'Timer de servidor proactivo — si se agota el tiempo, la partida termina automáticamente',
                    'Ya no se queda pegado en "esperando turno del rival" cuando al oponente se le acaba el tiempo',
                    'Timer se reinicia correctamente en cada turno',
                ],
            },
            {
                type: 'new', title: 'Selector de Tiempo', icon: '⏱️',
                items: [
                    'Nuevo selector: 3, 5 o 10 minutos por partida',
                    'Solo emparejas con jugadores que eligieron el mismo tiempo',
                    'Default: 5 minutos',
                ],
            },
            {
                type: 'new', title: 'NumPad Móvil', icon: '🎮',
                items: [
                    'Teclado numérico en pantalla — reemplaza el teclado del teléfono',
                    'Display visual de 4 dígitos con dígitos usados deshabilitados',
                    'Integrado en partidas PvP y Práctica',
                ],
            },
            {
                type: 'new', title: 'UI / Layout', icon: '🎨',
                items: [
                    'Layout de Práctica consistente con PvP (header, barras de energía)',
                    'Niveles en una sola fila en desktop',
                    'Play-layout al 100% de ancho en desktop',
                ],
            },
        ],
    },
    {
        version: '1.0.1-BETA',
        date: '2026-03-18',
        sections: [
            {
                type: 'new', title: 'Despliegue', icon: '🚀',
                items: [
                    'Backend desplegado en Cloudways vía PM2',
                    'Proxy PHP para API y Socket.io (long-polling)',
                    'Admin Panel accesible en /admin/',
                    'URLs de API corregidas para producción',
                ],
            },
            {
                type: 'new', title: 'Interfaz de Juego', icon: '🎮',
                items: [
                    'Nuevo timer de barra de energía (reemplaza circular)',
                    'Nombres de jugadores visibles sin recorte',
                    'Tu número secreto visible como referencia durante la partida',
                    'Scroll horizontal eliminado en pantallas pequeñas',
                ],
            },
            {
                type: 'new', title: 'Pantalla Jugar', icon: '⚔️',
                items: [
                    'Tabs rediseñados con iconos (⚔️ Matchmaking, 🏆 Torneos, 🤖 Práctica)',
                    'Colores dorados en vez de blanco para tabs activos',
                    'Mejor espaciado en móvil',
                    'Botón "¡Jugar!" removido del header en móvil',
                ],
            },
            {
                type: 'fixed', title: 'Correcciones', icon: '🐛',
                items: [
                    'Endpoint /users/me/history corregido a /users/me/matches',
                    'Socket.io usa long-polling en producción (bypass Nginx)',
                    'WebSocket fallback funcional para matchmaking',
                ],
            },
        ],
    },
    {
        version: '1.0.0-BETA',
        date: '2026-03-17',
        sections: [
            {
                type: 'new', title: 'Gameplay Core', icon: '🎮',
                items: [
                    'Juego 1v1 de deducción numérica — Famas & Toques',
                    'Sistema de 7 niveles con dígitos progresivos',
                    'Matchmaking por nivel y apuesta',
                    'Turnos alternados con timer circular',
                    'Sistema de revancha post-partida',
                    'Modo Espectador en vivo',
                    'Modo Práctica contra la CPU',
                    'Emojis/reacciones rápidas en partida',
                    'Revelación de número secreto post-partida',
                ],
            },
            {
                type: 'new', title: 'Sistema Competitivo', icon: '🏆',
                items: [
                    'Rankings ELO con 8 rangos',
                    'Ligas / Temporadas semanales con promoción y descenso',
                    'Sistema de logros y medallas',
                    'Torneos Single Elimination con bracket visual',
                    'Torneos automáticos programados (3 templates)',
                ],
            },
            {
                type: 'new', title: 'Social', icon: '👥',
                items: [
                    'Sistema de amigos — enviar/aceptar/rechazar/eliminar',
                    'Retos directos a amigos vía WebSocket',
                    'Perfil de jugador con estadísticas',
                    'Búsqueda de jugadores',
                ],
            },
            {
                type: 'new', title: 'Economía', icon: '💰',
                items: [
                    'Billetera virtual y real',
                    'Apuestas con comisión del 5%',
                    'Integración MercadoPago',
                    'Sistema de referidos con bonos',
                ],
            },
            {
                type: 'new', title: 'Notificaciones', icon: '🔔',
                items: [
                    'Push notifications (Expo)',
                    'Templates: partida, turnos, resultados, amigos, torneos, ligas',
                ],
            },
            {
                type: 'new', title: 'Seguridad', icon: '🛡️',
                items: [
                    'Autenticación Supabase (Google Sign-In)',
                    'Rate Limiting (60 req/min)',
                    'Validación estricta de inputs',
                    'Manejo offline con auto-reconnect',
                ],
            },
            {
                type: 'new', title: 'Historial & Onboarding', icon: '📊',
                items: [
                    'Historial detallado con timeline de intentos',
                    'Tutorial interactivo de 8 pasos',
                    'Skeleton loading animado',
                ],
            },
            {
                type: 'new', title: 'Internacionalización', icon: '🌐',
                items: [
                    'Español 🇪🇸 e Inglés 🇺🇸',
                    'Auto-detección del idioma',
                    '100+ claves traducidas',
                ],
            },
            {
                type: 'new', title: 'Plataformas', icon: '📱',
                items: [
                    'Web App (React + Vite)',
                    'Mobile App (React Native + Expo)',
                    'Admin Panel (Dashboard, Users, Matches, Tournaments)',
                ],
            },
        ],
    },
];

/* ─── ADMIN CHANGELOG ─── */
const ADMIN_CHANGELOG: ChangelogRelease[] = [
    {
        version: '1.0.0',
        date: '2026-03-22',
        sections: [
            {
                type: 'new', title: 'Features', icon: '✨',
                items: [
                    'Stack moderno: Tailwind CSS v4, React Query, Lucide Icons, React Hook Form, Zod',
                    'Gestión de Usuarios (Drawer): Abonar/debitar billeteras, fijar/resetear nivel, toggle VIP, ban/unban',
                    'Modo Espectador GOD: Vista en vivo de partidas vía WebSocket, tableros duales, GOD Chat admin',
                    'Logros: CRUD completo (crear, editar, eliminar logros con recompensas)',
                    'Configuración Global: Saldo virtual inicial configurable',
                    'Gestión de Retiros: Aprobar o rechazar solicitudes con reembolso automático',
                    'Admin Changelog: Página dedicada para registrar cambios del panel',
                ],
            },
            {
                type: 'refactored', title: 'Refactorizado', icon: '♻️',
                items: [
                    'Todas las páginas migradas a React Query (caching, loading, invalidación automática)',
                    'Emojis reemplazados por Lucide React icons',
                    'api.ts extendido con todos los endpoints',
                    'Tournaments.tsx y Withdrawals.tsx con mutaciones React Query',
                ],
            },
            {
                type: 'fixed', title: 'Correcciones', icon: '🐛',
                items: [
                    'Proxy Vite apuntaba al puerto 5555 en vez de 3000 (backend)',
                    'Path rewrite eliminado — NestJS usa prefijo /api global',
                ],
            },
            {
                type: 'pending', title: 'Pendiente', icon: '📋',
                items: [
                    'Más configuraciones globales (XP por nivel, comisiones, etc.)',
                ],
            },
        ],
    },
];

/* ─── SECTION TYPE CONFIG ─── */
const SECTION_CONFIG: Record<string, { color: string; bg: string; icon: any; label: string }> = {
    new:         { color: '#10B981', bg: 'rgba(16,185,129,0.08)',  icon: Sparkles, label: 'Nuevo' },
    refactored:  { color: '#3B82F6', bg: 'rgba(59,130,246,0.08)', icon: Tag,      label: 'Refactorizado' },
    fixed:       { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', icon: Bug,      label: 'Corregido' },
    pending:     { color: '#8B5CF6', bg: 'rgba(139,92,246,0.08)', icon: Clock,    label: 'Pendiente' },
};

type Tab = 'admin' | 'app';

/* ─── PAGE ─── */
export default function Changelog() {
    const [activeTab, setActiveTab] = useState<Tab>('admin');
    const data = activeTab === 'admin' ? ADMIN_CHANGELOG : APP_CHANGELOG;

    return (
        <div>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
                <h1 style={{
                    fontSize: 32,
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, var(--color-gold), #ffaa00)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: 6,
                }}>
                    📝 Changelog
                </h1>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                    Historial completo de todas las versiones del proyecto AdiviNum
                </p>
            </div>

            {/* Stats Badges */}
            <div style={{
                display: 'flex',
                gap: 12,
                justifyContent: 'center',
                marginBottom: 28,
                flexWrap: 'wrap',
            }}>
                <StatBadge emoji="💻" value="~21,000" label="Líneas de código" />
                <StatBadge emoji="⏱️" value="~510h" label="Desarrollo estimado" />
                <StatBadge emoji="📱" value="4" label="Plataformas" />
                <StatBadge emoji="🚀" value={`${APP_CHANGELOG.length + ADMIN_CHANGELOG.length}`} label="Releases" />
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 28,
            }}>
                <TabPill
                    active={activeTab === 'admin'}
                    onClick={() => setActiveTab('admin')}
                    label="🛡️ Admin Panel"
                    count={ADMIN_CHANGELOG.length}
                    accentColor="var(--color-blue)"
                />
                <TabPill
                    active={activeTab === 'app'}
                    onClick={() => setActiveTab('app')}
                    label="🎮 AdiviNum App"
                    count={APP_CHANGELOG.length}
                    accentColor="var(--color-gold)"
                />
            </div>

            {/* Releases */}
            <div style={{ maxWidth: 780, margin: '0 auto' }}>
                {data.map((release) => (
                    <ReleaseCard key={`${activeTab}-${release.version}`} release={release} />
                ))}
            </div>
        </div>
    );
}

/* ─── STAT BADGE ─── */
function StatBadge({ emoji, value, label }: { emoji: string; value: string; label: string }) {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 20px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(234,179,8,0.1), rgba(234,179,8,0.02))',
            border: '1px solid rgba(234,179,8,0.18)',
        }}>
            <span style={{ fontSize: 22 }}>{emoji}</span>
            <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-gold)' }}>{value}</div>
                <div style={{
                    fontSize: 10,
                    color: 'var(--color-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: 600,
                }}>{label}</div>
            </div>
        </div>
    );
}

/* ─── TAB PILL ─── */
function TabPill({ active, onClick, label, count, accentColor }: {
    active: boolean; onClick: () => void; label: string; count: number; accentColor: string;
}) {
    return (
        <button
            onClick={onClick}
            style={{
                padding: '12px 24px',
                borderRadius: 12,
                border: `1px solid ${active ? accentColor : 'var(--color-border)'}`,
                background: active
                    ? `linear-gradient(135deg, ${accentColor}22, ${accentColor}08)`
                    : 'var(--color-bg-surface)',
                color: active ? accentColor : 'var(--color-text-muted)',
                fontWeight: active ? 700 : 500,
                fontSize: 14,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
            }}
        >
            {label}
            <span style={{
                fontSize: 11,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 8,
                background: active ? accentColor : 'rgba(255,255,255,0.06)',
                color: active ? '#000' : 'var(--color-text-muted)',
                transition: 'all 0.2s ease',
            }}>{count}</span>
        </button>
    );
}

/* ─── RELEASE CARD ─── */
function ReleaseCard({ release }: { release: ChangelogRelease }) {
    return (
        <div style={{ marginBottom: 28 }}>
            {/* Version header */}
            <div style={{
                marginBottom: 12,
                padding: '16px 22px',
                borderRadius: 14,
                background: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <span style={{
                    fontSize: 22,
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, var(--color-gold), #ffaa00)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>
                    v{release.version}
                </span>
                <span style={{
                    fontSize: 13,
                    color: 'var(--color-text-muted)',
                    fontFamily: "'JetBrains Mono', monospace",
                }}>
                    {release.date}
                </span>
            </div>

            {/* Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {release.sections.map((section, idx) => (
                    <SectionCard key={`${section.type}-${idx}`} section={section} />
                ))}
            </div>
        </div>
    );
}

/* ─── SECTION CARD ─── */
function SectionCard({ section }: { section: ChangelogRelease['sections'][0] }) {
    const [expanded, setExpanded] = useState(true);
    const cfg = SECTION_CONFIG[section.type];

    return (
        <div style={{
            padding: '14px 18px',
            borderRadius: 12,
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            transition: 'border-color 0.2s',
        }}>
            {/* Section Header */}
            <div
                onClick={() => setExpanded(!expanded)}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>{section.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--color-text-primary)' }}>
                        {section.title}
                    </span>
                    <span style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: cfg.bg,
                        color: cfg.color,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                    }}>
                        {cfg.label}
                    </span>
                </div>
                <ChevronDown
                    size={16}
                    style={{
                        color: 'var(--color-text-muted)',
                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.25s ease',
                    }}
                />
            </div>

            {/* Items */}
            {expanded && (
                <div style={{ marginTop: 12, paddingLeft: 4 }}>
                    {section.items.map((item, i) => (
                        <div key={i} style={{
                            fontSize: 13,
                            color: 'var(--color-text-secondary)',
                            lineHeight: 1.7,
                            paddingLeft: 16,
                            position: 'relative',
                        }}>
                            <span style={{
                                position: 'absolute',
                                left: 0,
                                top: 2,
                                color: cfg.color,
                                fontWeight: 800,
                                fontSize: 14,
                            }}>•</span>
                            {item}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
