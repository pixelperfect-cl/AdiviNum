import { SECRET_LENGTH } from './levels';
import type { AttemptResult } from './types';

/**
 * Validates a secret number:
 * - Must be exactly 4 digits
 * - No repeated digits
 * - Cannot start with 0
 */
export function isValidSecret(secret: string): boolean {
    if (secret.length !== SECRET_LENGTH) return false;
    if (secret[0] === '0') return false;
    if (!/^\d+$/.test(secret)) return false;
    const digits = new Set(secret.split(''));
    return digits.size === SECRET_LENGTH;
}

/**
 * Validates a guess:
 * - Must be exactly 4 digits
 * - No repeated digits
 * - Cannot start with 0
 */
export function isValidGuess(guess: string): boolean {
    return isValidSecret(guess); // Same rules
}

/**
 * Core game engine: calculates Toques (correct digit, wrong position)
 * and Famas (correct digit, correct position).
 *
 * @param secret - The secret number (4 digits, no repeats, no leading 0)
 * @param guess - The guessed number (same constraints)
 * @returns AttemptResult with toques and famas count
 */
export function calculateToquesYFamas(
    secret: string,
    guess: string,
): Pick<AttemptResult, 'toques' | 'famas'> {
    let famas = 0;
    let toques = 0;

    for (let i = 0; i < SECRET_LENGTH; i++) {
        if (guess[i] === secret[i]) {
            famas++;
        } else if (secret.includes(guess[i])) {
            toques++;
        }
    }

    return { toques, famas };
}

/**
 * Check if a guess is a perfect match (4 Famas).
 */
export function isPerfectGuess(
    secret: string,
    guess: string,
): boolean {
    return secret === guess;
}
