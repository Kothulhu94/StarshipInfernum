import { Card } from '@cardEngine/cardDefinitions';
import { Deck } from '@cardEngine/deckManager';
import {
  addPlayerHit,
  comparePlayerAndDealer,
  createParticipantState,
  dealDealerOpeningHand,
  dealPlayerOpeningHand,
  evaluateDealerOpeningHand,
  evaluatePlayerHand,
  exhaustTraitForHand,
  findUsableTrait,
  hasUsableTrait,
  hasBustMitigatingTrait,
  playDealerHand,
  recoverOneExhaustedTrait
} from '@cardEngine/blackjackTestSemantics';
import { Character } from '@characterSystem/characterTypes';
import { TestResult, TestUI } from './encounterTypes';
import { damageTrait } from '@characterSystem/traitManager';

/**
 * Runs a single-round Simple Test for a Character against the Dealer.
 * Uses the Room & Obstacle deck. No Rising Tension.
 */
export async function runSimpleTest(
  player: Character,
  roDeck: Deck,
  ui: TestUI,
  initialTension: number = 0
): Promise<TestResult> {
  const traitsExhausted: string[] = [];

  while (true) {
    const result = await runSimpleTestHand(player, roDeck, ui, traitsExhausted, initialTension);
    if (result.outcome !== 'PUSH') {
      return result;
    }
    // Show intermediate push result before re-dealing
    await ui.showTestResult(result, true);
  }
}

async function runSimpleTestHand(
  player: Character,
  roDeck: Deck,
  ui: TestUI,
  traitsExhausted: string[],
  tension: number
): Promise<TestResult> {
  const playerHand = dealPlayerOpeningHand(roDeck, tension);
  const dealerOpening = dealDealerOpeningHand(roDeck);
  const dealerHand = dealerOpening.hand;
  const playerState = createParticipantState(playerHand);

  // Update UI
  const handsMap = new Map<string, Card[]>();
  handsMap.set(player.id, playerHand);
  await ui.showRound(handsMap, dealerHand, 0);

  // Raw evaluations
  let playerEval = playerState.evaluation;
  const rawDealerEval = evaluateDealerOpeningHand(dealerHand);

  // Check natural 21s
  if (rawDealerEval.isNatural21) {
    if (playerEval.isNatural21) {
      return { outcome: 'PUSH', finalPlayerTotal: 21, finalDealerTotal: 21, traitsExhausted };
    } else {
      return { outcome: 'LOSE', finalPlayerTotal: playerEval.total, finalDealerTotal: 21, traitsExhausted };
    }
  }

  if (playerEval.isNatural21) {
    recoverOneExhaustedTrait(player);
    return { outcome: 'WIN', finalPlayerTotal: 21, finalDealerTotal: rawDealerEval.total, traitsExhausted };
  }

  // Player choice loop
  let stand = false;

  while (!stand && !playerEval.isBust) {
    const action = await ui.promptPlayerAction(player, playerHand, playerState.appliedTraitModifier === 0);

    if (action === 'HIT') {
      playerEval = addPlayerHit(roDeck, playerState);
      await ui.showRound(handsMap, dealerHand, 0);
    } else if (action === 'STAND') {
      stand = true;
    } else if (typeof action === 'object' && action.type === 'TRAIT') {
      const trait = findUsableTrait(player, action.traitName, playerHand);
      if (trait) {
        playerEval = exhaustTraitForHand(playerState, trait);
        traitsExhausted.push(trait.name);
        await ui.showRound(handsMap, dealerHand, 0);
      }
    }
  }

  // Mitigate bust if possible
  if (playerEval.isBust && playerState.appliedTraitModifier === 0) {
    if (hasBustMitigatingTrait(player, playerEval.total)) {
      const action = await ui.promptPlayerAction(player, playerHand, true, { bustMitigation: true });
      if (typeof action === 'object' && action.type === 'TRAIT') {
        const trait = findUsableTrait(player, action.traitName, playerHand);
        if (trait) {
          playerEval = exhaustTraitForHand(playerState, trait);
          traitsExhausted.push(trait.name);
          if (!playerEval.isBust) {
            stand = true;
          }
          await ui.showRound(handsMap, dealerHand, 0);
        }
      }
    }
  }

  // Handle BUST
  if (playerEval.isBust) {
    const chosenTrait = await ui.promptBustedTraitSelection(player);
    let damageTaken: string | undefined;
    if (chosenTrait) {
      damageTaken = damageTrait(player, chosenTrait.name) || undefined;
    }
    return { outcome: 'BUST', finalPlayerTotal: playerEval.total, finalDealerTotal: 0, traitsExhausted, damageTaken };
  }

  // Dealer play
  const dealerEval = await playDealerHand(
    roDeck,
    dealerHand,
    'solo-target',
    () => ui.showRound(handsMap, dealerHand, 0),
    playerEval.total
  );
  await ui.showRound(handsMap, dealerHand, 0);

  // Evaluate final result
  return {
    outcome: comparePlayerAndDealer(playerEval, dealerEval),
    finalPlayerTotal: evaluatePlayerHand(playerHand, playerState.appliedTraitModifier).total,
    finalDealerTotal: dealerEval.total,
    traitsExhausted
  };
}
