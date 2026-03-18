import type { RankConfig } from './types';

/**
 * AdiviNum — Rank tiers based on ELO rating
 */
export const RANKS: RankConfig[] = [
    { name: 'Novato del Número', color: 'Gris', colorHex: '#9E9E9E', minElo: 0, maxElo: 299 },
    { name: 'Cazador de Famas', color: 'Azul', colorHex: '#42A5F5', minElo: 300, maxElo: 599 },
    { name: 'Matemático Callejero', color: 'Verde', colorHex: '#66BB6A', minElo: 600, maxElo: 899 },
    { name: 'Lógico Competitivo', color: 'Naranja', colorHex: '#FFA726', minElo: 900, maxElo: 1199 },
    { name: 'Maestro del Toque', color: 'Rojo', colorHex: '#EF5350', minElo: 1200, maxElo: 1499 },
    { name: 'Señor de la Deducción', color: 'Fucsia', colorHex: '#EC407A', minElo: 1500, maxElo: 1799 },
    { name: 'Mente Maestra', color: 'Dorado', colorHex: '#FFD700', minElo: 1800, maxElo: 2199 },
    { name: 'Supremo Adivinum', color: 'Negro', colorHex: '#212121', minElo: 2200, maxElo: Infinity },
];

/**
 * Get the rank for a given ELO rating.
 */
export function getRankForElo(elo: number): RankConfig {
    const rank = RANKS.find(r => elo >= r.minElo && elo <= r.maxElo);
    return rank ?? RANKS[0];
}
