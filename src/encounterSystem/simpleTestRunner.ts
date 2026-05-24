import { Card } from '@cardEngine/cardDefinitions';
import { Deck } from '@cardEngine/deckManager';
import { evaluateHand } from '@cardEngine/handEvaluator';
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
  ui: TestUI
): Promise<TestResult> {
  const traitsExhausted: string[] = [];

  while (true) {
    const result = await runSimpleTestHand(player, roDeck, ui, traitsExhausted);
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
  traitsExhausted: string[]
): Promise<TestResult> {
  // Setup hands from the Room & Obstacle deck
  const playerHand: Card[] = [];
  const dealerHand: Card[] = [];

  // Player gets 2 cards face up
  playerHand.push(roDeck.draw(), roDeck.draw());
  playerHand.forEach(c => c.faceUp = true);

  // Dealer gets 2 cards (first is face-down, second is face-up)
  const d1 = roDeck.draw();
  d1.faceUp = false;
  const d2 = roDeck.draw();
  d2.faceUp = true;
  dealerHand.push(d1, d2);

  // Update UI
  const handsMap = new Map<string, Card[]>();
  handsMap.set(player.id, playerHand);
  await ui.showRound(handsMap, dealerHand, 0);

  // Raw evaluations
  let playerEval = evaluateHand(playerHand);
  const rawDealerEval = evaluateHand([{ ...d1, faceUp: true }, d2]);

  // Check natural 21s
  if (rawDealerEval.isNatural21) {
    if (playerEval.isNatural21) {
      return { outcome: 'PUSH', finalPlayerTotal: 21, finalDealerTotal: 21, traitsExhausted };
    } else {
      return { outcome: 'LOSE', finalPlayerTotal: playerEval.total, finalDealerTotal: 21, traitsExhausted };
    }
  }

  if (playerEval.isNatural21) {
    // Recover exhausted trait
    const exhausted = player.traits.find(t => t.exhausted && !t.busted);
    if (exhausted) {
      exhausted.exhausted = false;
    }
    return { outcome: 'WIN', finalPlayerTotal: 21, finalDealerTotal: rawDealerEval.total, traitsExhausted };
  }

  // Player choice loop
  let stand = false;
  let appliedTraitModifier = 0;

  while (!stand && !playerEval.isBust) {
    const action = await ui.promptPlayerAction(player, playerHand, appliedTraitModifier === 0);

    if (action === 'HIT') {
      const card = roDeck.draw();
      card.faceUp = true;
      playerHand.push(card);
      playerEval = evaluateHand(playerHand);
      playerEval.total += appliedTraitModifier;
      if (playerEval.total > 21) {
        playerEval.isBust = true;
      }
      await ui.showRound(handsMap, dealerHand, 0);
    } else if (action === 'STAND') {
      stand = true;
    } else if (typeof action === 'object' && action.type === 'TRAIT') {
      const trait = player.traits.find(t => t.name === action.traitName && !t.exhausted && !t.busted);
      if (trait) {
        trait.exhausted = true;
        traitsExhausted.push(trait.name);
        appliedTraitModifier = trait.modifier;
        playerEval.total += appliedTraitModifier;
        if (playerEval.total > 21) {
          playerEval.isBust = true;
        } else {
          playerEval.isBust = false;
        }
        await ui.showRound(handsMap, dealerHand, 0);
      }
    }
  }

  // Mitigate bust if possible
  if (playerEval.isBust && appliedTraitModifier === 0) {
    const availableTraits = player.traits.filter(t => !t.exhausted && !t.busted);
    if (availableTraits.length > 0) {
      const action = await ui.promptPlayerAction(player, playerHand, true);
      if (typeof action === 'object' && action.type === 'TRAIT') {
        const trait = player.traits.find(t => t.name === action.traitName && !t.exhausted && !t.busted);
        if (trait) {
          trait.exhausted = true;
          traitsExhausted.push(trait.name);
          appliedTraitModifier = -trait.modifier;
          playerEval.total += appliedTraitModifier;
          if (playerEval.total <= 21) {
            playerEval.isBust = false;
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
  d1.faceUp = true;
  let dealerEval = evaluateHand(dealerHand);
  await ui.showRound(handsMap, dealerHand, 0);

  // Dealer hits to beat player's total (stops at 21 or when beating/tying player)
  while (dealerEval.total < playerEval.total && dealerEval.total < 21) {
    const card = roDeck.draw();
    card.faceUp = true;
    dealerHand.push(card);
    dealerEval = evaluateHand(dealerHand);
    await ui.showRound(handsMap, dealerHand, 0);
  }

  // Evaluate final result
  if (dealerEval.isBust) {
    return { outcome: 'WIN', finalPlayerTotal: playerEval.total, finalDealerTotal: dealerEval.total, traitsExhausted };
  }

  if (dealerEval.total > playerEval.total) {
    return { outcome: 'LOSE', finalPlayerTotal: playerEval.total, finalDealerTotal: dealerEval.total, traitsExhausted };
  } else if (dealerEval.total === playerEval.total) {
    return { outcome: 'PUSH', finalPlayerTotal: playerEval.total, finalDealerTotal: dealerEval.total, traitsExhausted };
  }

  return { outcome: 'LOSE', finalPlayerTotal: playerEval.total, finalDealerTotal: dealerEval.total, traitsExhausted };
}
