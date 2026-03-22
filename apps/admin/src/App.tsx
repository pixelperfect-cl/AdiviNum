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
                    <div>
                        <div className="logo-text">ADIVINUM</div>
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
                <div style={{ marginTop: 'auto', padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <NavLink
                        to="/changelog"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        style={{ marginBottom: 8 }}
                    >
                        <FileText size={16} />
                        <span style={{ flex: 1 }}>Changelog</span>
                        <span style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 6,
                            background: 'var(--color-gold)',
                            color: '#000',
                        }}>v1.0</span>
                    </NavLink>
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
