import type { Card, Rank, Suit, Outcome } from './types';

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];
const RANKS: Rank[] = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const VALUES: Record<string, number> = {
  '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,
  'J':11,'Q':12,'K':13,'A':14,
};

/** Build a full single deck of 52 cards. We use 3 decks total. */
export function buildDeck(): Card[] {
  const deck: Card[] = [];
  for (let d = 0; d < 3; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ suit, rank, value: VALUES[rank] });
      }
    }
  }
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const a = [...deck];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pop one card from the deck (from the end).
 * If the deck is nearly empty, reshuffle a fresh 3-deck shoe.
 */
export function popCard(deck: Card[]): [Card, Card[]] {
  let d = deck;
  if (d.length < 3) d = shuffleDeck(buildDeck());
  const card = d[d.length - 1];
  return [card, d.slice(0, d.length - 1)];
}

/**
 * Resolve the outcome of a round given two pillars, the middle card,
 * the amount bet, and the current pot.
 *
 * Rules:
 *  - All three same value      → triple  (lose 3× bet)
 *  - Middle = either pillar    → post    (lose 3× bet)
 *  - Middle strictly between   → win     (win min(bet, pot))
 *  - Otherwise                 → range   (lose 1× bet)
 */
export function resolveOutcome(
  p1: Card,
  p2: Card,
  middle: Card,
  bet: number,
  pot: number,
): { outcome: Outcome; delta: number; potDelta: number } {
  const lo = Math.min(p1.value, p2.value);
  const hi = Math.max(p1.value, p2.value);
  const mv = middle.value;

  if (p1.value === p2.value && mv === p1.value) {
    return { outcome: 'triple', delta: -(bet * 3), potDelta: bet * 3 };
  }
  if (mv === lo || mv === hi) {
    return { outcome: 'post', delta: -(bet * 3), potDelta: bet * 3 };
  }
  if (mv > lo && mv < hi) {
    const win = Math.min(bet, pot);
    return { outcome: 'win', delta: win, potDelta: -win };
  }
  return { outcome: 'range', delta: -bet, potDelta: bet };
}

/** Short random ID — uppercase alphanumeric. */
export function generateId(length = 6): string {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
}
