import type { LevelConfig } from './types';

/**
 * AdiviNum — 10 Levels Configuration
 *
 * Each level has a default bet (CLP), bet options, decreasing commission,
 * increasing prize, and decreasing time limit.
 *
 * Time starts at 6:00 (Nivel 1) and decreases by 10s per level
 * down to 4:30 (Nivel 10).
 */
export const LEVELS: LevelConfig[] = [
    { level: 1, betAmountCLP: 1000, betOptions: [500, 1000, 1500], commissionPercent: 15, prizeToWinner: 1700, timeSeconds: 360, color: 'Gris', colorHex: '#9E9E9E', unlockGamesPlayed: 0, unlockGamesWon: 0 },
    { level: 2, betAmountCLP: 2000, betOptions: [1000, 2000, 3000], commissionPercent: 15, prizeToWinner: 3400, timeSeconds: 350, color: 'Azul claro', colorHex: '#64B5F6', unlockGamesPlayed: 10, unlockGamesWon: 4 },
    { level: 3, betAmountCLP: 3000, betOptions: [1500, 3000, 4500], commissionPercent: 15, prizeToWinner: 5100, timeSeconds: 340, color: 'Azul oscuro', colorHex: '#1565C0', unlockGamesPlayed: 20, unlockGamesWon: 8 },
    { level: 4, betAmountCLP: 4000, betOptions: [2000, 4000, 6000], commissionPercent: 10, prizeToWinner: 7200, timeSeconds: 330, color: 'Verde', colorHex: '#4CAF50', unlockGamesPlayed: 35, unlockGamesWon: 14 },
    { level: 5, betAmountCLP: 5000, betOptions: [2500, 5000, 7500], commissionPercent: 10, prizeToWinner: 9000, timeSeconds: 320, color: 'Amarillo', colorHex: '#FFEB3B', unlockGamesPlayed: 50, unlockGamesWon: 20 },
    { level: 6, betAmountCLP: 6000, betOptions: [3000, 6000, 9000], commissionPercent: 9, prizeToWinner: 10920, timeSeconds: 310, color: 'Naranja', colorHex: '#FF9800', unlockGamesPlayed: 70, unlockGamesWon: 28 },
    { level: 7, betAmountCLP: 7000, betOptions: [3500, 7000, 10500], commissionPercent: 8, prizeToWinner: 12880, timeSeconds: 300, color: 'Rojo', colorHex: '#F44336', unlockGamesPlayed: 90, unlockGamesWon: 36 },
    { level: 8, betAmountCLP: 8000, betOptions: [4000, 8000, 12000], commissionPercent: 7, prizeToWinner: 14880, timeSeconds: 290, color: 'Fucsia', colorHex: '#E91E63', unlockGamesPlayed: 120, unlockGamesWon: 48 },
    { level: 9, betAmountCLP: 9000, betOptions: [4500, 9000, 13500], commissionPercent: 6, prizeToWinner: 16920, timeSeconds: 280, color: 'Morado', colorHex: '#9C27B0', unlockGamesPlayed: 150, unlockGamesWon: 60 },
    { level: 10, betAmountCLP: 10000, betOptions: [5000, 10000, 15000], commissionPercent: 5, prizeToWinner: 19000, timeSeconds: 270, color: 'Dorado', colorHex: '#FFD700', unlockGamesPlayed: 200, unlockGamesWon: 80 },
];

export const MAX_ATTEMPTS = 10;
export const SECRET_LENGTH = 4;

/**
 * Get level config by level number.
 */
export function getLevelConfig(level: number): LevelConfig {
    const config = LEVELS.find(l => l.level === level);
    if (!config) throw new Error(`Invalid level: ${level}`);
    return config;
}

/**
 * Calculate prize dynamically based on bet amount and commission.
 * prize = (bet * 2) * (1 - commission / 100)
 */
export function calculatePrize(betAmount: number, commissionPercent: number): number {
    return Math.round((betAmount * 2) * (1 - commissionPercent / 100));
}

/**
 * Calculate commission amount from a total pot.
 */
export function calculateCommission(betAmount: number, commissionPercent: number): number {
    return Math.round((betAmount * 2) * (commissionPercent / 100));
}

/**
 * Validate that a betAmount is valid for a given level.
 */
export function isValidBetForLevel(level: number, betAmount: number): boolean {
    const config = getLevelConfig(level);
    return config.betOptions.includes(betAmount);
}
