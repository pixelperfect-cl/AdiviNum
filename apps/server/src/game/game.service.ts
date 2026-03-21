import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GameEngineService } from './game-engine.service';
import { WalletService } from '../wallet/wallet.service';
import { RankingService } from '../ranking/ranking.service';
import { UsersService } from '../users/users.service';
import { getLevelConfig, MAX_ATTEMPTS } from '@adivinum/shared';
import { MatchStatus, MatchResult, CurrencyType } from '@prisma/client';

interface ActiveMatch {
    id: string;
    level: number;
    betAmount: number;
    currencyType: CurrencyType;
    playerAId: string;       // Prisma User.id (UUID) — for DB/wallet operations
    playerBId: string;       // Prisma User.id (UUID)
    firebaseUidA: string;    // Firebase UID — for WebSocket routing
    firebaseUidB: string;    // Firebase UID
    usernameA: string;
    usernameB: string;
    avatarA: string | null;
    avatarB: string | null;
    secretA: string;
    secretB: string;
    currentTurn: 'A' | 'B';
    attemptsA: number;
    attemptsB: number;
    historyA: { guess: string; toques: number; famas: number; timestamp: number }[];
    historyB: { guess: string; toques: number; famas: number; timestamp: number }[];
    timeRemainingA: number; // ms
    timeRemainingB: number; // ms
    lastTurnStartedAt: number; // timestamp
    playerAGuessed: boolean;  // A already guessed the secret
    playerBGuessed: boolean;  // B already guessed the secret
    // Rounds
    totalRounds: number;      // 1, 3, or 5
    currentRound: number;     // current round (1-indexed)
    winsA: number;            // rounds won by A
    winsB: number;            // rounds won by B
    initialTimeMs: number;    // original time per round
}

@Injectable()
export class GameService {
    private readonly logger = new Logger(GameService.name);
    // In-memory active matches (for real-time performance; persisted to DB on completion)
    private activeMatches = new Map<string, ActiveMatch>();

    constructor(
        private readonly prisma: PrismaService,
        private readonly engine: GameEngineService,
        private readonly wallet: WalletService,
        private readonly ranking: RankingService,
        private readonly usersService: UsersService,
    ) { }

    /**
     * Look up a user by their Supabase UID (used by challenge system).
     */
    async getUserBySupabaseUid(supabaseUid: string) {
        return this.prisma.user.findUnique({
            where: { supabaseUid },
            select: { id: true, username: true, avatarUrl: true, eloRating: true },
        });
    }

    /**
     * Create a new match between two players.
     * Receives firebaseUids (from WebSocket auth), resolves to Prisma User IDs.
     */
    async createMatch(
        playerAFirebaseUid: string,
        playerBFirebaseUid: string,
        level: number,
        betAmount: number,
        currencyType: CurrencyType,
        timeSeconds?: number,
        totalRounds: number = 1,
    ) {
        // Resolve firebaseUid → Prisma User record
        const [userA, userB] = await Promise.all([
            this.prisma.user.findUnique({ where: { supabaseUid: playerAFirebaseUid } }),
            this.prisma.user.findUnique({ where: { supabaseUid: playerBFirebaseUid } }),
        ]);

        if (!userA || !userB) {
            throw new Error(`User not found: A=${playerAFirebaseUid}, B=${playerBFirebaseUid}`);
        }

        const config = getLevelConfig(level);
        const firstTurn = this.engine.coinFlip();

        // Hold bet using Prisma User.id
        await this.wallet.holdBet(userA.id, betAmount, currencyType);
        await this.wallet.holdBet(userB.id, betAmount, currencyType);

        const match = await this.prisma.match.create({
            data: {
                level,
                betAmount,
                currencyType,
                playerAId: userA.id,
                playerBId: userB.id,
                secretA: '',
                secretB: '',
                firstTurn,
                status: MatchStatus.COIN_FLIP,
            },
        });

        const timeMs = (timeSeconds ?? config.timeSeconds) * 1000;
        this.activeMatches.set(match.id, {
            id: match.id,
            level,
            betAmount,
            currencyType,
            playerAId: userA.id,
            playerBId: userB.id,
            firebaseUidA: playerAFirebaseUid,
            firebaseUidB: playerBFirebaseUid,
            usernameA: userA.username,
            usernameB: userB.username,
            avatarA: userA.avatarUrl,
            avatarB: userB.avatarUrl,
            secretA: '',
            secretB: '',
            currentTurn: firstTurn,
            attemptsA: 0,
            attemptsB: 0,
            historyA: [],
            historyB: [],
            timeRemainingA: timeMs,
            timeRemainingB: timeMs,
            lastTurnStartedAt: 0, // Set when both secrets are set
            playerAGuessed: false,
            playerBGuessed: false,
            totalRounds: totalRounds,
            currentRound: 1,
            winsA: 0,
            winsB: 0,
            initialTimeMs: timeMs,
        });

        return {
            match,
            firstTurn,
            playerAName: userA.username,
            playerBName: userB.username,
            playerAAvatarUrl: userA.avatarUrl,
            playerBAvatarUrl: userB.avatarUrl,
        };
    }

    /**
     * Set a player's secret number
     */
    setSecret(matchId: string, player: 'A' | 'B', secret: string): boolean {
        const validation = this.engine.validateSecret(secret);
        if (!validation.valid) return false;

        const active = this.activeMatches.get(matchId);
        if (!active) return false;

        if (player === 'A') active.secretA = secret;
        else active.secretB = secret;

        // If both secrets are set, the game can start
        if (active.secretA && active.secretB) {
            active.lastTurnStartedAt = Date.now();
        }

        return true;
    }

    /**
     * Both secrets set?
     */
    areBothSecretsSet(matchId: string): boolean {
        const active = this.activeMatches.get(matchId);
        if (!active) return false;
        return !!(active.secretA && active.secretB);
    }

    /**
     * Handle secret timeout — auto-forfeit players who didn't set secret.
     * If neither set, cancel the match and refund both.
     * If only one set, the other forfeits.
     */
    async handleSecretTimeout(matchId: string) {
        const active = this.activeMatches.get(matchId);
        if (!active) return null;

        const hasA = !!active.secretA;
        const hasB = !!active.secretB;

        if (!hasA && !hasB) {
            // Neither set — cancel/draw, refund both
            return this.endMatch(matchId, MatchResult.DRAW);
        } else if (hasA && !hasB) {
            // B didn't set secret — B loses
            return this.endMatch(matchId, MatchResult.TIMEOUT_B);
        } else {
            // A didn't set secret — A loses
            return this.endMatch(matchId, MatchResult.TIMEOUT_A);
        }
    }

    /**
     * Identify which player (A/B) a firebaseUid belongs to
     */
    getPlayerRole(matchId: string, firebaseUid: string): 'A' | 'B' | null {
        const active = this.activeMatches.get(matchId);
        if (!active) return null;
        if (active.firebaseUidA === firebaseUid) return 'A';
        if (active.firebaseUidB === firebaseUid) return 'B';
        return null;
    }

    /**
     * Get the firebaseUid for a player role
     */
    getFirebaseUid(matchId: string, role: 'A' | 'B'): string | null {
        const active = this.activeMatches.get(matchId);
        if (!active) return null;
        return role === 'A' ? active.firebaseUidA : active.firebaseUidB;
    }

    /**
     * List all active matches (for spectator lobby)
     */
    getActiveMatchesList() {
        const list: Array<{
            matchId: string;
            level: number;
            currentTurn: 'A' | 'B';
            attemptsA: number;
            attemptsB: number;
            timeRemainingA: number;
            timeRemainingB: number;
        }> = [];

        for (const [, m] of this.activeMatches) {
            // Only show matches that are actively being played (both secrets set)
            if (m.secretA && m.secretB) {
                list.push({
                    matchId: m.id,
                    level: m.level,
                    currentTurn: m.currentTurn,
                    attemptsA: m.attemptsA,
                    attemptsB: m.attemptsB,
                    timeRemainingA: m.timeRemainingA,
                    timeRemainingB: m.timeRemainingB,
                });
            }
        }
        return list;
    }

    /**
     * Get sanitized match state for a spectator (no secrets)
     */
    getSpectatorState(matchId: string) {
        const m = this.activeMatches.get(matchId);
        if (!m) return null;
        return {
            matchId: m.id,
            level: m.level,
            currentTurn: m.currentTurn,
            attemptsA: m.attemptsA,
            attemptsB: m.attemptsB,
            timeRemainingA: m.timeRemainingA,
            timeRemainingB: m.timeRemainingB,
        };
    }

    /**
     * Process a guess
     */
    async processGuess(matchId: string, player: 'A' | 'B', guess: string) {
        const active = this.activeMatches.get(matchId);
        if (!active) throw new Error('Match not found');

        if (active.currentTurn !== player) throw new Error('Not your turn');

        const validation = this.engine.validateGuess(guess);
        if (!validation.valid) throw new Error(validation.error);

        // Deduct time for current player
        const elapsed = Date.now() - active.lastTurnStartedAt;
        if (player === 'A') {
            active.timeRemainingA -= elapsed;
        } else {
            active.timeRemainingB -= elapsed;
        }

        // Check for timeout
        const timeRemaining = player === 'A' ? active.timeRemainingA : active.timeRemainingB;
        if (timeRemaining <= 0) {
            return this.endMatch(matchId, player === 'A' ? MatchResult.TIMEOUT_A : MatchResult.TIMEOUT_B);
        }

        // Calculate toques & famas
        const secret = player === 'A' ? active.secretB : active.secretA;
        const result = this.engine.processGuess(secret, guess);

        // Increment attempt count and record history
        const now = Date.now();
        if (player === 'A') {
            active.attemptsA++;
            active.historyA.push({ guess, toques: result.toques, famas: result.famas, timestamp: now });
        } else {
            active.attemptsB++;
            active.historyB.push({ guess, toques: result.toques, famas: result.famas, timestamp: now });
        }

        const attemptCount = player === 'A' ? active.attemptsA : active.attemptsB;

        // Persist attempt
        await this.prisma.matchAttempt.create({
            data: {
                matchId,
                player,
                guess,
                toques: result.toques,
                famas: result.famas,
                turnNumber: attemptCount,
            },
        });

        // Check for win (4 Famas)
        if (this.engine.isWinningGuess(secret, guess)) {
            // Check if opponent already guessed on their turn — both guessed = draw
            if (player === 'A' && active.playerBGuessed) {
                return this.endMatch(matchId, MatchResult.DRAW);
            }
            if (player === 'B' && active.playerAGuessed) {
                return this.endMatch(matchId, MatchResult.DRAW);
            }

            // Fairness: if this player went first this round (has more attempts),
            // the opponent deserves a last chance to equalize
            const opponentAttempts = player === 'A' ? active.attemptsB : active.attemptsA;
            if (attemptCount > opponentAttempts) {
                // Mark that this player guessed — give opponent one last turn
                if (player === 'A') active.playerAGuessed = true;
                else active.playerBGuessed = true;

                // Switch turn to opponent for their last chance
                active.currentTurn = player === 'A' ? 'B' : 'A';
                active.lastTurnStartedAt = Date.now();

                return {
                    type: 'last_chance' as const,
                    guess,
                    toques: result.toques,
                    famas: result.famas,
                    attemptNumber: attemptCount,
                    nextTurn: active.currentTurn,
                    timeRemainingA: active.timeRemainingA,
                    timeRemainingB: active.timeRemainingB,
                    guessedByPlayer: player,
                };
            }

            // Opponent already had equal or more attempts — win immediately
            return this.endMatch(matchId, player === 'A' ? MatchResult.PLAYER_A_WINS : MatchResult.PLAYER_B_WINS);
        }

        // Last chance failed — the player who guessed first wins
        if (player === 'A' && active.playerBGuessed) {
            return this.endMatch(matchId, MatchResult.PLAYER_B_WINS);
        }
        if (player === 'B' && active.playerAGuessed) {
            return this.endMatch(matchId, MatchResult.PLAYER_A_WINS);
        }

        // Check if both players exhausted attempts
        if (active.attemptsA >= MAX_ATTEMPTS && active.attemptsB >= MAX_ATTEMPTS) {
            return this.endMatch(matchId, MatchResult.DRAW);
        }

        // Switch turns
        active.currentTurn = player === 'A' ? 'B' : 'A';
        active.lastTurnStartedAt = Date.now();

        return {
            type: 'turn_result' as const,
            guess,
            toques: result.toques,
            famas: result.famas,
            attemptNumber: attemptCount,
            nextTurn: active.currentTurn,
            timeRemainingA: active.timeRemainingA,
            timeRemainingB: active.timeRemainingB,
        };
    }

    /**
     * Reset round-level state for next round in a multi-round series.
     */
    private resetRound(active: ActiveMatch) {
        active.currentRound++;
        active.secretA = '';
        active.secretB = '';
        active.attemptsA = 0;
        active.attemptsB = 0;
        active.historyA = [];
        active.historyB = [];
        active.playerAGuessed = false;
        active.playerBGuessed = false;
        active.timeRemainingA = active.initialTimeMs;
        active.timeRemainingB = active.initialTimeMs;
        active.lastTurnStartedAt = 0;
        // Alternate who goes first
        active.currentTurn = active.currentTurn === 'A' ? 'B' : 'A';
    }

    /**
     * End a match and settle finances.
     * All playerIds here are Prisma User.id (UUID).
     * For multi-round series: if the series is not yet decided,
     * returns a 'round_over' result instead of finalizing.
     */
    async endMatch(matchId: string, result: MatchResult) {
        const active = this.activeMatches.get(matchId);
        if (!active) throw new Error('Match not found');

        // --- Multi-round: check if this is a round win, not series end ---
        if (active.totalRounds > 1) {
            let roundWinner: 'A' | 'B' | null = null;
            if (result === MatchResult.PLAYER_A_WINS) roundWinner = 'A';
            else if (result === MatchResult.PLAYER_B_WINS) roundWinner = 'B';

            // Only do round progression for non-draw, non-timeout/abandon results
            // Draws in a round: no one gets a point, just start next round
            if (roundWinner || result === MatchResult.DRAW) {
                if (roundWinner === 'A') active.winsA++;
                if (roundWinner === 'B') active.winsB++;

                const winsNeeded = Math.ceil(active.totalRounds / 2);
                const roundsPlayed = active.currentRound;

                // Series NOT yet decided
                if (active.winsA < winsNeeded && active.winsB < winsNeeded && roundsPlayed < active.totalRounds) {
                    const roundResult = {
                        type: 'round_over' as const,
                        roundNumber: active.currentRound,
                        roundResult: result,
                        roundWinner,
                        winsA: active.winsA,
                        winsB: active.winsB,
                        totalRounds: active.totalRounds,
                        matchId,
                    };

                    // Reset for next round
                    this.resetRound(active);

                    return roundResult;
                }

                // Series decided — determine winner for final settlement
                if (active.winsA >= winsNeeded) {
                    result = MatchResult.PLAYER_A_WINS;
                } else if (active.winsB >= winsNeeded) {
                    result = MatchResult.PLAYER_B_WINS;
                } else {
                    // All rounds played, check who has more wins
                    if (active.winsA > active.winsB) result = MatchResult.PLAYER_A_WINS;
                    else if (active.winsB > active.winsA) result = MatchResult.PLAYER_B_WINS;
                    else result = MatchResult.DRAW; // True draw across all rounds
                }
            }
        }

        const config = getLevelConfig(active.level);
        const totalPot = active.betAmount * 2;
        const commission = Math.floor(totalPot * (config.commissionPercent / 100));

        let winnerPrize = 0;
        let winnerId: string | null = null;
        let loserId: string | null = null;

        switch (result) {
            case MatchResult.PLAYER_A_WINS:
                winnerId = active.playerAId;
                loserId = active.playerBId;
                winnerPrize = totalPot - commission;
                break;

            case MatchResult.PLAYER_B_WINS:
                winnerId = active.playerBId;
                loserId = active.playerAId;
                winnerPrize = totalPot - commission;
                break;

            case MatchResult.DRAW:
                await this.wallet.settleDraw(active.playerAId, active.playerBId, active.betAmount, active.currencyType);
                // Update gamesPlayed & reset streaks for both players
                await this.prisma.$transaction([
                    this.prisma.user.update({
                        where: { id: active.playerAId },
                        data: { gamesPlayed: { increment: 1 }, streakCurrent: 0 },
                    }),
                    this.prisma.user.update({
                        where: { id: active.playerBId },
                        data: { gamesPlayed: { increment: 1 }, streakCurrent: 0 },
                    }),
                ]);
                // Update ELO for draws (both get ~0 adjustment)
                await this.ranking.updateEloDraw(active.playerAId, active.playerBId);
                break;

            case MatchResult.TIMEOUT_A:
            case MatchResult.ABANDON_A:
                winnerId = active.playerBId;
                loserId = active.playerAId;
                winnerPrize = totalPot - commission;
                break;

            case MatchResult.TIMEOUT_B:
            case MatchResult.ABANDON_B:
                winnerId = active.playerAId;
                loserId = active.playerBId;
                winnerPrize = totalPot - commission;
                break;
        }

        if (winnerId && winnerPrize > 0) {
            await this.wallet.settleWin(winnerId, winnerPrize, active.currencyType, matchId);
        }

        // Update match in DB
        await this.prisma.match.update({
            where: { id: matchId },
            data: {
                status: MatchStatus.FINISHED,
                result,
                secretA: active.secretA,
                secretB: active.secretB,
                timeUsedA: (config.timeSeconds * 1000) - active.timeRemainingA,
                timeUsedB: (config.timeSeconds * 1000) - active.timeRemainingB,
                finishedAt: new Date(),
            },
        });

        // Update player stats (winner/loser — draws handled above)
        if (winnerId) {
            const winner = await this.prisma.user.findUnique({ where: { id: winnerId }, select: { streakCurrent: true, streakBest: true } });
            const newStreak = (winner?.streakCurrent ?? 0) + 1;
            await this.prisma.user.update({
                where: { id: winnerId },
                data: {
                    gamesPlayed: { increment: 1 },
                    gamesWon: { increment: 1 },
                    streakCurrent: newStreak,
                    streakBest: Math.max(winner?.streakBest ?? 0, newStreak),
                },
            });
        }
        if (loserId) {
            await this.prisma.user.update({
                where: { id: loserId },
                data: {
                    gamesPlayed: { increment: 1 },
                    streakCurrent: 0,
                },
            });
        }

        // Update ELO ratings
        if (winnerId && loserId) {
            await this.ranking.updateElo(winnerId, loserId);
        }

        // Post-match progression: XP + Achievements
        try {
            if (winnerId && loserId) {
                await this.usersService.postMatchProgression(winnerId, 'WIN');
                await this.usersService.postMatchProgression(loserId, 'LOSS');
            } else if (result === MatchResult.DRAW) {
                await this.usersService.postMatchProgression(active.playerAId, 'DRAW');
                await this.usersService.postMatchProgression(active.playerBId, 'DRAW');
            }
        } catch (err) {
            this.logger.error(`Post-match progression failed for match ${matchId}:`, err);
        }

        // Remove from active matches
        this.activeMatches.delete(matchId);

        this.logger.log(`Match ${matchId} ended: ${result}`);

        // Resolve winnerFirebaseUid for client-side comparison
        let winnerFirebaseUid: string | null = null;
        if (winnerId === active.playerAId) winnerFirebaseUid = active.firebaseUidA;
        else if (winnerId === active.playerBId) winnerFirebaseUid = active.firebaseUidB;

        return {
            type: 'game_over' as const,
            result,
            winnerId,
            loserId,
            winnerPrize,
            winnerFirebaseUid,
            commission,
            firebaseUidA: active.firebaseUidA,
            firebaseUidB: active.firebaseUidB,
            secretA: active.secretA,
            secretB: active.secretB,
            usernameA: active.usernameA,
            usernameB: active.usernameB,
            avatarA: active.avatarA,
            avatarB: active.avatarB,
        };
    }

    /**
     * Handle player disconnection / surrender
     */
    async handleDisconnect(matchId: string, disconnectedPlayer: 'A' | 'B') {
        return this.endMatch(
            matchId,
            disconnectedPlayer === 'A' ? MatchResult.ABANDON_A : MatchResult.ABANDON_B,
        );
    }

    /**
     * Handle turn timeout — the current player ran out of time.
     */
    async handleTurnTimeout(matchId: string, timedOutPlayer: 'A' | 'B') {
        const active = this.activeMatches.get(matchId);
        if (!active) return null;

        // Zero out remaining time for the timed-out player
        if (timedOutPlayer === 'A') {
            active.timeRemainingA = 0;
        } else {
            active.timeRemainingB = 0;
        }

        return this.endMatch(
            matchId,
            timedOutPlayer === 'A' ? MatchResult.TIMEOUT_A : MatchResult.TIMEOUT_B,
        );
    }

    /**
     * End match as a draw (both players agree)
     */
    async endMatchAsDraw(matchId: string) {
        return this.endMatch(matchId, MatchResult.DRAW);
    }

    getActiveMatch(matchId: string) {
        return this.activeMatches.get(matchId);
    }
}
