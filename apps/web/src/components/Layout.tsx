import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useUserStore } from '../stores/userStore';
import { isMuted, toggleMute } from '../services/sounds';
import { api } from '../services/api';

const NAV_ITEMS = [
    { to: '/', icon: '🏠', label: 'Inicio', end: true },
    { to: '/play', icon: '🎮', label: 'Jugar' },
    { to: '/profile', icon: '👤', label: 'Perfil' },
    { to: '/spectate', icon: '👁️', label: 'Espectador' },
    { to: '/ranking', icon: '🏆', label: 'Ranking' },
    { to: '/friends', icon: '👥', label: 'Amigos' },
];

// Bottom nav: max 5 items for mobile
const BOTTOM_NAV_ITEMS = NAV_ITEMS.filter(i => i.to !== '/spectate');

// Profile dropdown shortcuts
const PROFILE_LINKS = [
    { tab: 'personal', icon: '👤', label: 'Perfil' },
    { tab: 'stats', icon: '📊', label: 'Estadísticas' },
    { tab: 'history', icon: '📋', label: 'Historial' },
    { tab: 'wallet', icon: '💰', label: 'Billetera' },
    { tab: 'achievements', icon: '🏅', label: 'Logros' },
];

interface LevelInfo {
    level: number;
    xp: number;
    xpInLevel: number;
    xpNeeded: number;
    progress: number;
    isMaxLevel: boolean;
}

export function Layout({ children }: { children: React.ReactNode }) {
    const { wallet, user, logout, googleAvatarUrl, googleDisplayName } = useUserStore();
    const [muted, setMuted] = useState(isMuted());
    const [showDropdown, setShowDropdown] = useState(false);
    const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const handleToggleMute = () => {
        const next = toggleMute();
        setMuted(next);
    };

    const displayName = googleDisplayName || user?.username || '';

    // Fetch level info
    useEffect(() => {
        if (user) {
            api.get<LevelInfo>('/users/me/level-info')
                .then(setLevelInfo)
                .catch(console.error);
        }
    }, [user]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const navigateToProfile = (tab?: string) => {
        setShowDropdown(false);
        navigate(tab ? `/profile?tab=${tab}` : '/profile');
    };

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

                {/* XP bar in sidebar */}
                {levelInfo && !levelInfo.isMaxLevel && (
                    <div className="sidebar__xp-bar">
                        <div className="xp-bar__track">
                            <div className="xp-bar__fill" style={{ width: `${levelInfo.progress}%` }} />
                        </div>
                        <span className="xp-bar__label">{levelInfo.xpInLevel}/{levelInfo.xpNeeded} XP</span>
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
                    <span className="sidebar__version-badge-text">AdiviNum v1.0.4</span>
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
                    <span className="top-header__logo mobile-only" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>AdiviNum</span>
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
                        {/* User avatar → dropdown */}
                        <div className="avatar-dropdown-wrapper" ref={dropdownRef}>
                            <button
                                className="top-header__avatar"
                                onClick={() => setShowDropdown(!showDropdown)}
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

                            {/* Avatar dropdown */}
                            {showDropdown && (
                                <div className="avatar-dropdown">
                                    <div className="avatar-dropdown__header">
                                        <strong>{displayName}</strong>
                                        <span className="avatar-dropdown__level">⭐ Nivel {user?.currentLevel ?? 1}</span>
                                        {levelInfo && !levelInfo.isMaxLevel && (
                                            <div className="xp-bar__track" style={{ marginTop: '6px' }}>
                                                <div className="xp-bar__fill" style={{ width: `${levelInfo.progress}%` }} />
                                            </div>
                                        )}
                                    </div>
                                    {PROFILE_LINKS.map(link => (
                                        <button
                                            key={link.tab}
                                            className="avatar-dropdown__item"
                                            onClick={() => navigateToProfile(link.tab)}
                                        >
                                            <span>{link.icon}</span>
                                            <span>{link.label}</span>
                                        </button>
                                    ))}
                                    <div className="avatar-dropdown__divider" />
                                    <button
                                        className="avatar-dropdown__item avatar-dropdown__item--danger"
                                        onClick={() => { setShowDropdown(false); logout(); }}
                                    >
                                        <span>🚪</span>
                                        <span>Cerrar Sesión</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="app-main">
                    {children}
                </main>

                {/* Footer — visible on mobile */}
                <footer className="app-footer mobile-only">
                    <NavLink to="/changelog" className="app-footer__version">
                        🎮 AdiviNum v1.0.4 BETA
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
