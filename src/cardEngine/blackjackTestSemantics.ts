import { Character, Trait } from '@characterSystem/characterTypes';
import { canUseTraitModifier } from '@characterSystem/playerActionModel';
import { Card } from './cardDefinitions';
import { Deck } from './deckManager';
import { evaluateHand, HandResult } from './handEvaluator';

export type DealerPlayMode = 'solo-target' | 'stand-on-17';
export type BlackjackRoundOutcome = 'WIN' | 'LOSE' | 'PUSH' | 'BUST';

export interface BlackjackParticipantState {
  hand: Card[];
  evaluation: HandResult;
  appliedTraitModifier: number;
  traitsExhausted: string[];
}

export interface DealerOpeningHand {
  hand: Card[];
  holeCard: Card;
}

export interface BlackjackInterventionHooks {
  canUseTrait?: (character: Character, trait: Trait, hand: Card[]) => boolean;
}

export function dealFaceUpCards(deck: Deck, count: number): Card[] {
  const hand: Card[] = [];
  for (let i = 0; i < count; i++) {
    const card = deck.draw();
    card.faceUp = true;
    hand.push(card);
  }
  return hand;
}

export function dealPlayerOpeningHand(deck: Deck, tension: number): Card[] {
  return dealFaceUpCards(deck, 2 + tension);
}

export function dealDealerOpeningHand(deck: Deck): DealerOpeningHand {
  const holeCard = deck.draw();
  holeCard.faceUp = false;
  const upCard = deck.draw();
  upCard.faceUp = true;

  return {
    hand: [holeCard, upCard],
    holeCard
  };
}

export function evaluateDealerOpeningHand(dealerHand: Card[]): HandResult {
  return evaluateHand(dealerHand.map(card => ({ ...card, faceUp: true })));
}

export function revealDealerHoleCard(dealerHand: Card[]): void {
  if (dealerHand.length > 0) {
    dealerHand[0].faceUp = true;
  }
}

export function evaluatePlayerHand(hand: Card[], traitModifier: number = 0): HandResult {
  const raw = evaluateHand(hand);
  const total = raw.total + traitModifier;

  return {
    total,
    isSoft: raw.isSoft,
    isBust: total > 21,
    isNatural21: raw.isNatural21 && traitModifier === 0
  };
}

export function createParticipantState(hand: Card[]): BlackjackParticipantState {
  return {
    hand,
    evaluation: evaluatePlayerHand(hand),
    appliedTraitModifier: 0,
    traitsExhausted: []
  };
}

export function addPlayerHit(deck: Deck, state: BlackjackParticipantState): HandResult {
  const card = deck.draw();
  card.faceUp = true;
  state.hand.push(card);
  state.evaluation = evaluatePlayerHand(state.hand, state.appliedTraitModifier);
  return state.evaluation;
}

export function findUsableTrait(
  character: Character,
  traitName: string,
  hand: Card[],
  hooks: BlackjackInterventionHooks = {}
): Trait | undefined {
  if (!canUseTraitModifier(character, true)) {
    return undefined;
  }

  return character.traits.find(trait => {
    if (trait.name !== traitName || trait.exhausted || trait.busted) {
      return false;
    }
    return hooks.canUseTrait ? hooks.canUseTrait(character, trait, hand) : true;
  });
}

export function hasUsableTrait(
  character: Character,
  hand: Card[],
  hooks: BlackjackInterventionHooks = {}
): boolean {
  if (!canUseTraitModifier(character, true)) {
    return false;
  }

  return character.traits.some(trait => {
    if (trait.exhausted || trait.busted) {
      return false;
    }
    return hooks.canUseTrait ? hooks.canUseTrait(character, trait, hand) : true;
  });
}

/**
 * Returns true only if at least one available trait would actually bring
 * the player's current total down to 21 or below (i.e. genuinely un-bust them).
 * Used to decide whether to offer the bust-mitigation prompt at all.
 */
export function hasBustMitigatingTrait(
  character: Character,
  currentTotal: number
): boolean {
  if (!canUseTraitModifier(character, true)) {
    return false;
  }

  return character.traits.some(trait => {
    if (trait.exhausted || trait.busted) {
      return false;
    }
    // Only negative modifiers can reduce a bust; check if applying it fixes the total
    return currentTotal - Math.abs(trait.modifier) <= 21;
  });
}

export function exhaustTraitForHand(
  state: BlackjackParticipantState,
  trait: Trait
): HandResult {
  trait.exhausted = true;
  state.traitsExhausted.push(trait.name);
  state.appliedTraitModifier = trait.modifier;
  state.evaluation = evaluatePlayerHand(state.hand, state.appliedTraitModifier);
  return state.evaluation;
}

export function recoverOneExhaustedTrait(character: Character): string | undefined {
  const exhausted = character.traits.find(trait => trait.exhausted && !trait.busted);
  if (!exhausted) {
    return undefined;
  }

  exhausted.exhausted = false;
  return exhausted.name;
}

export function shouldDealerHit(
  dealerEvaluation: HandResult,
  mode: DealerPlayMode,
  targetScore: number = 0
): boolean {
  if (dealerEvaluation.isBust) {
    return false;
  }

  if (mode === 'stand-on-17') {
    return dealerEvaluation.total <= 16;
  }

  return dealerEvaluation.total < targetScore && dealerEvaluation.total < 21;
}

export async function playDealerHand(
  deck: Deck,
  dealerHand: Card[],
  mode: DealerPlayMode,
  onCardDrawn: () => Promise<void>,
  targetScore: number = 0
): Promise<HandResult> {
  revealDealerHoleCard(dealerHand);
  let dealerEvaluation = evaluateHand(dealerHand);

  while (shouldDealerHit(dealerEvaluation, mode, targetScore)) {
    const card = deck.draw();
    card.faceUp = true;
    dealerHand.push(card);
    dealerEvaluation = evaluateHand(dealerHand);
    await onCardDrawn();
  }

  return dealerEvaluation;
}

export function comparePlayerAndDealer(
  playerEvaluation: HandResult,
  dealerEvaluation: HandResult
): BlackjackRoundOutcome {
  if (playerEvaluation.isBust) {
    return 'BUST';
  }
  if (dealerEvaluation.isBust || playerEvaluation.total > dealerEvaluation.total) {
    return 'WIN';
  }
  if (playerEvaluation.total === dealerEvaluation.total) {
    return 'PUSH';
  }
  return 'LOSE';
}
