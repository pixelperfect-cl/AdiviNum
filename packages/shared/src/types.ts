// ============================================================
// AdiviNum — Shared Types
// ============================================================

// ---- Users ----
export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  currentLevel: number;
  eloRating: number;
  createdAt: Date;
}

// ---- Wallet ----
export type CurrencyType = 'fiat' | 'virtual';

export interface Wallet {
  id: string;
  userId: string;
  balanceFiat: number;       // CLP
  balanceVirtual: number;    // Demo coins
  balanceSavings: number;    // Cuenta de ahorro
}

export interface Transaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  currencyType: CurrencyType;
  description: string;
  createdAt: Date;
}

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'bet_hold'
  | 'bet_release'
  | 'winnings'
  | 'commission'
  | 'referral_bonus'
  | 'gift_sent'
  | 'gift_received';

// ---- Game ----
export interface AttemptResult {
  guess: string;           // 4-digit string e.g. "1234"
  toques: number;          // Correct digit, wrong position
  famas: number;           // Correct digit, correct position
  timestamp: number;
}

export type MatchStatus =
  | 'waiting'
  | 'coin_flip'
  | 'in_progress'
  | 'finished'
  | 'abandoned';

export type MatchResult =
  | 'player_a_wins'
  | 'player_b_wins'
  | 'draw'
  | 'timeout_a'
  | 'timeout_b'
  | 'abandon_a'
  | 'abandon_b';

export interface Match {
  id: string;
  level: number;
  betAmount: number;
  currencyType: CurrencyType;
  playerAId: string;
  playerBId: string;
  status: MatchStatus;
  result: MatchResult | null;
  currentTurn: 'A' | 'B';
  attemptsA: AttemptResult[];
  attemptsB: AttemptResult[];
  timeRemainingA: number;  // ms
  timeRemainingB: number;  // ms
  createdAt: Date;
}

// ---- Levels ----
export interface LevelConfig {
  level: number;
  betAmountCLP: number;       // default bet (middle option)
  betOptions: number[];       // available bet amounts for this level
  commissionPercent: number;
  prizeToWinner: number;      // prize at default bet
  timeSeconds: number;
  color: string;
  colorHex: string;
  unlockGamesPlayed: number;
  unlockGamesWon: number;
}

// ---- Rankings ----
export type RankName =
  | 'Novato del Número'
  | 'Cazador de Famas'
  | 'Matemático Callejero'
  | 'Lógico Competitivo'
  | 'Maestro del Toque'
  | 'Señor de la Deducción'
  | 'Mente Maestra'
  | 'Supremo Adivinum';

export interface RankConfig {
  name: RankName;
  color: string;
  colorHex: string;
  minElo: number;
  maxElo: number;
}

// ---- WebSocket Events ----
export enum GameEvent {
  // Client -> Server
  JOIN_QUEUE = 'join_queue',
  LEAVE_QUEUE = 'leave_queue',
  SET_SECRET = 'set_secret',
  MAKE_GUESS = 'make_guess',
  SEND_CHAT = 'send_chat',
  SURRENDER = 'surrender',
  OFFER_DRAW = 'offer_draw',
  RESPOND_DRAW = 'respond_draw',
  REQUEST_REMATCH = 'request_rematch',
  RESPOND_REMATCH = 'respond_rematch',
  LIST_MATCHES = 'list_matches',
  SPECTATE_MATCH = 'spectate_match',
  LEAVE_SPECTATE = 'leave_spectate',
  SEND_CHALLENGE = 'send_challenge',
  RESPOND_CHALLENGE = 'respond_challenge',

  // Server -> Client
  MATCH_FOUND = 'match_found',
  COIN_FLIP = 'coin_flip',
  GAME_START = 'game_start',
  TURN_RESULT = 'turn_result',
  TIMER_UPDATE = 'timer_update',
  GAME_OVER = 'game_over',
  CHAT_MESSAGE = 'chat_message',
  DRAW_OFFERED = 'draw_offered',
  DRAW_DECLINED = 'draw_declined',
  REMATCH_OFFERED = 'rematch_offered',
  REMATCH_DECLINED = 'rematch_declined',
  ACTIVE_MATCHES = 'active_matches',
  SPECTATE_STATE = 'spectate_state',
  SPECTATE_UPDATE = 'spectate_update',
  SPECTATE_GAME_OVER = 'spectate_game_over',
  OPPONENT_DISCONNECTED = 'opponent_disconnected',
  SECRET_TIMER = 'secret_timer',
  RECONNECT_STATE = 'reconnect_state',
  OPPONENT_RECONNECTED = 'opponent_reconnected',
  RECONNECT_COUNTDOWN = 'reconnect_countdown',
  CHALLENGE_RECEIVED = 'challenge_received',
  CHALLENGE_ACCEPTED = 'challenge_accepted',
  CHALLENGE_DECLINED = 'challenge_declined',
  LAST_CHANCE = 'last_chance',
  SECRET_TIMEOUT = 'secret_timeout',
  ERROR = 'game_error',
}
