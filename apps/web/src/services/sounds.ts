/**
 * Sound effects for AdiviNum using Web Audio API.
 * No external files needed — sounds are synthesized at runtime.
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
    return audioCtx;
}

// Mute preference saved in localStorage
const MUTE_KEY = 'adivinum_muted';

export function isMuted(): boolean {
    return localStorage.getItem(MUTE_KEY) === 'true';
}

export function setMuted(muted: boolean): void {
    localStorage.setItem(MUTE_KEY, String(muted));
}

export function toggleMute(): boolean {
    const next = !isMuted();
    setMuted(next);
    return next;
}

// ---- Tone helpers ----

function playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.3,
) {
    if (isMuted()) return;
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    } catch {
        // Ignore audio errors silently
    }
}

function playChord(freqs: number[], duration: number, type: OscillatorType = 'sine', volume = 0.15) {
    freqs.forEach((f) => playTone(f, duration, type, volume));
}

// ---- Public sound effects ----

/** Match found — ascending arpeggio + vibration */
export function soundMatchFound() {
    playTone(523, 0.15, 'sine', 0.25); // C5
    setTimeout(() => playTone(659, 0.15, 'sine', 0.25), 100); // E5
    setTimeout(() => playTone(784, 0.3, 'sine', 0.3), 200); // G5
    // Vibrate on mobile devices
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    }
}

/** Your turn — soft attention ding */
export function soundMyTurn() {
    playTone(880, 0.12, 'sine', 0.2); // A5
    setTimeout(() => playTone(1047, 0.18, 'sine', 0.25), 80); // C6
}

/** Guess sent — click/tap sound */
export function soundGuessSent() {
    playTone(600, 0.08, 'square', 0.1);
}

/** Fama (exact match) — bright ding */
export function soundFama() {
    playTone(1047, 0.2, 'sine', 0.2);
    setTimeout(() => playTone(1319, 0.25, 'sine', 0.25), 100);
}

/** Toque (partial match) — neutral blip */
export function soundToque() {
    playTone(660, 0.15, 'triangle', 0.15);
}

/** No match — low thud */
export function soundMiss() {
    playTone(220, 0.2, 'sine', 0.15);
}

/** Victory — triumphant fanfare */
export function soundWin() {
    playChord([523, 659, 784], 0.3, 'sine', 0.15); // C major
    setTimeout(() => playChord([587, 740, 880], 0.3, 'sine', 0.15), 250); // D major
    setTimeout(() => playChord([659, 831, 988], 0.5, 'sine', 0.2), 500);  // E major (resolve)
}

/** Defeat — descending tone */
export function soundLose() {
    playTone(440, 0.3, 'sine', 0.2);
    setTimeout(() => playTone(349, 0.3, 'sine', 0.2), 200);
    setTimeout(() => playTone(262, 0.5, 'sine', 0.15), 400);
}

/** Draw — neutral chord */
export function soundDraw() {
    playChord([440, 554, 659], 0.5, 'triangle', 0.12);
}

/** Timer warning — rapid beep when < 10s */
export function soundTimerWarning() {
    playTone(880, 0.06, 'square', 0.1);
}

/** Draw offered — notification ping */
export function soundDrawOffered() {
    playTone(784, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(784, 0.15, 'sine', 0.2), 150);
}

/** Countdown tick */
export function soundTick() {
    playTone(1000, 0.03, 'sine', 0.08);
}
