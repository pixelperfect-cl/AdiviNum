import type { RankConfig } from './types';
import { RANKS } from './ranks';

/**
 * AdiviNum — League / Season system.
 *
 * Each "season" lasts 7 days. At the end of a season:
 *  - Top 10% of each league get promoted
 *  - Bottom 10% get demoted
 *  - Everyone gets season rewards based on their final league
 *
 * Leagues are the same as RANKS but with seasonal rewards attached.
 */

export interface LeagueConfig {
    rank: RankConfig;
    seasonRewardVirtual: number;   // Coins awarded at season end
    promotionThreshold: number;     // Percentile to promote (top X%)
    demotionThreshold: number;      // Percentile to demote (bottom X%)
    icon: string;
}

export const LEAGUES: LeagueConfig[] = RANKS.map((rank, i) => ({
    rank,
    seasonRewardVirtual: [100, 250, 500, 1000, 2000, 3500, 5000, 10000][i],
    promotionThreshold: 10,  // top 10% promote
    demotionThreshold: 10,   // bottom 10% demote
    icon: ['🥉', '🥈', '🥇', '🏅', '💎', '👑', '⭐', '🌟'][i],
}));

/**
 * Get the current season number & dates.
 * Seasons start every Monday at 00:00 UTC.
 */
export function getCurrentSeason(): { seasonNumber: number; startDate: Date; endDate: Date } {
    const EPOCH = new Date('2026-01-05T00:00:00Z'); // First Monday of 2026
    const now = new Date();
    const diffMs = now.getTime() - EPOCH.getTime();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const seasonNumber = Math.floor(diffMs / weekMs) + 1;
    const startDate = new Date(EPOCH.getTime() + (seasonNumber - 1) * weekMs);
    const endDate = new Date(startDate.getTime() + weekMs);
    return { seasonNumber, startDate, endDate };
}

/**
 * Get league for a given ELO.
 */
export function getLeagueForElo(elo: number): LeagueConfig {
    const rank = RANKS.find(r => elo >= r.minElo && elo <= r.maxElo) ?? RANKS[0];
    return LEAGUES.find(l => l.rank.name === rank.name) ?? LEAGUES[0];
}

/**
 * Calculate time remaining in current season.
 */
export function getSeasonTimeRemaining(): { days: number; hours: number; minutes: number } {
    const { endDate } = getCurrentSeason();
    const diffMs = endDate.getTime() - Date.now();
    const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
    return { days, hours, minutes };
}
