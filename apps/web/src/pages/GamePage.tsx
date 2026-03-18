import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { useUserStore } from '../stores/userStore';
import { setSecret as sendSecret, makeGuess, surrender, offerDraw, respondDraw, sendChatMessage, requestRematch, respondRematch } from '../services/socket';
import { isValidSecret, getLevelConfig } from '@adivinum/shared';
import { CircularTimer } from '../components/CircularTimer';
import { soundGuessSent } from '../services/sounds';

export function GamePage() {
    const navigate = useNavigate();
    const game = useGameStore();
    // useUserStore used in GameOverPhase below

    // If no match, redirect back
    useEffect(() => {
        if (!game.matchId && game.phase === 'idle') {
            navigate('/play', { replace: true });
        }
    }, [game.matchId, game.phase, navigate]);

    if (!game.matchId) {
        return (
            <div className="loading-page">
                <div className="spinner" />
                <span>Cargando partida...</span>
            </div>
        );
    }

    return (
        <div className="game-page fade-in">
            {game.phase === 'set_secret' && <SetSecretPhase />}
            {game.phase === 'playing' && <PlayingPhase />}
            {game.phase === 'game_over' && <GameOverPhase />}
        </div>
    );
}

// ---- Set Secret Phase ----
function SetSecretPhase() {
    const game = useGameStore();
    const [secret, setSecretValue] = useState('');
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState<number | null>(null);

    // Start countdown when secretTimerSeconds arrives
    useEffect(() => {
        if (game.secretTimerSeconds != null && game.secretTimerSeconds > 0) {
            setCountdown(game.secretTimerSeconds);
        }
    }, [game.secretTimerSeconds]);

    // Tick down
    useEffect(() => {
        if (countdown == null || countdown <= 0) return;
        const interval = setInterval(() => {
            setCountdown((prev) => (prev != null && prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(interval);
    }, [countdown != null]);

    const handleSubmit = () => {
        if (!isValidSecret(secret)) {
            setError('El número debe tener 4 cifras únicas y no comenzar en 0');
            return;
        }
        setError('');
        game.setSecret(secret);
        sendSecret(game.matchId!, secret);
    };

    const isSubmitted = game.mySecret !== '';
    const timerPercent = countdown != null && game.secretTimerSeconds
        ? (countdown / game.secretTimerSeconds) * 100
        : 100;
    const isUrgent = countdown != null && countdown <= 10;

    return (
        <div className="game-phase-center">
            <div className="game-phase-card">
                <h2 className="game-phase-title">🎯 Elige tu número secreto</h2>
                <p className="game-phase-subtitle">
                    4 dígitos únicos, no empieza con 0
                </p>

                {/* Countdown bar */}
                {countdown != null && (
                    <div className="secret-timer-bar">
                        <div
                            className={`secret-timer-bar__fill ${isUrgent ? 'urgent' : ''}`}
                            style={{ width: `${timerPercent}%` }}
                        />
                        <span className="secret-timer-bar__text">
                            {countdown}s
                        </span>
                    </div>
                )}

                {!isSubmitted ? (
                    <>
                        <div className="secret-input-group">
                            <input
                                type="text"
                                className="secret-input"
                                maxLength={4}
                                value={secret}
                                onChange={(e) => {
                                    const v = e.target.value.replace(/\D/g, '');
                                    setSecretValue(v);
                                    setError('');
                                }}
                                placeholder="1234"
                                autoFocus
                            />
                            <button
                                className="btn btn--primary"
                                onClick={handleSubmit}
                                disabled={secret.length !== 4}
                            >
                                Confirmar
                            </button>
                        </div>
                        {error && <p className="game-error">{error}</p>}
                        <p className="game-hint">
                            Ejemplo: 1234, 5678, 9012
                        </p>
                    </>
                ) : (
                    <div className="secret-waiting">
                        <p className="secret-confirmed">
                            Tu secreto: <span className="secret-display">{game.mySecret}</span>
                        </p>
                        <div className="spinner" style={{ margin: '16px auto' }} />
                        <p className="game-phase-subtitle">
                            Esperando que el rival elija su número...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ---- Playing Phase ----
function PlayingPhase() {
    const game = useGameStore();
    const [guess, setGuess] = useState('');
    const [error, setError] = useState('');
    const [drawDeclined, setDrawDeclined] = useState(false);
    const [chatMsg, setChatMsg] = useState('');
    const [chatOpen, setChatOpen] = useState(false);
    const [unreadChat, setUnreadChat] = useState(0);
    const [confirmSurrender, setConfirmSurrender] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll chat + track unread
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        // If chat is closed and new messages arrive, increment unread
        if (!chatOpen && game.chatMessages.length > 0) {
            setUnreadChat(prev => prev + 1);
        }
    }, [game.chatMessages.length]);

    // Show brief message when draw is declined
    useEffect(() => {
        if (!game.drawPending && drawDeclined) {
            const t = setTimeout(() => setDrawDeclined(false), 3000);
            return () => clearTimeout(t);
        }
    }, [game.drawPending, drawDeclined]);

    useEffect(() => {
        if (game.isMyTurn && inputRef.current) {
            inputRef.current.focus();
        }
    }, [game.isMyTurn]);

    const handleGuess = () => {
        if (guess.length !== 4) return;
        const digits = new Set(guess.split(''));
        if (digits.size !== 4 || guess[0] === '0') {
            setError('4 dígitos únicos, sin empezar en 0');
            return;
        }
        setError('');
        makeGuess(game.matchId!, guess);
        soundGuessSent();
        setGuess('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleGuess();
    };

    const handleSendChat = () => {
        const msg = chatMsg.trim();
        if (!msg || !game.matchId) return;
        sendChatMessage(game.matchId, msg);
        game.addChatMessage(msg, 'me');
        setChatMsg('');
    };

    const handleChatKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSendChat();
    };

    const maxTimeMs = getLevelConfig(game.level).timeSeconds * 1000;

    return (
        <div className="game-playing">
            {/* Opponent disconnected overlay */}
            {game.opponentDisconnected && (
                <div className="reconnect-overlay">
                    <div className="reconnect-overlay__content">
                        <div className="spinner" />
                        <p>Rival desconectado — esperando reconexión...</p>
                    </div>
                </div>
            )}

            {/* Header with turn indicator and circular timers */}
            <div className="game-header">
                <CircularTimer
                    timeMs={game.myTimeRemaining}
                    maxTimeMs={maxTimeMs}
                    isActive={game.isMyTurn}
                    label="Tú"
                />
                <div className="game-turn-indicator">
                    {game.isMyTurn ? (
                        <span className="turn-badge turn-mine">Tu turno</span>
                    ) : (
                        <span className="turn-badge turn-opponent">Turno rival</span>
                    )}
                </div>
                <CircularTimer
                    timeMs={game.opponentTimeRemaining}
                    maxTimeMs={maxTimeMs}
                    isActive={!game.isMyTurn}
                    label={game.opponentName || 'Rival'}
                />
            </div>

            {/* Two-column: my attempts | opponent attempts */}
            <div className="game-board">
                <div className="attempts-column">
                    <h3 className="attempts-title">Mis Intentos</h3>
                    <div className="attempts-list">
                        {game.myAttempts.map((a, i) => (
                            <div key={i} className="attempt-row">
                                <span className="attempt-number">#{i + 1}</span>
                                <span className="attempt-guess">{a.guess}</span>
                                <span className="attempt-result">
                                    <span className="famas">{a.famas}F</span>
                                    <span className="toques">{a.toques}T</span>
                                </span>
                            </div>
                        ))}
                        {game.myAttempts.length === 0 && (
                            <p className="attempts-empty">Sin intentos aún</p>
                        )}
                    </div>
                </div>

                <div className="attempts-column">
                    <h3 className="attempts-title">{game.opponentName || 'Rival'}</h3>
                    <div className="attempts-list">
                        {game.opponentAttempts.map((a, i) => (
                            <div key={i} className="attempt-row">
                                <span className="attempt-number">#{i + 1}</span>
                                <span className="attempt-guess">{a.guess}</span>
                                <span className="attempt-result">
                                    <span className="famas">{a.famas}F</span>
                                    <span className="toques">{a.toques}T</span>
                                </span>
                            </div>
                        ))}
                        {game.opponentAttempts.length === 0 && (
                            <p className="attempts-empty">Sin intentos aún</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Input area */}
            <div className="game-input-area">
                {game.isMyTurn ? (
                    <>
                        <div className="guess-input-group">
                            <input
                                ref={inputRef}
                                type="text"
                                inputMode="numeric"
                                className="guess-input"
                                maxLength={4}
                                value={guess}
                                onChange={(e) => {
                                    setGuess(e.target.value.replace(/\D/g, '').slice(0, 4));
                                    setError('');
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="1234"
                                autoFocus
                            />
                            <button
                                className="btn btn--primary"
                                onClick={handleGuess}
                                disabled={guess.length !== 4}
                            >
                                Enviar
                            </button>
                        </div>
                        <p className="game-hint" style={{ marginTop: '4px', fontSize: '0.85rem' }}>
                            {guess.length > 0 ? `${guess.length}/4 dígitos` : '4 dígitos únicos, sin empezar en 0'}
                        </p>
                    </>
                ) : (
                    <div className="waiting-turn">
                        <div className="spinner" style={{ width: '24px', height: '24px' }} />
                        <span>Esperando turno del rival...</span>
                    </div>
                )}
                {error && <p className="game-error">{error}</p>}
            </div>

            {/* In-game Chat */}
            <div className={`game-chat ${chatOpen ? 'open' : ''}`}>
            <button className="game-chat-toggle" onClick={() => { setChatOpen(!chatOpen); if (!chatOpen) setUnreadChat(0); }}>
                    💬 Chat {unreadChat > 0 && <span className="chat-badge">{unreadChat}</span>}
                </button>
                {chatOpen && (
                    <div className="game-chat-panel">
                        {/* Emoji quick reactions */}
                        <div className="emoji-reactions-bar">
                            {['👏', '😂', '🔥', '💀', '🤔', '👀', '😎', '💪'].map((emoji) => (
                                <button
                                    key={emoji}
                                    className="emoji-reaction-btn"
                                    onClick={() => {
                                        if (!game.matchId) return;
                                        sendChatMessage(game.matchId, emoji);
                                        game.addChatMessage(emoji, 'me');
                                    }}
                                    title={emoji}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                        <div className="game-chat-messages">
                            {game.chatMessages.length === 0 && (
                                <p className="chat-empty">Sin mensajes aún...</p>
                            )}
                            {game.chatMessages.map((m, i) => (
                                <div key={i} className={`chat-msg ${m.from === 'me' ? 'mine' : 'theirs'}`}>
                                    {m.text}
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>
                        <div className="game-chat-input">
                            <input
                                type="text"
                                value={chatMsg}
                                onChange={(e) => setChatMsg(e.target.value)}
                                onKeyDown={handleChatKeyDown}
                                placeholder="Escribe un mensaje..."
                                maxLength={100}
                            />
                            <button className="btn btn--primary btn--sm" onClick={handleSendChat} disabled={!chatMsg.trim()}>➤</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Action buttons: Surrender + Draw Offer */}
            <div className="game-actions">
                <button
                    className="btn btn--ghost game-surrender"
                    onClick={() => setConfirmSurrender(true)}
                >
                    🏳️ Rendirse
                </button>
                {!game.drawPending ? (
                    drawDeclined ? (
                        <span className="draw-declined-msg">❌ Empate rechazado</span>
                    ) : (
                        <button
                            className="btn btn--ghost game-draw-offer"
                            onClick={() => {
                                offerDraw(game.matchId!);
                                game.setDrawPending(true);
                            }}
                        >
                            🤝 Ofrecer Empate
                        </button>
                    )
                ) : (
                    <span className="draw-pending">
                        <div className="spinner" style={{ width: '14px', height: '14px' }} />
                        Empate ofrecido...
                    </span>
                )}
            </div>

            {/* Draw offer received overlay */}
            {game.drawOffered && (
                <div className="draw-offer-overlay">
                    <div className="draw-offer-card">
                        <div className="draw-offer-emoji">🤝</div>
                        <h3>Tu rival ofrece empate</h3>
                        <p>Ambos recuperan su apuesta</p>
                        <div className="draw-offer-buttons">
                            <button
                                className="btn btn--primary"
                                onClick={() => {
                                    respondDraw(game.matchId!, true);
                                    game.setDrawOffered(false);
                                }}
                            >
                                ✅ Aceptar
                            </button>
                            <button
                                className="btn btn--ghost"
                                onClick={() => {
                                    respondDraw(game.matchId!, false);
                                    game.setDrawOffered(false);
                                }}
                            >
                                ❌ Rechazar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Surrender confirmation overlay */}
            {confirmSurrender && (
                <div className="draw-offer-overlay">
                    <div className="draw-offer-card">
                        <div className="draw-offer-emoji">🏳️</div>
                        <h3>¿Rendirse?</h3>
                        <p>Perderás la partida y tu apuesta</p>
                        <div className="draw-offer-buttons">
                            <button
                                className="btn btn--danger"
                                onClick={() => {
                                    surrender(game.matchId!);
                                    setConfirmSurrender(false);
                                }}
                            >
                                Sí, rendirme
                            </button>
                            <button
                                className="btn btn--ghost"
                                onClick={() => setConfirmSurrender(false)}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
        </div>
    );
}

// ---- Game Over Phase ----
function GameOverPhase() {
    const game = useGameStore();
    const { fetchUser } = useUserStore();
    const navigate = useNavigate();

    // Determine if I won — handle all result types
    // PLAYER_A_WINS, ABANDON_B, TIMEOUT_B → A wins
    // PLAYER_B_WINS, ABANDON_A, TIMEOUT_A → B wins
    const aWins = ['PLAYER_A_WINS', 'ABANDON_B', 'TIMEOUT_B'].includes(game.result || '');
    const bWins = ['PLAYER_B_WINS', 'ABANDON_A', 'TIMEOUT_A'].includes(game.result || '');
    const iWon = (aWins && game.myRole === 'A') || (bWins && game.myRole === 'B');
    const isDraw = game.result === 'DRAW' || (!aWins && !bWins);

    // Refresh wallet/user data after game ends
    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    // Fire confetti on victory!
    useEffect(() => {
        if (iWon) {
            import('canvas-confetti').then((confettiModule) => {
                const confetti = confettiModule.default;
                // First burst
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#FFD700', '#FFA500', '#44cc44', '#ffffff'],
                });
                // Second burst after delay
                setTimeout(() => {
                    confetti({
                        particleCount: 60,
                        spread: 100,
                        origin: { y: 0.5, x: 0.3 },
                    });
                    confetti({
                        particleCount: 60,
                        spread: 100,
                        origin: { y: 0.5, x: 0.7 },
                    });
                }, 300);
            });
        }
    }, [iWon]);

    const handleBack = () => {
        game.resetGame();
        navigate('/play', { replace: true });
    };

    return (
        <div className="game-phase-center">
            <div className="game-phase-card game-over-card game-over-animate">
                {isDraw ? (
                    <>
                        <div className="game-over-emoji">🤝</div>
                        <h2 className="game-over-title">¡Empate!</h2>
                    </>
                ) : iWon ? (
                    <>
                        <div className="game-over-emoji">🏆</div>
                        <h2 className="game-over-title game-over-win">¡Victoria!</h2>
                        <p className="game-over-prize">
                            +{game.winnerPrize.toLocaleString()} 🪙
                        </p>
                    </>
                ) : (
                    <>
                        <div className="game-over-emoji">😔</div>
                        <h2 className="game-over-title game-over-loss">Derrota</h2>
                    </>
                )}

                <p className="game-over-result">
                    {(() => {
                        const r = game.result || '';
                        if (isDraw) return 'Ambos jugadores empataron';
                        if (iWon) {
                            if (r.includes('ABANDON')) return '¡Tu rival se rindió!';
                            if (r.includes('TIMEOUT')) return '¡Tu rival se quedó sin tiempo!';
                            return '¡Ganaste! 🎉';
                        }
                        if (r.includes('ABANDON')) return 'Te rendiste';
                        if (r.includes('TIMEOUT')) return 'Se acabó tu tiempo';
                        return 'Tu rival ganó la partida';
                    })()}
                </p>

                {/* Opponent info & secret reveal */}
                <div className="game-over-details">
                    {game.opponentName && (
                        <p className="game-over-opponent">
                            vs <strong>{game.opponentName}</strong>
                        </p>
                    )}
                    {game.opponentSecret && (
                        <p className="game-over-secret">
                            Número del rival: <span className="secret-display">{game.opponentSecret}</span>
                        </p>
                    )}
                    <p className="game-over-my-secret">
                        Tu número: <span className="secret-display">{game.mySecret}</span>
                    </p>
                </div>

                {/* Rematch offered by opponent */}
                {game.rematchOfferedBy && (
                    <div className="rematch-offer">
                        <p>🔄 ¡Tu rival quiere revancha!</p>
                        <div className="rematch-offer-buttons">
                            <button
                                className="btn btn--primary"
                                onClick={() => {
                                    respondRematch(game.rematchOfferedBy!, true);
                                    game.setRematchOffered('');
                                }}
                            >
                                ✅ Aceptar
                            </button>
                            <button
                                className="btn btn--ghost"
                                onClick={() => {
                                    respondRematch(game.rematchOfferedBy!, false);
                                    game.setRematchOffered('');
                                }}
                            >
                                ❌ Rechazar
                            </button>
                        </div>
                    </div>
                )}

                {/* Rematch actions */}
                <div className="game-over-actions">
                    {!game.rematchPending && !game.rematchDeclined && !game.rematchOfferedBy && (
                        <button
                            className="btn btn--primary btn--large btn--block"
                            onClick={() => {
                                requestRematch(game.opponentId!, game.level, game.betAmount, game.currencyType);
                                game.setRematchPending(true);
                            }}
                        >
                            🔄 Revancha
                        </button>
                    )}
                    {game.rematchPending && (
                        <span className="rematch-pending">
                            <div className="spinner" style={{ width: '14px', height: '14px' }} />
                            Esperando respuesta del rival...
                        </span>
                    )}
                    {game.rematchDeclined && (
                        <span className="rematch-declined">❌ Revancha rechazada</span>
                    )}
                    <button
                        className="btn btn--ghost btn--large btn--block"
                        onClick={handleBack}
                    >
                        Volver al menú
                    </button>
                </div>
            </div>
        </div>
    );
}

