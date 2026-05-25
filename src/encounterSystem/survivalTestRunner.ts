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
  playDealerHand,
  recoverOneExhaustedTrait
} from '@cardEngine/blackjackTestSemantics';
import { Character } from '@characterSystem/characterTypes';
import { TestResult, TestUI } from './encounterTypes';
import { damageTrait } from '@characterSystem/traitManager';
import { gameStateStore } from '@gameFlow/gameStateStore';
import { gameEventBus } from '@gameFlow/gameEventBus';

/**
 * Runs a standard Survival Test for a single Character against the Dealer.
 * Subject to Rising Tension on dealer wins, and permanent Trait damage on busts.
 */
export async function runSurvivalTest(
  player: Character,
  deadPCs: Character[],
  deck: Deck,
  ui: TestUI,
  initialTension: number = 0,
  obstacleName?: string
): Promise<TestResult> {
  let tension = initialTension;
  const state = gameStateStore.getState();
  const scenarioId = state.scenario?.id;
  const traitsExhausted: string[] = [];

  while (true) {
    const playerHand = dealPlayerOpeningHand(deck, tension);
    const dealerOpening = dealDealerOpeningHand(deck);
    const dealerHand = dealerOpening.hand;
    const playerState = createParticipantState(playerHand);

    // Update UI state
    const handsMap = new Map<string, Card[]>();
    handsMap.set(player.id, playerHand);
    await ui.showRound(handsMap, dealerHand, tension);

    // 2. Check for Natural 21s
    // Make copies of hands to evaluate their raw values
    const rawPlayerEval = playerState.evaluation;
    // Dealer raw evaluation (treating first card as face up for check)
    const rawDealerEval = evaluateDealerOpeningHand(dealerHand);

    if (rawDealerEval.isNatural21) {
      if (rawPlayerEval.isNatural21) {
        // Both natural 21: push
        gameStateStore.logMessage(`Push! Both dealer and player have Natural 21. The struggle continues...`);
        await ui.showTestResult({
          outcome: 'PUSH',
          finalPlayerTotal: 21,
          finalDealerTotal: 21,
          traitsExhausted: []
        }, true);
        continue;
      } else {
        // Dealer natural 21, player not: round over, tension increases
        gameStateStore.logMessage(`The Dealer got a Natural 21. The struggle continues...`);
        gameEventBus.emit('narrative_triggered', {
          type: 'RISING_TENSION',
          context: {
            characterName: player.name,
            obstacleName,
            scenarioId
          }
        });
        await ui.showTestResult({
          outcome: 'LOSE',
          finalPlayerTotal: rawPlayerEval.total,
          finalDealerTotal: 21,
          traitsExhausted: []
        }, true);
        tension++;
        continue;
      }
    }

    if (rawPlayerEval.isNatural21) {
      // Player natural 21: win! Recover an exhausted trait.
      recoverOneExhaustedTrait(player);
      return {
        outcome: 'WIN',
        finalPlayerTotal: 21,
        finalDealerTotal: rawDealerEval.total,
        traitsExhausted
      };
    }

    // 3. Player Turn Loop
    let playerEval = playerState.evaluation;
    let stand = false;

    while (!stand && !playerEval.isBust) {
      // Prompt player for action
      const action = await ui.promptPlayerAction(player, playerHand, playerState.appliedTraitModifier === 0);

      if (action === 'HIT') {
        playerEval = addPlayerHit(deck, playerState);
        await ui.showRound(handsMap, dealerHand, tension);
      } else if (action === 'STAND') {
        stand = true;
      } else if (typeof action === 'object' && action.type === 'TRAIT') {
        // Exhaust trait to adjust score
        const trait = findUsableTrait(player, action.traitName, playerHand);
        if (trait) {
          playerEval = exhaustTraitForHand(playerState, trait);
          traitsExhausted.push(trait.name);
          await ui.showRound(handsMap, dealerHand, tension);
        }
      }
    }

    // If player busted, they can mitigate it using a trait if they haven't used one yet
    if (playerEval.isBust && playerState.appliedTraitModifier === 0) {
      if (hasUsableTrait(player, playerHand)) {
        const action = await ui.promptPlayerAction(player, playerHand, true, { bustMitigation: true });
        if (typeof action === 'object' && action.type === 'TRAIT') {
          const trait = findUsableTrait(player, action.traitName, playerHand);
          if (trait) {
            playerEval = exhaustTraitForHand(playerState, trait);
            traitsExhausted.push(trait.name);
            if (!playerEval.isBust) {
              stand = true; // Recovered from bust, standing now
            }
            await ui.showRound(handsMap, dealerHand, tension);
          }
        }
      }
    }

    // Handle BUST outcome
    if (playerEval.isBust) {
      // Permanently damage a Trait by prompting
      const chosenTrait = await ui.promptBustedTraitSelection(player);
      let damageTaken: string | undefined;
      if (chosenTrait) {
        damageTaken = damageTrait(player, chosenTrait.name) || undefined;
      }

      return {
        outcome: 'BUST',
        finalPlayerTotal: playerEval.total,
        finalDealerTotal: 0,
        traitsExhausted,
        damageTaken
      };
    }

    // 4. Dead PC Ghost Swap Mechanic (happens before Dealer reveal)
    if (deadPCs.length > 0) {
      for (const ghost of deadPCs) {
        if (ghost.ghostCard && playerHand.length > 0) {
          // Convert ghostCard back to Card object
          const gCard: Card = {
            suit: ghost.ghostCard.suit as any,
            rank: ghost.ghostCard.rank as any,
            faceUp: true
          };
          const swapChoice = await ui.promptDeadPCFlashback(ghost, player, [gCard]);
          if (swapChoice) {
            // Swap player's last card with ghost's card
            const lastPlayerCard = playerHand[playerHand.length - 1];
            playerHand[playerHand.length - 1] = swapChoice.cardToGive;
            
            // Ghost stores the swapped player card
            ghost.ghostCard = {
              suit: lastPlayerCard.suit,
              rank: lastPlayerCard.rank
            };

            // Re-evaluate hand
            playerEval = evaluatePlayerHand(playerHand, playerState.appliedTraitModifier);
            playerState.evaluation = playerEval;
            
            await ui.showRound(handsMap, dealerHand, tension);
            
            if (playerEval.isBust) {
              // Busted after swap
              const chosenTrait = await ui.promptBustedTraitSelection(player);
              let damageTaken: string | undefined;
              if (chosenTrait) {
                damageTaken = damageTrait(player, chosenTrait.name) || undefined;
              }
              return {
                outcome: 'BUST',
                finalPlayerTotal: playerEval.total,
                finalDealerTotal: 0,
                traitsExhausted,
                damageTaken
              };
            }
            break; // Swap happened, move on
          }
        }
      }
    }

    // 5. Dealer Turn
    const dealerEval = await playDealerHand(
      deck,
      dealerHand,
      'solo-target',
      () => ui.showRound(handsMap, dealerHand, tension),
      playerEval.total
    );
    await ui.showRound(handsMap, dealerHand, tension);

    // 6. Outcome Resolution
    const outcome = comparePlayerAndDealer(playerEval, dealerEval);
    if (outcome === 'WIN') {
      // Dealer busts, player wins!
      return {
        outcome: 'WIN',
        finalPlayerTotal: playerEval.total,
        finalDealerTotal: dealerEval.total,
        traitsExhausted
      };
    }

    if (outcome === 'LOSE') {
      // Narrate dealer win
      gameStateStore.logMessage(`The Dealer beats your score (${dealerEval.total} vs ${playerEval.total}). The struggle continues...`);
      gameEventBus.emit('narrative_triggered', {
        type: 'RISING_TENSION',
        context: {
          characterName: player.name,
          obstacleName,
          scenarioId
        }
      });
      // Show intermediate result
      await ui.showTestResult({
        outcome: 'LOSE',
        finalPlayerTotal: playerEval.total,
        finalDealerTotal: dealerEval.total,
        traitsExhausted: []
      }, true);

      // Dealer wins: increase tension, start next round of the test
      tension++;
      continue;
    } else if (outcome === 'PUSH') {
      // Narrate push
      gameStateStore.logMessage(`Push! (${dealerEval.total} vs ${playerEval.total}). The struggle continues...`);
      await ui.showTestResult({
        outcome: 'PUSH',
        finalPlayerTotal: playerEval.total,
        finalDealerTotal: dealerEval.total,
        traitsExhausted: []
      }, true);

      // Push: re-deal hand without increasing tension
      continue;
    }
  }
}
