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

/**
 * Runs a Group Test for multiple Characters against a single Dealer hand.
 * Dealer must hit on <= 16, stand on >= 17 (Ace counts as 11 unless it busts).
 * If any player gets a Natural 21 and Dealer does not, all players win immediately.
 */
export async function runGroupTest(
  players: Character[],
  deadPCs: Character[],
  deck: Deck,
  ui: TestUI,
  isFatal: boolean = true, // If true, busts inflict Trait damage
  initialTension: number = 0
): Promise<Map<string, TestResult>> {
  const resultsMap = new Map<string, TestResult>();
  const playerTension = new Map<string, number>();

  for (const p of players) {
    playerTension.set(p.id, initialTension);
  }

  while (true) {
    // Get active players who have not won or busted yet
    const activeRoundPlayers = players.filter(p => !resultsMap.has(p.id));
    if (activeRoundPlayers.length === 0) {
      break;
    }

    const playerHands = new Map<string, Card[]>();
    const playerStates = new Map<string, ReturnType<typeof createParticipantState>>();

    // 1. Initial Deal
    for (const p of activeRoundPlayers) {
      const tension = playerTension.get(p.id) || 0;
      const pHand = dealPlayerOpeningHand(deck, tension);
      const playerState = createParticipantState(pHand);
      playerHands.set(p.id, pHand);
      playerStates.set(p.id, playerState);
    }

    const dealerOpening = dealDealerOpeningHand(deck);
    const dealerHand = dealerOpening.hand;

    await ui.showRound(playerHands, dealerHand, 0);

    // Evaluate raw dealer hand
    const rawDealerEval = evaluateDealerOpeningHand(dealerHand);

    // 2. Check for Natural 21
    const anyPlayerHasNatural21 = Array.from(playerStates.values()).some(state => state.evaluation.isNatural21);

    if (anyPlayerHasNatural21 && !rawDealerEval.isNatural21) {
      // Immediate win for ALL active players! Recover an exhausted trait on anyone who has one.
      for (const p of activeRoundPlayers) {
        recoverOneExhaustedTrait(p);
        resultsMap.set(p.id, {
          outcome: 'WIN',
          finalPlayerTotal: playerStates.get(p.id)!.evaluation.total,
          finalDealerTotal: rawDealerEval.total,
          traitsExhausted: []
        });
      }
      continue;
    }

    if (rawDealerEval.isNatural21) {
      for (const p of activeRoundPlayers) {
        const playerState = playerStates.get(p.id)!;
        if (playerState.evaluation.isNatural21) {
          continue;
        }
        const currentT = playerTension.get(p.id) || 0;
        playerTension.set(p.id, currentT + 1);
      }

      await ui.showTestResult({
        outcome: anyPlayerHasNatural21 ? 'PUSH' : 'LOSE',
        finalPlayerTotal: Math.max(...Array.from(playerStates.values()).map(state => state.evaluation.total)),
        finalDealerTotal: 21,
        traitsExhausted: []
      }, true);
      continue;
    }

    // 3. Sequential Player Turns
    for (const p of activeRoundPlayers) {
      const playerState = playerStates.get(p.id)!;
      let pHand = playerState.hand;
      let pEval = playerState.evaluation;
      let stand = false;

      while (!stand && !pEval.isBust) {
        const action = await ui.promptPlayerAction(p, pHand, playerState.appliedTraitModifier === 0);

        if (action === 'HIT') {
          pEval = addPlayerHit(deck, playerState);
          await ui.showRound(playerHands, dealerHand, 0);
        } else if (action === 'STAND') {
          stand = true;
        } else if (typeof action === 'object' && action.type === 'TRAIT') {
          const trait = findUsableTrait(p, action.traitName, pHand);
          if (trait) {
            pEval = exhaustTraitForHand(playerState, trait);
            await ui.showRound(playerHands, dealerHand, 0);
          }
        }
      }

      // Mitigate player bust if possible
      if (pEval.isBust && playerState.appliedTraitModifier === 0) {
        if (hasUsableTrait(p, pHand)) {
          const action = await ui.promptPlayerAction(p, pHand, true, { bustMitigation: true });
          if (typeof action === 'object' && action.type === 'TRAIT') {
            const trait = findUsableTrait(p, action.traitName, pHand);
            if (trait) {
              pEval = exhaustTraitForHand(playerState, trait);
              if (!pEval.isBust) {
                stand = true;
              }
              await ui.showRound(playerHands, dealerHand, 0);
            }
          }
        }
      }

      // Handle BUST results
      if (pEval.isBust) {
        let damageTaken: string | undefined;
        if (isFatal) {
          const chosenTrait = await ui.promptBustedTraitSelection(p);
          if (chosenTrait) {
            damageTaken = damageTrait(p, chosenTrait.name) || undefined;
          }
        }

        resultsMap.set(p.id, {
          outcome: 'BUST',
          finalPlayerTotal: pEval.total,
          finalDealerTotal: 0,
          traitsExhausted: playerState.traitsExhausted,
          damageTaken
        });
      }
    }

    // 4. Dead PC Ghost Swaps (only for players who didn't bust)
    const activeRoundSurvivors = activeRoundPlayers.filter(p => !playerStates.get(p.id)!.evaluation.isBust);
    if (deadPCs.length > 0 && activeRoundSurvivors.length > 0) {
      for (const ghost of deadPCs) {
        if (ghost.ghostCard) {
          const gCard: Card = {
            suit: ghost.ghostCard.suit as any,
            rank: ghost.ghostCard.rank as any,
            faceUp: true
          };
          for (const p of activeRoundSurvivors) {
            const pHand = playerHands.get(p.id)!;
            const swapChoice = await ui.promptDeadPCFlashback(ghost, p, [gCard]);
            if (swapChoice) {
              // Swap cards
              const lastPlayerCard = pHand[pHand.length - 1];
              pHand[pHand.length - 1] = swapChoice.cardToGive;

              ghost.ghostCard = {
                suit: lastPlayerCard.suit,
                rank: lastPlayerCard.rank
              };

              const playerState = playerStates.get(p.id)!;
              let pEval = evaluatePlayerHand(pHand, playerState.appliedTraitModifier);
              playerState.evaluation = pEval;
              await ui.showRound(playerHands, dealerHand, 0);

              if (pEval.isBust) {
                // Busted on swap
                let damageTaken: string | undefined;
                if (isFatal) {
                  const chosenTrait = await ui.promptBustedTraitSelection(p);
                  if (chosenTrait) {
                    damageTaken = damageTrait(p, chosenTrait.name) || undefined;
                  }
                }
                resultsMap.set(p.id, {
                  outcome: 'BUST',
                  finalPlayerTotal: pEval.total,
                  finalDealerTotal: 0,
                  traitsExhausted: playerState.traitsExhausted,
                  damageTaken
                });
              }
              break; // Max 1 swap per ghost card per round
            }
          }
        }
      }
    }

    // 5. Dealer Play (only if at least one player stood and did not bust)
    const anyPlayersAlive = activeRoundPlayers.some(p => !resultsMap.has(p.id) && !playerStates.get(p.id)!.evaluation.isBust);
    if (!anyPlayersAlive) {
      // Everyone in this round busted, dealer wins automatically without playing
      continue;
    }

    const dealerEval = await playDealerHand(
      deck,
      dealerHand,
      'stand-on-17',
      () => ui.showRound(playerHands, dealerHand, 0)
    );
    await ui.showRound(playerHands, dealerHand, 0);

    // 6. Compare player scores and determine who is resolved or continues
    let hasIntermediateLoseOrPush = false;
    const roundResultsMap = new Map<string, TestResult>();

    for (const p of activeRoundPlayers) {
      if (resultsMap.has(p.id)) continue; // Already busted

      const playerState = playerStates.get(p.id)!;
      const pEval = playerState.evaluation;
      const traitsExhausted = playerState.traitsExhausted;
      const outcome = comparePlayerAndDealer(pEval, dealerEval);

      if (outcome === 'WIN') {
        // Player wins this hand! Resolved!
        resultsMap.set(p.id, {
          outcome: 'WIN',
          finalPlayerTotal: pEval.total,
          finalDealerTotal: dealerEval.total,
          traitsExhausted
        });
        roundResultsMap.set(p.id, resultsMap.get(p.id)!);
      } else if (outcome === 'LOSE') {
        // Player loses this hand. Not resolved! Will need another round.
        const currentT = playerTension.get(p.id) || 0;
        playerTension.set(p.id, currentT + 1); // Tension increases
        hasIntermediateLoseOrPush = true;
        roundResultsMap.set(p.id, {
          outcome: 'LOSE',
          finalPlayerTotal: pEval.total,
          finalDealerTotal: dealerEval.total,
          traitsExhausted
        });
      } else {
        // Player pushes this hand. Not resolved! Will need another round.
        hasIntermediateLoseOrPush = true;
        roundResultsMap.set(p.id, {
          outcome: 'PUSH',
          finalPlayerTotal: pEval.total,
          finalDealerTotal: dealerEval.total,
          traitsExhausted
        });
      }
    }

    if (hasIntermediateLoseOrPush) {
      // Find one representative result to show the UI
      const repResult = Array.from(roundResultsMap.values()).find(r => r.outcome === 'LOSE' || r.outcome === 'PUSH') 
        || Array.from(roundResultsMap.values())[0];
      
      await ui.showTestResult(repResult, true);
    }
  }

  return resultsMap;
}
