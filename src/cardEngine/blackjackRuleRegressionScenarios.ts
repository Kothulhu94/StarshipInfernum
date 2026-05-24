import { Card, Rank, Suit } from './cardDefinitions';

export type BlackjackRegressionScenarioName =
  | 'player-natural-21'
  | 'push-without-rising-tension'
  | 'dealer-win-adds-rising-tension'
  | 'trait-mitigates-bust';

export interface BlackjackRuleRegressionScenario {
  name: BlackjackRegressionScenarioName;
  playerHand: Card[];
  dealerHand: Card[];
  traitModifier?: number;
  expectedPlayerTotal: number;
  expectedDealerTotal: number;
  expectedOutcome: 'WIN' | 'LOSE' | 'PUSH' | 'BUST';
  expectedTensionDelta: 0 | 1;
}

function card(rank: Rank, suit: Suit, faceUp: boolean = true): Card {
  return { rank, suit, faceUp };
}

export const blackjackRuleRegressionScenarios: BlackjackRuleRegressionScenario[] = [
  {
    name: 'player-natural-21',
    playerHand: [card('A', Suit.HEARTS), card('K', Suit.SPADES)],
    dealerHand: [card('9', Suit.CLUBS), card('7', Suit.DIAMONDS)],
    expectedPlayerTotal: 21,
    expectedDealerTotal: 16,
    expectedOutcome: 'WIN',
    expectedTensionDelta: 0
  },
  {
    name: 'push-without-rising-tension',
    playerHand: [card('10', Suit.HEARTS), card('8', Suit.SPADES)],
    dealerHand: [card('9', Suit.CLUBS), card('9', Suit.DIAMONDS)],
    expectedPlayerTotal: 18,
    expectedDealerTotal: 18,
    expectedOutcome: 'PUSH',
    expectedTensionDelta: 0
  },
  {
    name: 'dealer-win-adds-rising-tension',
    playerHand: [card('10', Suit.HEARTS), card('7', Suit.SPADES)],
    dealerHand: [card('10', Suit.CLUBS), card('8', Suit.DIAMONDS)],
    expectedPlayerTotal: 17,
    expectedDealerTotal: 18,
    expectedOutcome: 'LOSE',
    expectedTensionDelta: 1
  },
  {
    name: 'trait-mitigates-bust',
    playerHand: [card('10', Suit.HEARTS), card('9', Suit.SPADES), card('5', Suit.CLUBS)],
    dealerHand: [card('8', Suit.CLUBS), card('7', Suit.DIAMONDS)],
    traitModifier: -3,
    expectedPlayerTotal: 21,
    expectedDealerTotal: 15,
    expectedOutcome: 'WIN',
    expectedTensionDelta: 0
  }
];
