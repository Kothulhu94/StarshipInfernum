import { Card } from './cardDefinitions';
import { Deck } from './deckManager';
import { evaluateHand, HandResult } from './handEvaluator';
import {
  comparePlayerAndDealer,
  evaluatePlayerHand,
  revealDealerHoleCard,
  shouldDealerHit
} from './blackjackTestSemantics';

export type RoundOutcome = 'WIN' | 'LOSE' | 'PUSH' | 'BUST';

export interface PlayerRoundResult {
  playerId: string;
  outcome: RoundOutcome;
  playerTotal: number;
  dealerTotal: number;
}

export class BlackjackRound {
  private playerHands: Map<string, Card[]> = new Map();
  private dealerHand: Card[] = [];
  private playerModifiers: Map<string, number> = new Map();
  private playerStood: Map<string, boolean> = new Map();

  constructor(private deck: Deck) {}

  /**
   * Initializes a round by dealing 2 starting cards to each player (face-up)
   * and 2 cards to the dealer (first face-down, second face-up).
   */
  public startRound(playerIds: string[], startingCardsPerPlayer: Map<string, number> = new Map()): void {
    this.playerHands.clear();
    this.dealerHand = [];
    this.playerModifiers.clear();
    this.playerStood.clear();

    // Deal cards to players
    for (const playerId of playerIds) {
      const cardsToDeal = startingCardsPerPlayer.get(playerId) || 2;
      const hand: Card[] = [];
      for (let i = 0; i < cardsToDeal; i++) {
        const card = this.deck.draw();
        card.faceUp = true;
        hand.push(card);
      }
      this.playerHands.set(playerId, hand);
      this.playerModifiers.set(playerId, 0);
      this.playerStood.set(playerId, false);
    }

    // Deal cards to dealer
    const d1 = this.deck.draw();
    d1.faceUp = false;
    const d2 = this.deck.draw();
    d2.faceUp = true;
    this.dealerHand.push(d1, d2);
  }

  /**
   * Gets a player's current hand.
   */
  public getPlayerHand(playerId: string): Card[] {
    return this.playerHands.get(playerId) || [];
  }

  /**
   * Gets the dealer's current hand.
   */
  public getDealerHand(): Card[] {
    return this.dealerHand;
  }

  /**
   * Evaluates a player's current hand, including any applied trait modifiers.
   */
  public evaluatePlayer(playerId: string): HandResult {
    const hand = this.getPlayerHand(playerId);
    const mod = this.playerModifiers.get(playerId) || 0;
    return evaluatePlayerHand(hand, mod);
  }

  /**
   * Evaluates the dealer's current hand, assuming the face-down card is visible.
   */
  public evaluateDealer(revealFaceDown: boolean = false): HandResult {
    const hand = this.dealerHand.map((c, i) => {
      if (i === 0 && !revealFaceDown) {
        return { ...c, faceUp: true }; // Treat as face-up for calculation purposes
      }
      return c;
    });
    return evaluateHand(hand);
  }

  /**
   * Hits for a player: draws a card, places it face-up, and returns current hand evaluation.
   */
  public hitPlayer(playerId: string): HandResult {
    if (this.playerStood.get(playerId)) {
      throw new Error(`Player ${playerId} has already stood`);
    }

    const hand = this.getPlayerHand(playerId);
    const card = this.deck.draw();
    card.faceUp = true;
    hand.push(card);

    return this.evaluatePlayer(playerId);
  }

  /**
   * Stands a player, optionally applying a trait score modifier (e.g. +3, -2).
   */
  public standPlayer(playerId: string, traitModifier: number = 0): HandResult {
    this.playerStood.set(playerId, true);
    if (traitModifier !== 0) {
      this.playerModifiers.set(playerId, traitModifier);
    }
    return this.evaluatePlayer(playerId);
  }

  /**
   * Plays out the dealer's hand.
   * @param isGroupTest If true, uses standard group rules (hit on <=16, stand on >=17).
   *                    If false, hits to beat/tie the target score.
   * @param targetScore The score the dealer is trying to beat (ignored if isGroupTest is true).
   */
  public playDealer(isGroupTest: boolean = false, targetScore: number = 0): HandResult {
    revealDealerHoleCard(this.dealerHand);

    let dealerEval = evaluateHand(this.dealerHand);
    const mode = isGroupTest ? 'stand-on-17' : 'solo-target';

    while (shouldDealerHit(dealerEval, mode, targetScore)) {
      const card = this.deck.draw();
      card.faceUp = true;
      this.dealerHand.push(card);
      dealerEval = evaluateHand(this.dealerHand);
    }

    return dealerEval;
  }

  /**
   * Computes the round outcomes for all active players.
   */
  public resolveOutcomes(): Map<string, PlayerRoundResult> {
    const results = new Map<string, PlayerRoundResult>();
    const dealerEval = evaluateHand(this.dealerHand);

    for (const [playerId, _hand] of this.playerHands) {
      const playerEval = this.evaluatePlayer(playerId);
      const outcome = comparePlayerAndDealer(playerEval, dealerEval);

      results.set(playerId, {
        playerId,
        outcome,
        playerTotal: playerEval.total,
        dealerTotal: dealerEval.total
      });
    }

    return results;
  }
}
