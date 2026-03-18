import { useState, useEffect } from 'react';

interface TutorialStep {
    icon: string;
    title: string;
    description: string;
    detail?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        icon: '🎯',
        title: '¿Cómo funciona AdiviNum?',
        description: 'AdiviNum es un juego de deducción 1vs1 donde cada jugador elige un número secreto de 4 dígitos y el otro debe adivinarlo.',
        detail: 'Los dígitos deben ser todos diferentes (ej: 1234 ✅, 1123 ❌).',
    },
    {
        icon: '🔢',
        title: 'Elige tu número secreto',
        description: 'Al comenzar una partida, tendrás 30 segundos para elegir un número de 4 dígitos sin repetir.',
        detail: 'No puedes cambiarlo una vez confirmado. ¡Piénsalo bien!',
    },
    {
        icon: '🎯',
        title: 'Famas y Toques',
        description: 'Con cada intento obtendrás pistas:',
        detail: '🎯 FAMA = dígito correcto en posición correcta\n💡 TOQUE = dígito correcto en posición incorrecta\n✗ MISS = dígito no existe en el número',
    },
    {
        icon: '🧠',
        title: 'Ejemplo de jugada',
        description: 'Si el secreto es 5274 y adivinas 5432:',
        detail: '5 → 🎯 Fama (correcto, posición 1)\n4 → 💡 Toque (existe, pero está en pos. 3)\n3 → ✗ Miss\n2 → 💡 Toque (existe, pero está en pos. 4)\n\nResultado: 1 Fama, 2 Toques',
    },
    {
        icon: '⏱️',
        title: 'Turnos y tiempo',
        description: 'Los jugadores se turnan para adivinar. Cada jugador tiene un tiempo límite total según el nivel.',
        detail: 'Si se te acaba el tiempo, ¡pierdes la partida automáticamente!',
    },
    {
        icon: '🏆',
        title: '¿Cómo ganar?',
        description: 'Gana el primero en adivinar el número secreto del rival (4 Famas). Si ambos lo adivinan en la misma ronda, ¡empate!',
        detail: 'También puedes ganar si el rival abandona o se le acaba el tiempo.',
    },
    {
        icon: '🪙',
        title: 'Apuestas y monedas',
        description: 'Cada partida tiene una apuesta. Empiezas con 10,000 monedas virtuales. El ganador se lleva la apuesta (menos una pequeña comisión).',
        detail: 'Sube de nivel para desbloquear apuestas más altas.',
    },
    {
        icon: '🚀',
        title: '¡Estás listo!',
        description: '¡Ya conoces las reglas! Ve a "Jugar" para buscar un rival y disfrutar tu primera partida.',
        detail: 'Consejo: Usa la lógica para descartar dígitos. Cada pista cuenta. 🧠',
    },
];

const STORAGE_KEY = 'adivinum_onboarding_complete';

export function OnboardingTutorial() {
    const [visible, setVisible] = useState(false);
    const [step, setStep] = useState(0);

    useEffect(() => {
        const done = localStorage.getItem(STORAGE_KEY);
        if (!done) {
            // Small delay so the page renders first
            const timer = setTimeout(() => setVisible(true), 500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleNext = () => {
        if (step < TUTORIAL_STEPS.length - 1) {
            setStep(step + 1);
        } else {
            handleClose();
        }
    };

    const handlePrev = () => {
        if (step > 0) setStep(step - 1);
    };

    const handleClose = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setVisible(false);
    };

    const handleSkip = () => {
        handleClose();
    };

    if (!visible) return null;

    const current = TUTORIAL_STEPS[step];
    const isLast = step === TUTORIAL_STEPS.length - 1;
    const progress = ((step + 1) / TUTORIAL_STEPS.length) * 100;

    return (
        <div className="onboarding-overlay" onClick={handleSkip}>
            <div className="onboarding-modal" onClick={e => e.stopPropagation()}>
                {/* Progress bar */}
                <div className="onboarding-progress">
                    <div
                        className="onboarding-progress__fill"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Skip button */}
                <button className="onboarding-skip" onClick={handleSkip}>
                    Saltar
                </button>

                {/* Step content */}
                <div className="onboarding-content" key={step}>
                    <div className="onboarding-icon">{current.icon}</div>
                    <h3 className="onboarding-title">{current.title}</h3>
                    <p className="onboarding-desc">{current.description}</p>
                    {current.detail && (
                        <div className="onboarding-detail">
                            {current.detail.split('\n').map((line, i) => (
                                <div key={i} className="onboarding-detail__line">{line}</div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Step dots */}
                <div className="onboarding-dots">
                    {TUTORIAL_STEPS.map((_, i) => (
                        <span
                            key={i}
                            className={`onboarding-dot ${i === step ? 'onboarding-dot--active' : ''} ${i < step ? 'onboarding-dot--done' : ''}`}
                            onClick={() => setStep(i)}
                        />
                    ))}
                </div>

                {/* Navigation */}
                <div className="onboarding-nav">
                    <button
                        className="btn btn--ghost btn--sm"
                        onClick={handlePrev}
                        disabled={step === 0}
                        style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
                    >
                        ← Anterior
                    </button>
                    <button className="btn btn--primary" onClick={handleNext}>
                        {isLast ? '🚀 ¡Jugar!' : 'Siguiente →'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * Call this to force-show the tutorial again (e.g. from settings).
 */
export function resetOnboarding() {
    localStorage.removeItem(STORAGE_KEY);
}
