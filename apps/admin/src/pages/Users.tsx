import { useState, useEffect } from 'react';
import { adminApi } from '../api';

export default function Users() {
    const [users, setUsers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        adminApi.getUsers()
            .then((res: any) => setUsers(res?.users || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleBan = async (userId: string, isBanned: boolean) => {
        try {
            if (isBanned) {
                await adminApi.unbanUser(userId);
            } else {
                await adminApi.banUser(userId);
            }
            setUsers(users.map(u =>
                u.id === userId ? { ...u, isBanned: !isBanned } : u
            ));
        } catch (err) {
            console.error('Ban/unban failed:', err);
        }
    };

    const filtered = users.filter(u =>
        u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <div className="loading-spinner">⏳ Cargando usuarios...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1>Usuarios</h1>
                <p>{users.length} usuarios registrados</p>
            </div>

            <div className="data-table-wrapper">
                <div className="table-header">
                    <h2>👥 Lista de usuarios</h2>
                    <input
                        className="table-search"
                        placeholder="🔍 Buscar por nombre o email..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>ELO</th>
                            <th>Nivel</th>
                            <th>Partidas</th>
                            <th>Win Rate</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((user) => {
                            const winRate = user.gamesPlayed > 0
                                ? Math.round((user.gamesWon / user.gamesPlayed) * 100)
                                : 0;

                            return (
                                <tr key={user.id}>
                                    <td>
                                        <div className="user-cell">
                                            <div className="user-avatar">
                                                {user.username?.[0]?.toUpperCase() ?? '?'}
                                            </div>
                                            <div>
                                                <div className="user-name">{user.username}</div>
                                                <div className="user-email">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-gold font-bold">{user.eloRating}</td>
                                    <td>{user.currentLevel}</td>
                                    <td>{user.gamesPlayed}</td>
                                    <td>
                                        <span className={winRate >= 50 ? 'text-green' : 'text-red'}>
                                            {winRate}%
                                        </span>
                                    </td>
                                    <td>
                                        {user.isBanned ? (
                                            <span className="badge badge-red">🚫 Baneado</span>
                                        ) : user.isPremium ? (
                                            <span className="badge badge-gold">⭐ Premium</span>
                                        ) : (
                                            <span className="badge badge-green">✅ Activo</span>
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            className={`btn ${user.isBanned ? 'btn-green' : 'btn-red'}`}
                                            onClick={() => handleBan(user.id, user.isBanned)}
                                            style={{ fontSize: '12px' }}
                                        >
                                            {user.isBanned ? '✅ Desbanear' : '🚫 Banear'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
