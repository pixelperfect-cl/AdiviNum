import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../api';
import {
    Users,
    Gamepad2,
    Trophy,
    DollarSign,
} from 'lucide-react';

export default function Dashboard() {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard'],
        queryFn: adminApi.getDashboard,
    });

    if (isLoading) {
        return <div className="loading-spinner">Cargando dashboard...</div>;
    }

    const cards = [
        { icon: Users, label: 'Usuarios', value: stats?.totalUsers ?? 0, color: 'var(--color-blue)' },
        { icon: Gamepad2, label: 'Partidas Activas', value: stats?.activeMatches ?? 0, color: 'var(--color-green)' },
        { icon: Trophy, label: 'Partidas Jugadas', value: stats?.totalMatches ?? 0, color: 'var(--color-purple)' },
        { icon: DollarSign, label: 'Comisiones', value: `$${(stats?.totalRevenue ?? 0).toLocaleString()}`, color: 'var(--color-gold)' },
    ];

    return (
        <div>
            <div className="page-header">
                <h1>Dashboard</h1>
                <p>Resumen general de la plataforma</p>
            </div>

            <div className="stats-grid">
                {cards.map((card) => (
                    <div className="stat-card" key={card.label}>
                        <div className="stat-icon" style={{ color: card.color }}>
                            <card.icon size={28} />
                        </div>
                        <div className="stat-info">
                            <div className="stat-value">{card.value}</div>
                            <div className="stat-label">{card.label}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
