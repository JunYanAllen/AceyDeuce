export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = '2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'10'|'J'|'Q'|'K'|'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
}

/** Game outcome for a single round */
export type Outcome = 'win' | 'post' | 'range' | 'triple' | 'forfeit';

export interface HandState {
  pillar1: Card;
  pillar2: Card;
  middleCard: Card | null;
  bet: number;
  forfeited: boolean;
  outcome: Outcome | null;
  delta: number;
}

export interface Player {
  id: string;
  name: string;
  chips: number;
  delta: number;
  isActive: boolean;
}

export interface HistoryEntry {
  roundNum: number;
  playerName: string;
  pillar1: Card;
  pillar2: Card;
  middleCard: Card | null;
  bet: number;
  outcome: Outcome;
  delta: number;
  potAfter: number;
}

export type RoomStatus = 'waiting' | 'active' | 'finished';
export type GamePhase = 'waiting' | 'betting' | 'result';

export interface Room {
  id: string;
  name: string;
  hostId: string;
  status: RoomStatus;
  players: Player[];
  deck: Card[];
  pot: number;
  currentPlayerIdx: number;
  roundNum: number;
  phase: GamePhase;
  hand: HandState | null;
  history: HistoryEntry[];
  minBet: number;
  maxPlayers: number;
  /** Chips each player contributes to the pot when the game starts (0 = none) */
  potPerPlayer: number;
  createdAt: number;
}

/** Lightweight room info returned by lobby listing */
export interface RoomSummary {
  id: string;
  name: string;
  status: RoomStatus;
  playerCount: number;
  maxPlayers: number;
  createdAt: number;
}
