import { Card } from '@cardEngine/cardDefinitions';
import { Deck } from '@cardEngine/deckManager';
import { evaluateHand } from '@cardEngine/handEvaluator';
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
  initialTension: number = 0
): Promise<TestResult> {
  let tension = initialTension;
  const traitsExhausted: string[] = [];

  while (true) {
    // 1. Setup hands
    const playerHand: Card[] = [];
    const dealerHand: Card[] = [];

    // Player gets 2 + tension cards face up
    const startCards = 2 + tension;
    for (let i = 0; i < startCards; i++) {
      const card = deck.draw();
      card.faceUp = true;
      playerHand.push(card);
    }

    // Dealer gets 2 cards (first is face-down, second is face-up)
    const d1 = deck.draw();
    d1.faceUp = false;
    const d2 = deck.draw();
    d2.faceUp = true;
    dealerHand.push(d1, d2);

    // Update UI state
    const handsMap = new Map<string, Card[]>();
    handsMap.set(player.id, playerHand);
    await ui.showRound(handsMap, dealerHand, tension);

    // 2. Check for Natural 21s
    // Make copies of hands to evaluate their raw values
    const rawPlayerEval = evaluateHand(playerHand);
    // Dealer raw evaluation (treating first card as face up for check)
    const rawDealerEval = evaluateHand([
      { ...d1, faceUp: true },
      d2
    ]);

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
      const exhausted = player.traits.find(t => t.exhausted && !t.busted);
      if (exhausted) {
        exhausted.exhausted = false;
      }
      return {
        outcome: 'WIN',
        finalPlayerTotal: 21,
        finalDealerTotal: rawDealerEval.total,
        traitsExhausted
      };
    }

    // 3. Player Turn Loop
    let playerEval = evaluateHand(playerHand);
    let stand = false;
    let appliedTraitModifier = 0;

    while (!stand && !playerEval.isBust) {
      // Prompt player for action
      const action = await ui.promptPlayerAction(player, playerHand, appliedTraitModifier === 0);

      if (action === 'HIT') {
        const card = deck.draw();
        card.faceUp = true;
        playerHand.push(card);
        playerEval = evaluateHand(playerHand);
        
        // Add modifier if trait was already used
        playerEval.total += appliedTraitModifier;
        if (playerEval.total > 21) {
          playerEval.isBust = true;
        }

        await ui.showRound(handsMap, dealerHand, tension);
      } else if (action === 'STAND') {
        stand = true;
      } else if (typeof action === 'object' && action.type === 'TRAIT') {
        // Exhaust trait to adjust score
        const trait = player.traits.find(t => t.name === action.traitName && !t.exhausted && !t.busted);
        if (trait) {
          trait.exhausted = true;
          traitsExhausted.push(trait.name);
          appliedTraitModifier = trait.modifier;
          
          playerEval.total += appliedTraitModifier;
          if (playerEval.total > 21) {
            playerEval.isBust = true;
          } else {
            playerEval.isBust = false; // Could mitigate a bust
          }
          await ui.showRound(handsMap, dealerHand, tension);
        }
      }
    }

    // If player busted, they can mitigate it using a trait if they haven't used one yet
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
            playerEval = evaluateHand(playerHand);
            playerEval.total += appliedTraitModifier;
            if (playerEval.total > 21) {
              playerEval.isBust = true;
            }
            
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
    d1.faceUp = true; // Reveal dealer face-down card
    let dealerEval = evaluateHand(dealerHand);
    await ui.showRound(handsMap, dealerHand, tension);

    // Dealer hits to beat player's score
    // In solo tests, Dealer hits until they have BEATEN or TIED player score, or bust
    while (dealerEval.total < playerEval.total && dealerEval.total < 21) {
      const card = deck.draw();
      card.faceUp = true;
      dealerHand.push(card);
      dealerEval = evaluateHand(dealerHand);
      await ui.showRound(handsMap, dealerHand, tension);
    }

    // 6. Outcome Resolution
    if (dealerEval.isBust) {
      // Dealer busts, player wins!
      return {
        outcome: 'WIN',
        finalPlayerTotal: playerEval.total,
        finalDealerTotal: dealerEval.total,
        traitsExhausted
      };
    }

    if (dealerEval.total > playerEval.total) {
      // Narrate dealer win
      gameStateStore.logMessage(`The Dealer beats your score (${dealerEval.total} vs ${playerEval.total}). The struggle continues...`);
      gameEventBus.emit('narrative_triggered', {
        type: 'RISING_TENSION',
        context: {
          characterName: player.name,
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
    } else if (dealerEval.total === playerEval.total) {
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
