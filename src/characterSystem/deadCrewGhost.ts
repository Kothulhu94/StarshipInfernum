import { Character } from './characterTypes';
import { Card } from '@cardEngine/cardDefinitions';

/**
 * Initializes a deceased character as a ghost, selecting a card to hold from the killing hand.
 * @param deadChar The character who died.
 * @param playerHand The player's final hand.
 * @param dealerHand The dealer's final hand.
 * @param choiceIndex Optional choice index from the combined hands.
 */
export function initializeGhost(
  deadChar: Character,
  playerHand: Card[],
  dealerHand: Card[],
  choiceIndex: number = 0
): void {
  deadChar.isDead = true;

  // Collect all unique cards from the hands
  const availableCards: Card[] = [...playerHand, ...dealerHand];

  if (availableCards.length > 0) {
    const selected = availableCards[choiceIndex] || availableCards[0];
    deadChar.ghostCard = {
      suit: selected.suit,
      rank: selected.rank
    };
  } else {
    // Fallback card if hands were somehow empty
    deadChar.ghostCard = {
      suit: 'SPADES',
      rank: 'A'
    };
  }
}

/**
 * Checks if a dead PC can perform a card swap for a living PC.
 */
export function canGhostSwap(
  deadChar: Character,
  livingChar: Character,
  hasSwappedThisTest: boolean
): boolean {
  return (
    deadChar.isDead &&
    !livingChar.isDead &&
    !!deadChar.ghostCard &&
    !hasSwappedThisTest
  );
}

/**
 * Executes the ghost flashback card swap.
 * Swaps the ghost's held card with the last card in the living player's hand.
 * Returns the card that was given to the living player.
 */
export function executeGhostSwap(deadChar: Character, livingHand: Card[]): Card | null {
  if (!deadChar.ghostCard || livingHand.length === 0) {
    return null;
  }

  // Convert the stored ghost card representation into a full Card object
  const cardToGive: Card = {
    suit: deadChar.ghostCard.suit as any,
    rank: deadChar.ghostCard.rank as any,
    faceUp: true
  };

  // Get the last card dealt to the living player
  const lastPlayerCard = livingHand[livingHand.length - 1];

  // Perform swap
  livingHand[livingHand.length - 1] = cardToGive;

  // Store the living player's card as the ghost's new held card
  deadChar.ghostCard = {
    suit: lastPlayerCard.suit,
    rank: lastPlayerCard.rank
  };

  return cardToGive;
}
