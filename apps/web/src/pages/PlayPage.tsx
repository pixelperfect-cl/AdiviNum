import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LEVELS, calculatePrize } from '@adivinum/shared';
import { useGameStore } from '../stores/gameStore';
import { useUserStore } from '../stores/userStore';
import { joinQueue, leaveQueue } from '../services/socket';
import { tournamentApi } from '../services/api';
import { PracticePage } from './PracticePage';

export function PlayPage() {
    const { user } = useUserStore();
    const { phase, setLevel, level } = useGameStore();
    const [selectedLevel, setSelectedLevel] = useState(level);
    const navigate = useNavigate();
    const unsubRef = useRef<(() => void) | null>(null);

    const levelConfig = LEVELS[selectedLevel - 1];
    const [selectedBet, setSelectedBet] = useState(levelConfig?.betAmountCLP ?? 1000);
    const [selectedTime, setSelectedTime] = useState(300); // 5 min default

    const [activeTab, setActiveTab] = useState<'matchmaking' | 'tournaments' | 'practice'>('matchmaking');
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [loadingTournaments, setLoadingTournaments] = useState(false);
    const [registering, setRegistering] = useState<string | null>(null);

    // Cleanup subscriber on unmount
    useEffect(() => {
        return () => {
            if (unsubRef.current) {
                unsubRef.current();
                unsubRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (activeTab === 'tournaments') {
            loadTournaments();
        }
    }, [activeTab]);

    const loadTournaments = async () => {
        setLoadingTournaments(true);
        try {
            const data = await tournamentApi.getTournaments();
            setTournaments(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingTournaments(false);
        }
    };

    const handleRegisterTournament = async (tId: string) => {
        if (!user) return;
        setRegistering(tId);
        try {
            await tournamentApi.register(tId, user.id);
            alert('¡Registrado con éxito!');
            loadTournaments();
        } catch (err: any) {
            alert(err.message || 'Error al registrarse');
        } finally {
            setRegistering(null);
        }
    };

    const userLevel = user?.currentLevel ?? 1;

    const handleLevelSelect = (lvl: number) => {
        if (lvl > userLevel) return;
        setSelectedLevel(lvl);
        setLevel(lvl);
        // Reset bet to default for the new level
        const config = LEVELS[lvl - 1];
        if (config) setSelectedBet(config.betAmountCLP);
    };

    const handleSearchMatch = () => {
        joinQueue(selectedLevel, selectedBet, 'VIRTUAL', selectedTime);

        // Listen for phase change to navigate once match is found
        unsubRef.current = useGameStore.subscribe((state) => {
            if (state.phase === 'set_secret' || state.phase === 'coin_flip') {
                unsubRef.current?.();
                unsubRef.current = null;
                navigate('/game');
            }
        });
    };

    const handleCancelSearch = () => {
        leaveQueue();
    };

    // Dynamic prize based on selected bet
    const dynamicPrize = levelConfig
        ? calculatePrize(selectedBet, levelConfig.commissionPercent)
        : 0;

    return (
        <div className="fade-in">
            <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '8px' }}>
                Jugar
            </h2>

            <div className="play-tabs">
                <button
                    className={`play-tab ${activeTab === 'matchmaking' ? 'play-tab--active' : ''}`}
                    onClick={() => setActiveTab('matchmaking')}
                >
                    <span className="play-tab__icon">⚔️</span>
                    <span className="play-tab__label">Matchmaking</span>
                </button>
                <button
                    className={`play-tab ${activeTab === 'tournaments' ? 'play-tab--active' : ''}`}
                    onClick={() => setActiveTab('tournaments')}
                >
                    <span className="play-tab__icon">🏆</span>
                    <span className="play-tab__label">Torneos</span>
                </button>
                <button
                    className={`play-tab ${activeTab === 'practice' ? 'play-tab--active' : ''}`}
                    onClick={() => setActiveTab('practice')}
                >
                    <span className="play-tab__icon">🤖</span>
                    <span className="play-tab__label">Práctica</span>
                </button>
            </div>

            {activeTab === 'practice' && <PracticePage />}

            {activeTab === 'tournaments' && (
                <div className="play-layout">
                    {loadingTournaments ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <div className="spinner" style={{ margin: '0 auto 16px' }} />
                            <p className="text-muted">Cargando torneos...</p>
                        </div>
                    ) : tournaments.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                            <p className="text-muted">No hay torneos activos en este momento.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {tournaments.map((t) => (
                                <div key={t.id} className="card card--gold" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>{t.name}</h3>
                                        {t.description && <p className="text-muted" style={{ fontSize: '14px' }}>{t.description}</p>}
                                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                            <span>Entrada: <strong>${t.entryFee.toLocaleString()}</strong></span>
                                            <span>Pozo: <strong className="text-gold">${t.prizePool.toLocaleString()}</strong></span>
                                            <span>Jugadores: {t._count?.participants || 0}/{t.maxPlayers}</span>
                                        </div>
                                    </div>
                                    {t.status === 'REGISTRATION' && (
                                        <button
                                            className="btn btn--primary"
                                            onClick={() => handleRegisterTournament(t.id)}
                                            disabled={registering === t.id || t._count?.participants >= t.maxPlayers}
                                        >
                                            {registering === t.id ? 'Registrando...' : 'Unirse'}
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'matchmaking' && (
            <div className="play-layout">
                {/* Level Grid */}
                <div className="level-grid">
                    {LEVELS.map((_, i) => {
                        const lvl = i + 1;
                        const locked = lvl > userLevel;
                        return (
                            <button
                                key={lvl}
                                className={`level-chip ${selectedLevel === lvl ? 'active' : ''} ${locked ? 'locked' : ''}`}
                                onClick={() => handleLevelSelect(lvl)}
                                disabled={locked}
                            >
                                {locked ? '🔒' : lvl}
                            </button>
                        );
                    })}
                </div>

                {/* Bet + Time Selectors — side by side on desktop */}
                <div className="play-config-row">
                    {/* Bet Selector */}
                    {levelConfig && (
                        <div className="bet-selector">
                            <p className="bet-selector__label">Elige tu apuesta</p>
                            <div className="bet-selector__options">
                                {levelConfig.betOptions.map((bet) => (
                                    <button
                                        key={bet}
                                        className={`bet-chip ${selectedBet === bet ? 'active' : ''}`}
                                        onClick={() => setSelectedBet(bet)}
                                    >
                                        ${bet.toLocaleString()}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Time Selector */}
                    <div className="bet-selector">
                        <p className="bet-selector__label">⏱️ Tiempo de partida</p>
                        <div className="bet-selector__options">
                            {[{ value: 180, label: '3 min' }, { value: 300, label: '5 min' }, { value: 600, label: '10 min' }].map((t) => (
                                <button
                                    key={t.value}
                                    className={`bet-chip ${selectedTime === t.value ? 'active' : ''}`}
                                    onClick={() => setSelectedTime(t.value)}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Level Info */}
                {levelConfig && (
                    <div className="card card--gold">
                        <p className="section-subtitle">Nivel {selectedLevel}</p>
                        <div className="stat-row">
                            <span className="stat-label">Tiempo</span>
                            <span className="stat-value">{Math.floor(selectedTime / 60)}:{String(selectedTime % 60).padStart(2, '0')}</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Apuesta</span>
                            <span className="stat-value" style={{ color: 'var(--gold)' }}>
                                ${selectedBet.toLocaleString()} CLP
                            </span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Premio</span>
                            <span className="stat-value" style={{ color: 'var(--success)' }}>
                                ${dynamicPrize.toLocaleString()} CLP
                            </span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Comisión</span>
                            <span className="stat-value">{levelConfig.commissionPercent}%</span>
                        </div>
                    </div>
                )}

                {/* Action */}
                {phase === 'idle' && (
                    <button
                        className="btn btn--primary btn--large btn--block pulse-gold"
                        onClick={handleSearchMatch}
                    >
                        🎯 Buscar Partida
                    </button>
                )}

                {phase === 'queue' && (
                    <div style={{ textAlign: 'center' }}>
                        <div className="spinner" style={{ margin: '0 auto 16px' }} />
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                            Buscando rival...
                        </p>
                        <button
                            className="btn btn--secondary btn--block"
                            onClick={handleCancelSearch}
                        >
                            Cancelar
                        </button>
                    </div>
                )}
            </div>
            )}
        </div>
    );
}
