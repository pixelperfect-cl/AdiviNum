import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useUserStore } from '../stores/userStore';
import { isMuted, toggleMute } from '../services/sounds';

const NAV_ITEMS = [
    { to: '/', icon: '🏠', label: 'Inicio', end: true },
    { to: '/play', icon: '🎮', label: 'Jugar' },
    { to: '/spectate', icon: '👁️', label: 'Espectador' },
    { to: '/ranking', icon: '🏆', label: 'Ranking' },
    { to: '/history', icon: '📋', label: 'Historial' },
    { to: '/friends', icon: '👥', label: 'Amigos' },
];

// Bottom nav: max 5 items for mobile
const BOTTOM_NAV_ITEMS = NAV_ITEMS.filter(i => i.to !== '/spectate');

export function Layout({ children }: { children: React.ReactNode }) {
    const { wallet, user, logout, googleAvatarUrl, googleDisplayName } = useUserStore();
    const [muted, setMuted] = useState(isMuted());
    const navigate = useNavigate();

    const handleToggleMute = () => {
        const next = toggleMute();
        setMuted(next);
    };

    const displayName = googleDisplayName || user?.username || '';

    return (
        <div className="app-shell">
            {/* Desktop sidebar — hidden on mobile */}
            <aside className="sidebar">
                <div className="sidebar__brand">
                    <span className="sidebar__logo">AdiviNum</span>
                    <span className="sidebar__tagline">Adivina el número</span>
                </div>

                {/* User card in sidebar — clickable, goes to profile */}
                {user && (
                    <div
                        className="sidebar__user-card"
                        onClick={() => navigate('/profile')}
                        style={{ cursor: 'pointer' }}
                        title="Ver perfil"
                    >
                        {googleAvatarUrl ? (
                            <img
                                src={googleAvatarUrl}
                                alt="avatar"
                                className="avatar"
                                style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                                referrerPolicy="no-referrer"
                            />
                        ) : (
                            <div className="avatar">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div className="sidebar__user-info">
                            <span className="sidebar__username">{displayName}</span>
                            <span className="sidebar__user-level">⭐ Nivel {user.currentLevel}</span>
                        </div>
                    </div>
                )}

                <nav className="sidebar__nav">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            className={({ isActive }) =>
                                `sidebar__link ${isActive ? 'active' : ''}`
                            }
                        >
                            <span className="sidebar__link-icon">{item.icon}</span>
                            <span className="sidebar__link-label">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Wallet in sidebar */}
                <div className="sidebar__wallet">
                    <div className="sidebar__wallet-row">
                        <span>🪙</span>
                        <span className="sidebar__wallet-amount gold">
                            {(wallet?.balanceVirtual ?? 0).toLocaleString()}
                        </span>
                    </div>
                    <div className="sidebar__wallet-row">
                        <span>💰</span>
                        <span className="sidebar__wallet-amount">
                            ${((wallet?.balanceFiat ?? 0) / 100).toLocaleString()} CLP
                        </span>
                    </div>
                </div>

                {/* Version badge */}
                <NavLink to="/changelog" className="sidebar__version-badge">
                    <span className="sidebar__version-badge-icon">🎮</span>
                    <span className="sidebar__version-badge-text">AdiviNum v1.0.3</span>
                    <span className="sidebar__version-badge-tag">BETA</span>
                </NavLink>

                <a
                    href="https://pixelperfect.cl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sidebar__powered-by"
                >
                    Powered by <strong>Pixel Perfect</strong>
                </a>

                {/* Logout button in sidebar */}
                <button className="sidebar__logout" onClick={() => logout()}>
                    🚪 Cerrar Sesión
                </button>
            </aside>

            {/* Main content area */}
            <div className="main-area">
                {/* Top header — always visible */}
                <header className="top-header">
                    <span className="top-header__logo mobile-only">AdiviNum</span>
                    <div className="top-header__spacer desktop-only" />
                    <div className="top-header__right">
                        <button
                            className="top-header__play-cta desktop-only"
                            onClick={() => navigate('/play')}
                        >
                            🎯 ¡Jugar!
                        </button>
                        <div className="top-header__coins">
                            <span className="coin-icon">🪙</span>
                            <span>{(wallet?.balanceVirtual ?? 0).toLocaleString()}</span>
                        </div>
                        <button
                            className="top-header__mute"
                            onClick={handleToggleMute}
                            title={muted ? 'Activar sonido' : 'Silenciar'}
                        >
                            {muted ? '🔇' : '🔊'}
                        </button>
                        {/* User avatar → profile */}
                        <button
                            className="top-header__avatar"
                            onClick={() => navigate('/profile')}
                            title="Mi perfil"
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center',
                            }}
                        >
                            {googleAvatarUrl ? (
                                <img
                                    src={googleAvatarUrl}
                                    alt="perfil"
                                    style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                <span style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    background: 'var(--gold)',
                                    color: '#000',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                }}>
                                    {displayName.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </button>
                    </div>
                </header>

                <main className="app-main">
                    {children}
                </main>

                {/* Footer — visible on mobile */}
                <footer className="app-footer mobile-only">
                    <NavLink to="/changelog" className="app-footer__version">
                        🎮 AdiviNum v1.0.3 BETA
                    </NavLink>
                    <a
                        href="https://pixelperfect.cl"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="app-footer__powered"
                    >
                        Powered by <strong>Pixel Perfect</strong>
                    </a>
                </footer>
            </div>

            {/* Bottom navigation — visible only on mobile */}
            <nav className="bottom-nav">
                {BOTTOM_NAV_ITEMS.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) =>
                            `bottom-nav__item ${isActive ? 'active' : ''}`
                        }
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
