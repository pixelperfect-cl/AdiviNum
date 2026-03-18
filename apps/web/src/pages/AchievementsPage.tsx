import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Achievement {
    id: string;
    key: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
    unlockedAt: string | null;
}

export function AchievementsPage() {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<Achievement[]>('/users/me/achievements')
            .then(setAchievements)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="loading-page">
                <div className="spinner" />
                <span>Cargando logros...</span>
            </div>
        );
    }

    const unlockedCount = achievements.filter(a => a.unlocked).length;

    return (
        <div className="fade-in">
            <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '8px' }}>
                🏅 Logros
            </h2>
            <p className="text-muted" style={{ textAlign: 'center', marginBottom: '24px' }}>
                {unlockedCount} / {achievements.length} desbloqueados
            </p>

            {/* Progress bar */}
            <div className="achievements-progress">
                <div
                    className="achievements-progress-fill"
                    style={{ width: `${achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0}%` }}
                />
            </div>

            <div className="achievements-grid">
                {achievements.map(a => (
                    <div key={a.id} className={`achievement-card ${a.unlocked ? 'achievement-card--unlocked' : 'achievement-card--locked'}`}>
                        <div className="achievement-icon">
                            {a.icon || '🔒'}
                        </div>
                        <div className="achievement-info">
                            <div className="achievement-name">{a.name}</div>
                            <div className="achievement-desc">{a.description}</div>
                            {a.unlocked && a.unlockedAt && (
                                <div className="achievement-date">
                                    ✅ {new Date(a.unlockedAt).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
