import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import {
    LayoutDashboard,
    Users as UsersIcon,
    Gamepad2,
    Banknote,
    Trophy,
    Award,
    Settings,
    LogOut,
    FileText,
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Matches from './pages/Matches';
import Withdrawals from './pages/Withdrawals';
import Tournaments from './pages/Tournaments';
import Achievements from './pages/Achievements';
import SettingsPage from './pages/Settings';
import Changelog from './pages/Changelog';
import Login from './pages/Login';

const logoUrl = `${import.meta.env.BASE_URL}LogoAdivinum.webp`;

const NAV_ITEMS = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/users', icon: UsersIcon, label: 'Usuarios' },
    { path: '/matches', icon: Gamepad2, label: 'Partidas' },
    { path: '/withdrawals', icon: Banknote, label: 'Retiros' },
    { path: '/tournaments', icon: Trophy, label: 'Torneos' },
    { path: '/achievements', icon: Award, label: 'Logros' },
    { path: '/settings', icon: Settings, label: 'Configuración' },
];

export default function App() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        if (localStorage.getItem('DEV_TOKEN')) {
            setIsAuthenticated(true);
            return;
        }

        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsAuthenticated(!!session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setIsAuthenticated(!!session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        if (localStorage.getItem('DEV_TOKEN')) {
            localStorage.removeItem('DEV_TOKEN');
            localStorage.removeItem('x-dev-user');
            setIsAuthenticated(false);
        } else {
            await supabase.auth.signOut();
        }
    };

    if (isAuthenticated === null) return <div className="loading-spinner">Cargando...</div>;

    if (!isAuthenticated) return <Login onLogin={() => setIsAuthenticated(true)} />;

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-logo">
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        <img src={logoUrl} alt="AdiviNum" style={{ width: 160, height: 'auto' }} />
                        <span className="logo-badge">ADMIN</span>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/'}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        >
                            <item.icon size={18} className="nav-icon" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div style={{ marginTop: 'auto', padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <NavLink
                        to="/changelog"
                        style={({ isActive }) => ({
                            display: 'block',
                            textDecoration: 'none',
                            padding: '14px 16px',
                            borderRadius: 12,
                            background: isActive
                                ? 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.05))'
                                : 'linear-gradient(135deg, rgba(234,179,8,0.08), rgba(234,179,8,0.02))',
                            border: '1px solid rgba(234,179,8,0.2)',
                            marginBottom: 6,
                            transition: 'all 0.2s ease',
                        })}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 16 }}>🎮</span>
                            <span style={{
                                fontWeight: 800,
                                fontSize: 14,
                                color: 'var(--color-gold)',
                            }}>AdiviNum v1.0.6</span>
                            <span style={{
                                fontSize: 9,
                                fontWeight: 800,
                                padding: '1px 6px',
                                borderRadius: 4,
                                background: 'var(--color-gold)',
                                color: '#000',
                                letterSpacing: '0.05em',
                            }}>BETA</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                                fontSize: 9,
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: 'rgba(59,130,246,0.2)',
                                color: '#60A5FA',
                                letterSpacing: '0.03em',
                            }}>Admin v1.0</span>
                            <span style={{
                                fontSize: 9,
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: 'rgba(16,185,129,0.2)',
                                color: '#34D399',
                                letterSpacing: '0.03em',
                            }}>~21K LOC</span>
                            <span style={{
                                fontSize: 9,
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: 4,
                                background: 'rgba(139,92,246,0.2)',
                                color: '#A78BFA',
                                letterSpacing: '0.03em',
                            }}>~510h</span>
                        </div>
                    </NavLink>
                    <div style={{
                        textAlign: 'center',
                        fontSize: 11,
                        color: 'var(--color-text-muted)',
                        marginBottom: 10,
                    }}>
                        Powered by <span style={{ color: 'var(--color-gold)', fontWeight: 600 }}>Pixel Perfect</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="nav-link"
                        style={{ color: 'var(--color-red)' }}
                    >
                        <LogOut size={18} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/matches" element={<Matches />} />
                    <Route path="/withdrawals" element={<Withdrawals />} />
                    <Route path="/tournaments" element={<Tournaments />} />
                    <Route path="/achievements" element={<Achievements />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/changelog" element={<Changelog />} />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </div>
    );
}
