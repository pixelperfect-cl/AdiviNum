import { useState, useCallback, useEffect, useRef } from 'react';
import { isValidSecret } from '@adivinum/shared';

interface Attempt {
    guess: string;
    toques: number;
    famas: number;
}

type PracticePhase = 'setup' | 'playing' | 'game_over';

function generateBotSecret(): string {
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    // Shuffle and pick first 4
    for (let i = digits.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [digits[i], digits[j]] = [digits[j], digits[i]];
    }
    return digits.slice(0, 4).join('');
}

function evaluateGuess(guess: string, secret: string): { toques: number; famas: number } {
    let famas = 0;
    let toques = 0;
    for (let i = 0; i < 4; i++) {
        if (guess[i] === secret[i]) {
            famas++;
        } else if (secret.includes(guess[i])) {
            toques++;
        }
    }
    return { toques, famas };
}

/** Simple bot that makes reasonable guesses */
function makeBotGuess(botAttempts: Attempt[]): string {
    // Simple strategy: start with a random valid guess, then try to refine
    // For a basic bot, just generate random valid guesses
    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    let guess: string;
    let attempts = 0;
    do {
        // Shuffle and pick 4
        for (let i = digits.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [digits[i], digits[j]] = [digits[j], digits[i]];
        }
        const picked = digits.slice(0, 4);
        if (picked[0] === 0) {
            // Swap 0 with another position
            const swapIdx = 1 + Math.floor(Math.random() * 3);
            [picked[0], picked[swapIdx]] = [picked[swapIdx], picked[0]];
        }
        guess = picked.join('');
        attempts++;
    } while (
        attempts < 100 &&
        botAttempts.some((a) => a.guess === guess)
    );
    return guess;
}

export function PracticePage() {
    const [phase, setPhase] = useState<PracticePhase>('setup');
    const [mySecret, setMySecret] = useState('');
    const [secretInput, setSecretInput] = useState('');
    const [secretError, setSecretError] = useState('');
    const [botSecret, setBotSecret] = useState('');
    const [myAttempts, setMyAttempts] = useState<Attempt[]>([]);
    const [botAttempts, setBotAttempts] = useState<Attempt[]>([]);
    const [guess, setGuess] = useState('');
    const [guessError, setGuessError] = useState('');
    const [isMyTurn, setIsMyTurn] = useState(true);
    const [result, setResult] = useState<'WIN' | 'LOSS' | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSetSecret = () => {
        if (!isValidSecret(secretInput)) {
            setSecretError('Debe tener 4 cifras únicas y no comenzar en 0');
            return;
        }
        setSecretError('');
        setMySecret(secretInput);
        setBotSecret(generateBotSecret());
        setPhase('playing');
        setIsMyTurn(Math.random() > 0.5);
    };

    const handleGuess = useCallback(() => {
        if (guess.length !== 4) return;
        const digits = new Set(guess.split(''));
        if (digits.size !== 4 || guess[0] === '0') {
            setGuessError('4 dígitos únicos, sin empezar en 0');
            return;
        }
        setGuessError('');

        // Evaluate my guess against bot's secret
        const result = evaluateGuess(guess, botSecret);
        const attempt: Attempt = { guess, ...result };
        setMyAttempts((prev) => [...prev, attempt]);
        setGuess('');

        if (result.famas === 4) {
            setResult('WIN');
            setPhase('game_over');
            return;
        }

        // Bot's turn
        setIsMyTurn(false);
        setTimeout(() => {
            const botGuess = makeBotGuess(botAttempts);
            const botResult = evaluateGuess(botGuess, mySecret);
            const botAttempt: Attempt = { guess: botGuess, ...botResult };
            setBotAttempts((prev) => [...prev, botAttempt]);

            if (botResult.famas === 4) {
                setResult('LOSS');
                setPhase('game_over');
                return;
            }

            setIsMyTurn(true);
        }, 1000 + Math.random() * 1500);
    }, [guess, botSecret, mySecret, botAttempts]);

    // Auto-focus input on my turn
    useEffect(() => {
        if (isMyTurn && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isMyTurn]);

    // If bot goes first
    useEffect(() => {
        if (phase === 'playing' && !isMyTurn && botAttempts.length === 0) {
            setTimeout(() => {
                const botGuess = makeBotGuess([]);
                const botResult = evaluateGuess(botGuess, mySecret);
                setBotAttempts([{ guess: botGuess, ...botResult }]);
                setIsMyTurn(true);
            }, 1000);
        }
    }, [phase, isMyTurn]);

    const reset = () => {
        setPhase('setup');
        setMySecret('');
        setSecretInput('');
        setSecretError('');
        setBotSecret('');
        setMyAttempts([]);
        setBotAttempts([]);
        setGuess('');
        setGuessError('');
        setIsMyTurn(true);
        setResult(null);
    };

    if (phase === 'setup') {
        return (
            <div className="game-phase-center fade-in">
                <div className="game-phase-card">
                    <h2 className="game-phase-title">🤖 Modo Práctica</h2>
                    <p className="game-phase-subtitle">
                        Juega contra un bot sin apuestas. ¡Perfecto para practicar!
                    </p>
                    <p className="game-phase-subtitle" style={{ marginTop: '12px' }}>
                        Elige tu número secreto (4 dígitos únicos, no comienza con 0)
                    </p>
                    <div className="secret-input-group">
                        <input
                            type="text"
                            className="secret-input"
                            maxLength={4}
                            value={secretInput}
                            onChange={(e) => {
                                setSecretInput(e.target.value.replace(/\D/g, ''));
                                setSecretError('');
                            }}
                            placeholder="1234"
                            autoFocus
                        />
                        <button
                            className="btn btn--primary"
                            onClick={handleSetSecret}
                            disabled={secretInput.length !== 4}
                        >
                            Empezar
                        </button>
                    </div>
                    {secretError && <p className="game-error">{secretError}</p>}
                </div>
            </div>
        );
    }

    if (phase === 'game_over') {
        return (
            <div className="game-phase-center fade-in">
                <div className="game-phase-card">
                    <h2 className="game-phase-title">
                        {result === 'WIN' ? '🏆 ¡Ganaste!' : '🤖 El bot ganó'}
                    </h2>
                    <p className="game-phase-subtitle">
                        Secreto del bot: <strong style={{ color: 'var(--gold)' }}>{botSecret}</strong>
                    </p>
                    <p className="game-phase-subtitle">
                        Tu secreto: <strong style={{ color: 'var(--gold)' }}>{mySecret}</strong>
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
                        <button className="btn btn--primary" onClick={reset}>
                            Jugar de nuevo
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="game-playing fade-in">
            <div className="game-header">
                <div style={{ textAlign: 'center', flex: 1 }}>
                    <span className="practice-badge">🤖 Práctica</span>
                </div>
                <div className="game-turn-indicator">
                    {isMyTurn ? (
                        <span className="turn-badge turn-mine">Tu turno</span>
                    ) : (
                        <span className="turn-badge turn-opponent">Turno bot</span>
                    )}
                </div>
            </div>

            <div className="game-board">
                <div className="attempts-column">
                    <h3 className="attempts-title">Mis Intentos</h3>
                    <div className="attempts-list">
                        {myAttempts.map((a, i) => (
                            <div key={i} className="attempt-row">
                                <span className="attempt-number">#{i + 1}</span>
                                <span className="attempt-guess">{a.guess}</span>
                                <span className="attempt-result">
                                    <span className="famas">{a.famas}F</span>
                                    <span className="toques">{a.toques}T</span>
                                </span>
                            </div>
                        ))}
                        {myAttempts.length === 0 && (
                            <p className="attempts-empty">Sin intentos aún</p>
                        )}
                    </div>
                </div>

                <div className="attempts-column">
                    <h3 className="attempts-title">Bot</h3>
                    <div className="attempts-list">
                        {botAttempts.map((a, i) => (
                            <div key={i} className="attempt-row">
                                <span className="attempt-number">#{i + 1}</span>
                                <span className="attempt-guess">{a.guess}</span>
                                <span className="attempt-result">
                                    <span className="famas">{a.famas}F</span>
                                    <span className="toques">{a.toques}T</span>
                                </span>
                            </div>
                        ))}
                        {botAttempts.length === 0 && (
                            <p className="attempts-empty">Sin intentos aún</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="game-input-area">
                {isMyTurn ? (
                    <div className="guess-input-group">
                        <input
                            ref={inputRef}
                            type="text"
                            className="guess-input"
                            maxLength={4}
                            value={guess}
                            onChange={(e) => {
                                setGuess(e.target.value.replace(/\D/g, ''));
                                setGuessError('');
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                            placeholder="Tu intento..."
                            autoFocus
                        />
                        <button
                            className="btn btn--primary"
                            onClick={handleGuess}
                            disabled={guess.length !== 4}
                        >
                            Adivinar
                        </button>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '12px' }}>
                        <div className="spinner" style={{ width: '20px', height: '20px', margin: '0 auto 8px' }} />
                        <p className="text-muted">El bot está pensando...</p>
                    </div>
                )}
                {guessError && <p className="game-error">{guessError}</p>}
            </div>
        </div>
    );
}
