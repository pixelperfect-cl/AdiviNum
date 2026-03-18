import { Injectable } from '@nestjs/common';
import {
    calculateToquesYFamas,
    isValidSecret,
    isValidGuess,
    isPerfectGuess,
    MAX_ATTEMPTS,
} from '@adivinum/shared';

/**
 * Pure game logic service — no database, no side effects.
 * All methods are deterministic and easily testable.
 */
@Injectable()
export class GameEngineService {
    /**
     * Validate a secret number
     */
    validateSecret(secret: string): { valid: boolean; error?: string } {
        if (!isValidSecret(secret)) {
            return {
                valid: false,
                error: 'El número debe tener 4 cifras únicas y no comenzar en 0',
            };
        }
        return { valid: true };
    }

    /**
     * Validate a guess
     */
    validateGuess(guess: string): { valid: boolean; error?: string } {
        if (!isValidGuess(guess)) {
            return {
                valid: false,
                error: 'El intento debe tener 4 cifras únicas y no comenzar en 0',
            };
        }
        return { valid: true };
    }

    /**
     * Process a guess against a secret, returning toques and famas
     */
    processGuess(secret: string, guess: string) {
        return calculateToquesYFamas(secret, guess);
    }

    /**
     * Check if a guess wins the game
     */
    isWinningGuess(secret: string, guess: string): boolean {
        return isPerfectGuess(secret, guess);
    }

    /**
     * Determine coin flip (who starts first)
     * Returns 'A' or 'B'
     */
    coinFlip(): 'A' | 'B' {
        return Math.random() < 0.5 ? 'A' : 'B';
    }

    /**
     * Check if a player has exhausted all attempts
     */
    hasExhaustedAttempts(attemptCount: number): boolean {
        return attemptCount >= MAX_ATTEMPTS;
    }
}
