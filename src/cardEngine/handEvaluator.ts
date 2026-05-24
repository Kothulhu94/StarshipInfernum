import { Card } from './cardDefinitions';

export interface HandResult {
  total: number;
  isSoft: boolean;
  isBust: boolean;
  isNatural21: boolean;
}

export function evaluateHand(cards: Card[]): HandResult {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.rank === 'A') {
      aces++;
      total += 11;
    } else if (['J', 'Q', 'K'].includes(card.rank)) {
      total += 10;
    } else {
      total += parseInt(card.rank, 10);
    }
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  const isSoft = aces > 0;
  const isBust = total > 21;
  const isNatural21 = cards.length === 2 && total === 21;

  return { total, isSoft, isBust, isNatural21 };
}
