import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api';
import {
    Users as UsersIcon,
    Search,
    ShieldBan,
    ShieldCheck,
    Crown,
    Wallet,
    ArrowUpCircle,
    ArrowDownCircle,
    RotateCcw,
    X,
    Eye,
} from 'lucide-react';

export default function Users() {
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [selectedUser, setSelectedUser] = useState<any | null>(null);

    // Wallet adjustment form
    const [walletForm, setWalletForm] = useState({ amount: 0, currencyType: 'VIRTUAL', reason: '' });
    // Level form
    const [levelForm, setLevelForm] = useState({ level: 1, resetXp: false });

    const { data, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: adminApi.getUsers,
    });

    const users: any[] = data?.users || [];

    const banMut = useMutation({
        mutationFn: ({ userId, isBanned }: { userId: string; isBanned: boolean }) =>
            isBanned ? adminApi.unbanUser(userId) : adminApi.banUser(userId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    });

    const walletMut = useMutation({
        mutationFn: ({ userId, data }: { userId: string; data: any }) =>
            adminApi.adjustWallet(userId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setWalletForm({ amount: 0, currencyType: 'VIRTUAL', reason: '' });
        },
    });

    const levelMut = useMutation({
        mutationFn: ({ userId, data }: { userId: string; data: any }) =>
            adminApi.updateLevel(userId, data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    });

    const premiumMut = useMutation({
        mutationFn: ({ userId, isPremium }: { userId: string; isPremium: boolean }) =>
            adminApi.updateUserConfig(userId, { isPremium }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    });

    const filtered = users.filter(u =>
        u.username?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    const openDrawer = (user: any) => {
        setSelectedUser(user);
        setLevelForm({ level: user.currentLevel, resetXp: false });
    };

    if (isLoading) {
        return <div className="loading-spinner">Cargando usuarios...</div>;
    }

    return (
        <div>
            <div className="page-header">
                <h1 className="flex items-center gap-3"><UsersIcon size={28} /> Usuarios</h1>
                <p>{users.length} usuarios registrados</p>
            </div>

            <div className="data-table-wrapper">
                <div className="table-header">
                    <h2 className="flex items-center gap-2"><UsersIcon size={18} /> Lista de usuarios</h2>
                    <div className="flex items-center gap-2">
                        <Search size={16} className="text-muted" />
                        <input
                            className="table-search"
                            placeholder="Buscar por nombre o email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Usuario</th>
                            <th>ELO</th>
                            <th>Nivel</th>
                            <th>Billetera Virtual</th>
                            <th>Billetera Fiat</th>
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
                                    <td className="text-gold">
                                        {user.wallet?.balanceVirtual?.toLocaleString() ?? '—'}
                                    </td>
                                    <td className="text-green">
                                        ${user.wallet?.balanceFiat?.toLocaleString() ?? '—'}
                                    </td>
                                    <td>{user.gamesPlayed}</td>
                                    <td>
                                        <span className={winRate >= 50 ? 'text-green' : 'text-red'}>
                                            {winRate}%
                                        </span>
                                    </td>
                                    <td>
                                        {user.isBanned ? (
                                            <span className="badge badge-red">Baneado</span>
                                        ) : user.isPremium ? (
                                            <span className="badge badge-gold">VIP</span>
                                        ) : (
                                            <span className="badge badge-green">Activo</span>
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            className="btn"
                                            style={{ fontSize: 12 }}
                                            onClick={() => openDrawer(user)}
                                        >
                                            <Eye size={14} /> Gestionar
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ============= USER DRAWER ============= */}
            {selectedUser && (
                <>
                    <div className="drawer-overlay" onClick={() => setSelectedUser(null)} />
                    <div className="drawer-panel">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="user-avatar" style={{ width: 48, height: 48, fontSize: 20 }}>
                                    {selectedUser.username?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <div className="font-bold text-lg" style={{ color: 'var(--color-text-primary)' }}>
                                        {selectedUser.username}
                                    </div>
                                    <div className="text-muted text-sm">{selectedUser.email}</div>
                                </div>
                            </div>
                            <button
                                className="btn"
                                onClick={() => setSelectedUser(null)}
                                style={{ padding: 8 }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Stats Summary */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                            <div style={{ background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', padding: 12, textAlign: 'center' }}>
                                <div className="text-gold font-bold text-xl">{selectedUser.eloRating}</div>
                                <div className="text-muted text-xs">ELO</div>
                            </div>
                            <div style={{ background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', padding: 12, textAlign: 'center' }}>
                                <div className="font-bold text-xl" style={{ color: 'var(--color-text-primary)' }}>Lvl {selectedUser.currentLevel}</div>
                                <div className="text-muted text-xs">Nivel</div>
                            </div>
                            <div style={{ background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', padding: 12, textAlign: 'center' }}>
                                <div className="font-bold text-xl" style={{ color: 'var(--color-text-primary)' }}>
                                    {selectedUser.gamesPlayed > 0
                                        ? Math.round((selectedUser.gamesWon / selectedUser.gamesPlayed) * 100)
                                        : 0}%
                                </div>
                                <div className="text-muted text-xs">Win Rate</div>
                            </div>
                        </div>

                        {/* ---- WALLET SECTION ---- */}
                        <div style={{ marginBottom: 24 }}>
                            <h3 className="flex items-center gap-2 font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                                <Wallet size={18} /> Billetera
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                <div style={{ background: 'var(--color-bg-surface)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                                    <div className="text-muted text-xs mb-1">Virtual</div>
                                    <div className="text-gold font-bold text-lg">
                                        {selectedUser.wallet?.balanceVirtual?.toLocaleString() ?? 0}
                                    </div>
                                </div>
                                <div style={{ background: 'var(--color-bg-surface)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                                    <div className="text-muted text-xs mb-1">Fiat (CLP)</div>
                                    <div className="text-green font-bold text-lg">
                                        ${selectedUser.wallet?.balanceFiat?.toLocaleString() ?? 0}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <select
                                    className="table-search"
                                    style={{ width: '100%' }}
                                    value={walletForm.currencyType}
                                    onChange={(e) => setWalletForm({ ...walletForm, currencyType: e.target.value })}
                                >
                                    <option value="VIRTUAL">Monedas Virtuales</option>
                                    <option value="FIAT">Dinero Fiat (CLP)</option>
                                </select>
                                <input
                                    className="table-search"
                                    style={{ width: '100%' }}
                                    type="number"
                                    placeholder="Monto (positivo = abonar, negativo = debitar)"
                                    value={walletForm.amount || ''}
                                    onChange={(e) => setWalletForm({ ...walletForm, amount: Number(e.target.value) })}
                                />
                                <input
                                    className="table-search"
                                    style={{ width: '100%' }}
                                    placeholder="Motivo del ajuste..."
                                    value={walletForm.reason}
                                    onChange={(e) => setWalletForm({ ...walletForm, reason: e.target.value })}
                                />
                                <div className="flex gap-2">
                                    <button
                                        className="btn btn-green flex-1"
                                        disabled={walletMut.isPending || !walletForm.reason}
                                        onClick={() => walletMut.mutate({
                                            userId: selectedUser.id,
                                            data: { ...walletForm, amount: Math.abs(walletForm.amount) },
                                        })}
                                    >
                                        <ArrowUpCircle size={14} /> Abonar
                                    </button>
                                    <button
                                        className="btn btn-red flex-1"
                                        disabled={walletMut.isPending || !walletForm.reason}
                                        onClick={() => walletMut.mutate({
                                            userId: selectedUser.id,
                                            data: { ...walletForm, amount: -Math.abs(walletForm.amount) },
                                        })}
                                    >
                                        <ArrowDownCircle size={14} /> Debitar
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ---- LEVEL SECTION ---- */}
                        <div style={{ marginBottom: 24 }}>
                            <h3 className="flex items-center gap-2 font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                                <ArrowUpCircle size={18} /> Nivel y Progresión
                            </h3>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                <input
                                    className="table-search"
                                    style={{ width: 80 }}
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={levelForm.level}
                                    onChange={(e) => setLevelForm({ ...levelForm, level: Number(e.target.value) })}
                                />
                                <button
                                    className="btn btn-gold"
                                    disabled={levelMut.isPending}
                                    onClick={() => levelMut.mutate({
                                        userId: selectedUser.id,
                                        data: { level: levelForm.level, resetXp: false },
                                    })}
                                >
                                    Fijar nivel
                                </button>
                            </div>
                            <button
                                className="btn btn-red w-full"
                                disabled={levelMut.isPending}
                                onClick={() => {
                                    if (confirm(`¿Resetear el nivel de ${selectedUser.username} a 1? Se perderá todo su progreso.`)) {
                                        levelMut.mutate({
                                            userId: selectedUser.id,
                                            data: { level: 1, resetXp: true },
                                        });
                                    }
                                }}
                            >
                                <RotateCcw size={14} /> Resetear nivel a 1
                            </button>
                        </div>

                        {/* ---- MODERATION SECTION ---- */}
                        <div>
                            <h3 className="flex items-center gap-2 font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
                                <ShieldBan size={18} /> Moderación
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    className={`btn flex-1 ${selectedUser.isBanned ? 'btn-green' : 'btn-red'}`}
                                    disabled={banMut.isPending}
                                    onClick={() => {
                                        banMut.mutate(
                                            { userId: selectedUser.id, isBanned: selectedUser.isBanned },
                                            { onSuccess: () => setSelectedUser({ ...selectedUser, isBanned: !selectedUser.isBanned }) },
                                        );
                                    }}
                                >
                                    {selectedUser.isBanned
                                        ? <><ShieldCheck size={14} /> Desbanear</>
                                        : <><ShieldBan size={14} /> Banear</>
                                    }
                                </button>
                                <button
                                    className={`btn flex-1 ${selectedUser.isPremium ? 'btn-red' : 'btn-gold'}`}
                                    disabled={premiumMut.isPending}
                                    onClick={() => {
                                        premiumMut.mutate(
                                            { userId: selectedUser.id, isPremium: !selectedUser.isPremium },
                                            { onSuccess: () => setSelectedUser({ ...selectedUser, isPremium: !selectedUser.isPremium }) },
                                        );
                                    }}
                                >
                                    <Crown size={14} />
                                    {selectedUser.isPremium ? 'Quitar VIP' : 'Dar VIP'}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
