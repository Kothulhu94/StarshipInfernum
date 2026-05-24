import { Card, Suit } from '@cardEngine/cardDefinitions';
import { Deck } from '@cardEngine/deckManager';
import { MajorCrisisState, MinorCrisisState, MajorCrisisType, MinorCrisisType } from './crisisTypes';

/**
 * Sets up the Major and Minor Crises and configures the Jokers on them at the start of the game.
 *
 * Rules:
 *  1. Remove a single Ace (Major Crisis card) from the Survival Deck.
 *  2. Remove one random card (Minor Crisis card) from the Survival Deck.
 *  3. Count out Jokers equal to (numPlayers - 1) [since Dealer is not a player, this is numPCs].
 *     - Shuffle 1 Joker face up into the Survival Deck.
 *     - Place 1 Joker on the Minor Crisis card.
 *     - Place the rest of the Jokers (numPlayers - 2) on the Major Crisis card.
 */
export function setupCrisesAndJokers(
  majorId: MajorCrisisType,
  minorId: MinorCrisisType,
  numPlayers: number,
  survivalDeck: Deck
): {
  majorState: MajorCrisisState;
  minorState: MinorCrisisState;
  majorCard: Card;
  minorCard: Card;
} {
  // Find and remove an Ace for the Major Crisis
  let majorCard: Card | null = null;
  const suits = [Suit.HEARTS, Suit.SPADES, Suit.DIAMONDS, Suit.CLUBS];
  for (const suit of suits) {
    majorCard = survivalDeck.removeCard('A', suit);
    if (majorCard) break;
  }
  if (!majorCard) {
    majorCard = { suit: Suit.SPADES, rank: 'A', faceUp: true };
  }

  // Find and remove a random card (e.g. a 10 or King) for the Minor Crisis
  let minorCard: Card | null = null;
  // Let's remove a King
  for (const suit of suits) {
    minorCard = survivalDeck.removeCard('K', suit);
    if (minorCard) break;
  }
  if (!minorCard) {
    minorCard = { suit: Suit.DIAMONDS, rank: 'K', faceUp: true };
  }

  // Count out Jokers equal to players (excluding dealer, so number of PCs)
  // Let's assume numPlayers passed is number of PCs.
  const totalJokers = numPlayers;

  // Setup Jokers distribution
  // 1 Joker in Survival Deck
  survivalDeck.insertJoker(true);

  // 1 Joker on Minor Crisis
  const minorJokers = 1;

  // Rest on Major Crisis
  const majorJokers = Math.max(1, totalJokers - 2);

  const majorState: MajorCrisisState = {
    id: majorId,
    jokersRemaining: majorJokers,
    jokersTotal: majorJokers,
    isUnlocked: majorJokers === 0, // Unlocked immediately if 0 jokers
    isResolved: false
  };

  const minorState: MinorCrisisState = {
    id: minorId,
    jokersRemaining: minorJokers,
    isResolved: false
  };

  return {
    majorState,
    minorState,
    majorCard,
    minorCard
  };
}

/**
 * Evaluates crisis card unlocking state.
 * Major Crisis is unlocked when all Jokers are removed from it.
 */
export function checkCrisisUnlocked(majorState: MajorCrisisState): void {
  if (majorState.jokersRemaining <= 0) {
    majorState.isUnlocked = true;
  }
}

/**
 * Handles a successful Crisis Test: removes 1 Joker from the relevant crisis card.
 */
export function onCrisisTestSuccess(crisisState: MajorCrisisState | MinorCrisisState): void {
  if (crisisState.jokersRemaining > 0) {
    crisisState.jokersRemaining--;
  }
  if ('isUnlocked' in crisisState) {
    checkCrisisUnlocked(crisisState as MajorCrisisState);
  }
}

/**
 * Handles a busted Crisis Test: removes 1 Joker from the crisis card and shuffles it into the deck.
 */
export function onCrisisTestBust(crisisState: MajorCrisisState | MinorCrisisState, survivalDeck: Deck): void {
  if (crisisState.jokersRemaining > 0) {
    crisisState.jokersRemaining--;
    // Shuffle the Joker face up into the Survival Deck
    survivalDeck.insertJoker(true);
  }
  if ('isUnlocked' in crisisState) {
    checkCrisisUnlocked(crisisState as MajorCrisisState);
  }
}

/**
 * Returns true if a card drawn is a Joker, which triggers a Disaster.
 */
export function isDisasterTrigger(card: Card): boolean {
  return !!card.isJoker;
}

/**
 * Handles final crisis card resolution.
 * When the final test is won on the crisis card itself:
 *  1. Mark crisis as resolved.
 *  2. Remove ALL Jokers from the Survival Deck.
 *  3. Return the original crisis card (Ace or King) to the deck and reshuffle.
 */
export function resolveCrisisCard(
  crisisState: MajorCrisisState | MinorCrisisState,
  crisisCard: Card,
  survivalDeck: Deck
): void {
  crisisState.isResolved = true;

  // Remove all Jokers from the deck
  survivalDeck.removeJokers();

  // Put original card back (make it face down)
  const cardToReturn = { ...crisisCard, faceUp: false };
  // Since Deck draw/reset handles cards internally, let's cast or push it back
  const deckCards = (survivalDeck as any).cards as Card[];
  if (Array.isArray(deckCards)) {
    deckCards.push(cardToReturn);
  }

  // Reshuffle the Survival Deck
  survivalDeck.shuffle();
}
