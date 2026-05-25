import { Character } from '@characterSystem/characterTypes';
import { Card, cardValue } from '@cardEngine/cardDefinitions';
import { evaluateHand } from '@cardEngine/handEvaluator';
import {
  canShapeshifterSwap,
  canSmugglerSwap,
} from '@characterSystem/aptitudeExecutor';
import { PlayerAction } from '@characterSystem/playerActionModel';

export interface NPCDecisionContext {
  playerHand: Card[];
  dealerHand: Card[];
  canUseTrait: boolean;
  hasUsedShapeshifterSwap: boolean;
  hasUsedSmugglerSwap: boolean;
}

export type NPCDecisionResult = PlayerAction;

/**
 * Heuristic engine for AI NPC blackjack actions, trait usage, and swaps.
 */
export function getNPCDecision(
  character: Character,
  context: NPCDecisionContext
): NPCDecisionResult {
  const { playerHand, dealerHand, canUseTrait, hasUsedShapeshifterSwap, hasUsedSmugglerSwap } = context;

  const playerEval = evaluateHand(playerHand);
  const dealerFaceUpCard = dealerHand[1]; // Typically index 1 is face up

  // 1. Check for Shapeshifter Swap opportunity
  if (canShapeshifterSwap(character, hasUsedShapeshifterSwap) && playerHand.length > 0 && dealerFaceUpCard) {
    const lastCardVal = cardValue(playerHand[playerHand.length - 1]);
    const dealerCardVal = cardValue(dealerFaceUpCard);

    // Swap if we are busted and swapping saves us, OR if our hand is weak (12-16) and the dealer's card helps us get to 18-21
    if (playerEval.isBust) {
      const swappedTotal = playerEval.total - lastCardVal + dealerCardVal;
      if (swappedTotal <= 21) {
        return { type: 'SHAPESHIFTER_SWAP' };
      }
    } else if (playerEval.total >= 12 && playerEval.total <= 16) {
      const swappedTotal = playerEval.total - lastCardVal + dealerCardVal;
      if (swappedTotal >= 18 && swappedTotal <= 21) {
        return { type: 'SHAPESHIFTER_SWAP' };
      }
    }
  }

  // 2. Check for Smuggler Swap opportunity (swap with pocket card in ghostCard)
  if (canSmugglerSwap(character, hasUsedSmugglerSwap) && playerHand.length > 0 && character.ghostCard) {
    const lastCardVal = cardValue(playerHand[playerHand.length - 1]);
    const pocketCardVal = cardValue({
      suit: character.ghostCard.suit as any,
      rank: character.ghostCard.rank as any,
      faceUp: true
    });

    if (playerEval.isBust) {
      const swappedTotal = playerEval.total - lastCardVal + pocketCardVal;
      if (swappedTotal <= 21) {
        return { type: 'SMUGGLER_SWAP' };
      }
    } else if (playerEval.total >= 12 && playerEval.total <= 16) {
      const swappedTotal = playerEval.total - lastCardVal + pocketCardVal;
      if (swappedTotal >= 18 && swappedTotal <= 21) {
        return { type: 'SMUGGLER_SWAP' };
      }
    }
  }

  // 3. Handle Bust mitigation with Traits
  if (playerEval.isBust && canUseTrait) {
    const availableTraits = character.traits.filter((t) => !t.exhausted && !t.busted);
    // Sort traits by modifier magnitude ascending to save larger modifiers
    const sortedTraits = [...availableTraits].sort((a, b) => a.modifier - b.modifier);

    for (const trait of sortedTraits) {
      // Subtracting modifier to mitigate bust
      if (playerEval.total - trait.modifier <= 21) {
        return { type: 'TRAIT', traitName: trait.name };
      }
    }
    // Cannot save from bust, must stand and accept the fate
    return 'STAND';
  }

  // 4. Determine Risk Tolerance
  const risk = character.aiProfile?.riskTolerance ?? 'balanced';
  let standThreshold = 17;
  let alwaysHitThreshold = 11;

  if (risk === 'cautious') {
    standThreshold = 16;
    alwaysHitThreshold = 11;
  } else if (risk === 'reckless') {
    standThreshold = 18;
    alwaysHitThreshold = 15;
  }

  // Stand threshold
  if (playerEval.total >= standThreshold) {
    return 'STAND';
  }

  // Always hit threshold
  if (playerEval.total <= alwaysHitThreshold) {
    return 'HIT';
  }

  // Intermediate zone: Try to use a trait to reach standThreshold - 21
  if (canUseTrait) {
    const availableTraits = character.traits.filter((t) => !t.exhausted && !t.busted);
    const sortedTraits = [...availableTraits].sort((a, b) => a.modifier - b.modifier);

    for (const trait of sortedTraits) {
      const potentialTotal = playerEval.total + trait.modifier;
      if (potentialTotal >= standThreshold && potentialTotal <= 21) {
        return { type: 'TRAIT', traitName: trait.name };
      }
    }
  }

  // Check Dealer's face-up card if visible
  if (dealerFaceUpCard) {
    const dVal = cardValue(dealerFaceUpCard);
    // Hit if dealer card is strong, or if reckless
    if (dVal >= 7 || risk === 'reckless') {
      return 'HIT';
    }
  }

  // Default to Stand
  return 'STAND';
}
