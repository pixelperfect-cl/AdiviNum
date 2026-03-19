import { useState } from 'react';

interface ChangelogEntry {
    version: string;
    date: string;
    sections: {
        title: string;
        icon: string;
        items: string[];
    }[];
}

const CHANGELOG: ChangelogEntry[] = [
    {
        version: '1.0.4-BETA',
        date: '2026-03-19',
        sections: [
            {
                title: 'Sistema de Niveles y XP',
                icon: '⭐',
                items: [
                    'Sistema de experiencia (XP) — gana puntos con cada partida',
                    'Victoria +30 XP, Empate +10 XP, Derrota +5 XP',
                    '10 niveles progresivos (0 a 500 XP acumulados)',
                    'Barra de progreso XP en Home y sidebar',
                    'Endpoint /users/me/level-info para datos de nivel',
                ],
            },
            {
                title: 'Logros con Recompensas',
                icon: '🏅',
                items: [
                    '10 logros que se desbloquean automáticamente al cumplir criterios',
                    'Recompensas en monedas virtuales (hasta 30.000 🪙)',
                    'Las monedas se acreditan directamente en tu billetera',
                    'Los logros muestran su recompensa en la pestaña de Logros',
                    'Tracking de logros post-partida con detección automática',
                ],
            },
            {
                title: 'Rediseño de Navegación',
                icon: '🧭',
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
                title: 'Deploy Automatizado',
                icon: '🚀',
                items: [
                    'Script de deploy (deploy.sh) — un solo comando para deployar todo en Cloudways',
                    'NVM integrado para usar Node 20+ en el servidor',
                    'Build automático: shared → web → admin → server',
                    'Health check post-deploy',
                ],
            },
            {
                title: 'UI / Layout',
                icon: '🎨',
                items: [
                    'Badge de versión premium en sidebar con "🎮 AdiviNum v1.0.3 BETA"',
                    'Niveles desktop — 10 columnas en una sola línea',
                    'Apuesta + Tiempo — Layout 2 columnas con opciones apiladas verticalmente',
                    'Google Login configurado con Supabase real',
                ],
            },
            {
                title: 'Auth',
                icon: '🔐',
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
                title: 'Reconexión a Partida',
                icon: '🔄',
                items: [
                    'Reconexión automática si refrescas la página durante una partida (30s de gracia)',
                    'El servidor restaura todo el estado: matchId, rol, oponente, secreto, historial de intentos y tiempos',
                    'Navegación automática de vuelta a /game al reconectar',
                ],
            },
            {
                title: 'Auto-Timeout en Turno',
                icon: '⏰',
                items: [
                    'Timer de servidor proactivo — si se agota el tiempo, la partida termina automáticamente',
                    'Ya no se queda pegado en "esperando turno del rival" cuando al oponente se le acaba el tiempo',
                    'Timer se reinicia correctamente en cada turno',
                ],
            },
            {
                title: 'Selector de Tiempo',
                icon: '⏱️',
                items: [
                    'Nuevo selector: 3, 5 o 10 minutos por partida',
                    'Solo emparejas con jugadores que eligieron el mismo tiempo',
                    'Default: 5 minutos',
                ],
            },
            {
                title: 'NumPad Móvil',
                icon: '🎮',
                items: [
                    'Teclado numérico en pantalla — reemplaza el teclado del teléfono',
                    'Display visual de 4 dígitos con dígitos usados deshabilitados',
                    'Integrado en partidas PvP y Práctica',
                ],
            },
            {
                title: 'UI / Layout',
                icon: '🎨',
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
                title: 'Despliegue',
                icon: '🚀',
                items: [
                    'Backend desplegado en Cloudways vía PM2',
                    'Proxy PHP para API y Socket.io (long-polling)',
                    'Admin Panel accesible en /admin/',
                    'URLs de API corregidas para producción',
                ],
            },
            {
                title: 'Interfaz de Juego',
                icon: '🎮',
                items: [
                    'Nuevo timer de barra de energía (reemplaza circular)',
                    'Nombres de jugadores visibles sin recorte',
                    'Tu número secreto visible como referencia durante la partida',
                    'Scroll horizontal eliminado en pantallas pequeñas',
                ],
            },
            {
                title: 'Pantalla Jugar',
                icon: '⚔️',
                items: [
                    'Tabs rediseñados con iconos (⚔️ Matchmaking, 🏆 Torneos, 🤖 Práctica)',
                    'Colores dorados en vez de blanco para tabs activos',
                    'Mejor espaciado en móvil',
                    'Botón "¡Jugar!" removido del header en móvil',
                ],
            },
            {
                title: 'Correcciones',
                icon: '🐛',
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
                title: 'Gameplay Core',
                icon: '🎮',
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
                title: 'Sistema Competitivo',
                icon: '🏆',
                items: [
                    'Rankings ELO con 8 rangos',
                    'Ligas / Temporadas semanales con promoción y descenso',
                    'Sistema de logros y medallas',
                    'Torneos Single Elimination con bracket visual',
                    'Torneos automáticos programados (3 templates)',
                ],
            },
            {
                title: 'Social',
                icon: '👥',
                items: [
                    'Sistema de amigos — enviar/aceptar/rechazar/eliminar',
                    'Retos directos a amigos vía WebSocket',
                    'Perfil de jugador con estadísticas',
                    'Búsqueda de jugadores',
                ],
            },
            {
                title: 'Economía',
                icon: '💰',
                items: [
                    'Billetera virtual y real',
                    'Apuestas con comisión del 5%',
                    'Integración MercadoPago',
                    'Sistema de referidos con bonos',
                ],
            },
            {
                title: 'Notificaciones',
                icon: '🔔',
                items: [
                    'Push notifications (Expo)',
                    'Templates: partida, turnos, resultados, amigos, torneos, ligas',
                ],
            },
            {
                title: 'Seguridad',
                icon: '🛡️',
                items: [
                    'Autenticación Supabase (Google Sign-In)',
                    'Rate Limiting (60 req/min)',
                    'Validación estricta de inputs',
                    'Manejo offline con auto-reconnect',
                ],
            },
            {
                title: 'Historial & Onboarding',
                icon: '📊',
                items: [
                    'Historial detallado con timeline de intentos',
                    'Tutorial interactivo de 8 pasos',
                    'Skeleton loading animado',
                ],
            },
            {
                title: 'Internacionalización',
                icon: '🌐',
                items: [
                    'Español 🇪🇸 e Inglés 🇺🇸',
                    'Auto-detección del idioma',
                    '100+ claves traducidas',
                ],
            },
            {
                title: 'Plataformas',
                icon: '📱',
                items: [
                    'Web App (React + Vite)',
                    'Mobile App (React Native + Expo)',
                    'Admin Panel (Dashboard, Users, Matches, Tournaments)',
                ],
            },
        ],
    },
];

export function ChangelogPage() {
    return (
        <div className="fade-in">
            <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '8px' }}>
                📝 Changelog
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '24px' }}>
                Notas de versión y actualizaciones
            </p>

            {/* Stats badges */}
            <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.12), rgba(234, 179, 8, 0.03))',
                    border: '1px solid rgba(234, 179, 8, 0.2)',
                }}>
                    <span style={{ fontSize: '1.2rem' }}>💻</span>
                    <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold)' }}>~18,500</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Líneas de código</div>
                    </div>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.12), rgba(234, 179, 8, 0.03))',
                    border: '1px solid rgba(234, 179, 8, 0.2)',
                }}>
                    <span style={{ fontSize: '1.2rem' }}>⏱️</span>
                    <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--gold)' }}>~480h</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Desarrollo estimado</div>
                    </div>
                </div>
            </div>

            {CHANGELOG.map((entry) => (
                <ChangelogEntryCard key={entry.version} entry={entry} />
            ))}
        </div>
    );
}

function ChangelogEntryCard({ entry }: { entry: ChangelogEntry }) {
    return (
        <div style={{ marginBottom: '24px' }}>
            {/* Version header */}
            <div className="card" style={{ marginBottom: '12px', padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <span style={{
                            fontSize: '1.3rem',
                            fontWeight: 800,
                            background: 'linear-gradient(135deg, var(--gold), #ffaa00)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>
                            v{entry.version}
                        </span>
                    </div>
                    <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-muted)',
                        fontFamily: "'Fira Mono', monospace",
                    }}>
                        {entry.date}
                    </span>
                </div>
            </div>

            {/* Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {entry.sections.map((section) => (
                    <SectionCard key={section.title} section={section} />
                ))}
            </div>
        </div>
    );
}

function SectionCard({ section }: { section: ChangelogEntry['sections'][0] }) {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className="card" style={{ padding: '12px 16px' }}>
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
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {section.icon} {section.title}
                </span>
                <span style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s',
                    display: 'inline-block',
                }}>
                    ▾
                </span>
            </div>

            {expanded && (
                <div style={{ marginTop: '10px', paddingLeft: '4px' }}>
                    {section.items.map((item, i) => (
                        <div key={i} style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.6,
                            paddingLeft: '12px',
                            position: 'relative',
                        }}>
                            <span style={{
                                position: 'absolute',
                                left: 0,
                                color: 'var(--gold)',
                                fontWeight: 700,
                            }}>•</span>
                            {item}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
