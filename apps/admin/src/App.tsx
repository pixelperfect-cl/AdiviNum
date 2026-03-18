import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Matches from './pages/Matches';
import Withdrawals from './pages/Withdrawals';
import Tournaments from './pages/Tournaments';
import Login from './pages/Login';

const NAV_ITEMS = [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/users', icon: '👥', label: 'Usuarios' },
    { path: '/matches', icon: '🎮', label: 'Partidas' },
    { path: '/withdrawals', icon: '💸', label: 'Retiros' },
    { path: '/tournaments', icon: '🏟️', label: 'Torneos' },
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

    if (isAuthenticated === null) return <div>Loading...</div>;

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
                            <span className="nav-icon">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div style={{ padding: '20px' }}>
                    <button onClick={handleLogout} style={{ background: '#e94560', color: 'white', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', width: '100%' }}>
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
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </main>
        </div>
    );
}
