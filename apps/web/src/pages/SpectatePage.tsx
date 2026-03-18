import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../services/socket';
import { GameEvent } from '@adivinum/shared';

interface MatchSummary {
    matchId: string;
    level: number;
    currentTurn: 'A' | 'B';
    attemptsA: number;
    attemptsB: number;
    timeRemainingA: number;
    timeRemainingB: number;
}

interface SpectateUpdate {
    matchId: string;
    player: 'A' | 'B';
    guess: string;
    toques: number;
    famas: number;
    currentTurn: 'A' | 'B';
    timeRemainingA: number;
    timeRemainingB: number;
    attemptsA: number;
    attemptsB: number;
}

interface SpectateAttempt {
    player: 'A' | 'B';
    guess: string;
    toques: number;
    famas: number;
}

export function SpectatePage() {
    const navigate = useNavigate();
    const [matches, setMatches] = useState<MatchSummary[]>([]);
    const [spectating, setSpectating] = useState<string | null>(null);
    const [state, setState] = useState<MatchSummary | null>(null);
    const [attempts, setAttempts] = useState<SpectateAttempt[]>([]);
    const [gameOver, setGameOver] = useState<any>(null);
    const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Fetch active matches
    const fetchMatches = () => {
        const s = getSocket();
        s.emit(GameEvent.LIST_MATCHES);
    };

    useEffect(() => {
        const s = getSocket();

        // Listen for match list
        const handleMatches = (data: { matches: MatchSummary[] }) => {
            setMatches(data.matches);
        };

        // Listen for spectate state
        const handleState = (data: MatchSummary) => {
            setState(data);
            setAttempts([]);
            setGameOver(null);
        };

        // Listen for spectate updates
        const handleUpdate = (data: SpectateUpdate) => {
            setState(prev => prev ? {
                ...prev,
                currentTurn: data.currentTurn,
                timeRemainingA: data.timeRemainingA,
                timeRemainingB: data.timeRemainingB,
                attemptsA: data.attemptsA,
                attemptsB: data.attemptsB,
            } : prev);
            setAttempts(prev => [...prev, {
                player: data.player,
                guess: data.guess,
                toques: data.toques,
                famas: data.famas,
            }]);
        };

        // Listen for game over
        const handleGameOver = (data: any) => {
            setGameOver(data);
        };

        s.on(GameEvent.ACTIVE_MATCHES, handleMatches);
        s.on(GameEvent.SPECTATE_STATE, handleState);
        s.on(GameEvent.SPECTATE_UPDATE, handleUpdate);
        s.on(GameEvent.SPECTATE_GAME_OVER, handleGameOver);

        // Fetch initially
        fetchMatches();

        // Refresh match list every 5s when not spectating
        refreshRef.current = setInterval(() => {
            if (!spectating) fetchMatches();
        }, 5000);

        return () => {
            s.off(GameEvent.ACTIVE_MATCHES, handleMatches);
            s.off(GameEvent.SPECTATE_STATE, handleState);
            s.off(GameEvent.SPECTATE_UPDATE, handleUpdate);
            s.off(GameEvent.SPECTATE_GAME_OVER, handleGameOver);
            if (refreshRef.current) clearInterval(refreshRef.current);
            // Leave spectate room on unmount
            if (spectating) {
                s.emit(GameEvent.LEAVE_SPECTATE, { matchId: spectating });
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleSpectate = (matchId: string) => {
        const s = getSocket();
        s.emit(GameEvent.SPECTATE_MATCH, { matchId });
        setSpectating(matchId);
    };

    const handleLeave = () => {
        if (spectating) {
            const s = getSocket();
            s.emit(GameEvent.LEAVE_SPECTATE, { matchId: spectating });
        }
        setSpectating(null);
        setState(null);
        setAttempts([]);
        setGameOver(null);
        fetchMatches();
    };

    const formatTime = (ms: number) => {
        const s = Math.max(0, Math.ceil(ms / 1000));
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    // ---- Match List View ----
    if (!spectating) {
        return (
            <div className="spectate-page">
                <div className="spectate-header">
                    <button className="btn btn--ghost" onClick={() => navigate('/')}>
                        ← Volver
                    </button>
                    <h1>👁️ Espectador</h1>
                    <p className="spectate-subtitle">Mira partidas en vivo</p>
                </div>

                {matches.length === 0 ? (
                    <div className="spectate-empty">
                        <div className="spectate-empty-icon">🎮</div>
                        <p>No hay partidas activas ahora</p>
                        <p className="text-muted">Las partidas aparecerán aquí cuando jugadores estén jugando</p>
                        <button className="btn btn--ghost" onClick={fetchMatches} style={{ marginTop: '16px' }}>
                            🔄 Actualizar
                        </button>
                    </div>
                ) : (
                    <div className="spectate-list">
                        {matches.map(m => (
                            <div key={m.matchId} className="spectate-match-card" onClick={() => handleSpectate(m.matchId)}>
                                <div className="spectate-match-level">Nivel {m.level}</div>
                                <div className="spectate-match-info">
                                    <div className="spectate-match-players">
                                        <span className={m.currentTurn === 'A' ? 'active-turn' : ''}>
                                            Jugador A ({m.attemptsA} intentos)
                                        </span>
                                        <span className="vs">vs</span>
                                        <span className={m.currentTurn === 'B' ? 'active-turn' : ''}>
                                            Jugador B ({m.attemptsB} intentos)
                                        </span>
                                    </div>
                                    <div className="spectate-match-times">
                                        ⏱ {formatTime(m.timeRemainingA)} / {formatTime(m.timeRemainingB)}
                                    </div>
                                </div>
                                <div className="spectate-match-watch">👁️ Ver</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ---- Spectating View ----
    return (
        <div className="spectate-page">
            <div className="spectate-header">
                <button className="btn btn--ghost" onClick={handleLeave}>
                    ← Salir
                </button>
                <h1>👁️ Espectando</h1>
                {state && (
                    <p className="spectate-subtitle">Nivel {state.level} — Turno de {state.currentTurn === 'A' ? 'Jugador A' : 'Jugador B'}</p>
                )}
            </div>

            {gameOver ? (
                <div className="spectate-game-over">
                    <div className="game-over-emoji">
                        {gameOver.result === 'DRAW' ? '🤝' : '🏆'}
                    </div>
                    <h2>{gameOver.result === 'DRAW' ? 'Empate' : `Ganador: Jugador ${gameOver.result?.includes('A') ? 'A' : 'B'}`}</h2>
                    <button className="btn btn--primary" onClick={handleLeave} style={{ marginTop: '16px' }}>
                        Volver a la lista
                    </button>
                </div>
            ) : (
                <>
                    {state && (
                        <div className="spectate-board">
                            <div className="spectate-timers">
                                <div className={`spectate-timer ${state.currentTurn === 'A' ? 'active' : ''}`}>
                                    <span className="spectate-timer-label">Jugador A</span>
                                    <span className="spectate-timer-value">{formatTime(state.timeRemainingA)}</span>
                                    <span className="spectate-timer-attempts">{state.attemptsA} intentos</span>
                                </div>
                                <div className={`spectate-timer ${state.currentTurn === 'B' ? 'active' : ''}`}>
                                    <span className="spectate-timer-label">Jugador B</span>
                                    <span className="spectate-timer-value">{formatTime(state.timeRemainingB)}</span>
                                    <span className="spectate-timer-attempts">{state.attemptsB} intentos</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="spectate-attempts">
                        <h3>Intentos en vivo</h3>
                        {attempts.length === 0 ? (
                            <p className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>
                                Esperando que los jugadores hagan su jugada...
                            </p>
                        ) : (
                            <div className="spectate-attempts-list">
                                {attempts.map((a, i) => (
                                    <div key={i} className={`spectate-attempt spectate-attempt--${a.player.toLowerCase()}`}>
                                        <span className="spectate-attempt-player">Jugador {a.player}</span>
                                        <span className="spectate-attempt-guess">{a.guess}</span>
                                        <span className="spectate-attempt-result">
                                            {a.famas > 0 && <span className="fama-badge">🎯 {a.famas}F</span>}
                                            {a.toques > 0 && <span className="toque-badge">💡 {a.toques}T</span>}
                                            {a.famas === 0 && a.toques === 0 && <span className="miss-badge">✗</span>}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
