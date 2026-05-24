import { Card } from '@cardEngine/cardDefinitions';
import { Deck } from '@cardEngine/deckManager';
import { evaluateHand } from '@cardEngine/handEvaluator';
import { Character } from '@characterSystem/characterTypes';
import { TestResult, TestUI } from './encounterTypes';

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
  isFatal: boolean = true // If true, busts inflict Trait damage
): Promise<Map<string, TestResult>> {
  const resultsMap = new Map<string, TestResult>();
  const playerHands = new Map<string, Card[]>();
  const dealerHand: Card[] = [];
  
  const playerEvals = new Map<string, { total: number; isSoft: boolean; isBust: boolean; isNatural21: boolean }>();
  const playerTraitsExhausted = new Map<string, string[]>();
  const playerAppliedModifiers = new Map<string, number>();

  // 1. Initial Deal
  for (const p of players) {
    const pHand = [deck.draw(), deck.draw()];
    pHand.forEach(c => c.faceUp = true);
    playerHands.set(p.id, pHand);
    playerTraitsExhausted.set(p.id, []);
    playerAppliedModifiers.set(p.id, 0);
  }

  // Dealer gets 2 cards (first face-down, second face-up)
  const d1 = deck.draw();
  d1.faceUp = false;
  const d2 = deck.draw();
  d2.faceUp = true;
  dealerHand.push(d1, d2);

  await ui.showRound(playerHands, dealerHand, 0);

  // Evaluate initial player hands
  for (const p of players) {
    playerEvals.set(p.id, evaluateHand(playerHands.get(p.id)!));
  }

  // Evaluate raw dealer hand
  const rawDealerEval = evaluateHand([
    { ...d1, faceUp: true },
    d2
  ]);

  // 2. Check for Natural 21
  const anyPlayerHasNatural21 = Array.from(playerEvals.values()).some(e => e.isNatural21);

  if (anyPlayerHasNatural21 && !rawDealerEval.isNatural21) {
    // Immediate win for ALL players! Recover an exhausted trait on anyone who has one.
    for (const p of players) {
      const exhausted = p.traits.find(t => t.exhausted && !t.busted);
      if (exhausted) {
        exhausted.exhausted = false;
      }
      resultsMap.set(p.id, {
        outcome: 'WIN',
        finalPlayerTotal: playerEvals.get(p.id)!.total,
        finalDealerTotal: rawDealerEval.total,
        traitsExhausted: []
      });
    }
    return resultsMap;
  }

  // 3. Sequential Player Turns
  for (const p of players) {
    let pHand = playerHands.get(p.id)!;
    let pEval = playerEvals.get(p.id)!;
    let stand = false;
    let appliedTraitModifier = 0;
    const traitsExhausted = playerTraitsExhausted.get(p.id)!;

    while (!stand && !pEval.isBust) {
      const action = await ui.promptPlayerAction(p, pHand, appliedTraitModifier === 0);

      if (action === 'HIT') {
        const card = deck.draw();
        card.faceUp = true;
        pHand.push(card);
        pEval = evaluateHand(pHand);
        pEval.total += appliedTraitModifier;
        if (pEval.total > 21) {
          pEval.isBust = true;
        }
        playerEvals.set(p.id, pEval);
        await ui.showRound(playerHands, dealerHand, 0);
      } else if (action === 'STAND') {
        stand = true;
      } else if (typeof action === 'object' && action.type === 'TRAIT') {
        const trait = p.traits.find(t => t.name === action.traitName && !t.exhausted && !t.busted);
        if (trait) {
          trait.exhausted = true;
          traitsExhausted.push(trait.name);
          appliedTraitModifier = trait.modifier;
          playerAppliedModifiers.set(p.id, appliedTraitModifier);

          pEval.total += appliedTraitModifier;
          if (pEval.total > 21) {
            pEval.isBust = true;
          } else {
            pEval.isBust = false;
          }
          playerEvals.set(p.id, pEval);
          await ui.showRound(playerHands, dealerHand, 0);
        }
      }
    }

    // Mitigate player bust if possible
    if (pEval.isBust && appliedTraitModifier === 0) {
      const availableTraits = p.traits.filter(t => !t.exhausted && !t.busted);
      if (availableTraits.length > 0) {
        const action = await ui.promptPlayerAction(p, pHand, true);
        if (typeof action === 'object' && action.type === 'TRAIT') {
          const trait = p.traits.find(t => t.name === action.traitName && !t.exhausted && !t.busted);
          if (trait) {
            trait.exhausted = true;
            traitsExhausted.push(trait.name);
            appliedTraitModifier = -trait.modifier;
            playerAppliedModifiers.set(p.id, appliedTraitModifier);
            
            pEval.total += appliedTraitModifier;
            if (pEval.total <= 21) {
              pEval.isBust = false;
              stand = true;
            }
            playerEvals.set(p.id, pEval);
            await ui.showRound(playerHands, dealerHand, 0);
          }
        }
      }
    }

    // Handle BUST results
    if (pEval.isBust) {
      let damageTaken: string | undefined;
      if (isFatal) {
        const activeTrait = p.traits.find(t => !t.busted);
        if (activeTrait) {
          activeTrait.busted = true;
          damageTaken = activeTrait.name;
          if (!p.traits.some(t => !t.busted)) {
            p.isDead = true;
          }
        }
      }

      resultsMap.set(p.id, {
        outcome: 'BUST',
        finalPlayerTotal: pEval.total,
        finalDealerTotal: 0,
        traitsExhausted,
        damageTaken
      });
    }
  }

  // 4. Dead PC Ghost Swaps (only for players who didn't bust)
  const activePlayers = players.filter(p => !playerEvals.get(p.id)!.isBust);
  if (deadPCs.length > 0 && activePlayers.length > 0) {
    for (const ghost of deadPCs) {
      if (ghost.ghostCard) {
        const gCard: Card = {
          suit: ghost.ghostCard.suit as any,
          rank: ghost.ghostCard.rank as any,
          faceUp: true
        };
        for (const p of activePlayers) {
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

            const appliedTraitModifier = playerAppliedModifiers.get(p.id) || 0;
            let pEval = evaluateHand(pHand);
            pEval.total += appliedTraitModifier;
            if (pEval.total > 21) {
              pEval.isBust = true;
            }
            playerEvals.set(p.id, pEval);
            await ui.showRound(playerHands, dealerHand, 0);

            if (pEval.isBust) {
              // Busted on swap
              let damageTaken: string | undefined;
              if (isFatal) {
                const activeTrait = p.traits.find(t => !t.busted);
                if (activeTrait) {
                  activeTrait.busted = true;
                  damageTaken = activeTrait.name;
                  if (!p.traits.some(t => !t.busted)) {
                    p.isDead = true;
                  }
                }
              }
              resultsMap.set(p.id, {
                outcome: 'BUST',
                finalPlayerTotal: pEval.total,
                finalDealerTotal: 0,
                traitsExhausted: playerTraitsExhausted.get(p.id)!,
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
  const anyPlayersAlive = Array.from(playerEvals.keys()).some(pId => !playerEvals.get(pId)!.isBust);
  if (!anyPlayersAlive) {
    // Everyone busted, dealer wins automatically without playing
    return resultsMap;
  }

  d1.faceUp = true;
  let dealerEval = evaluateHand(dealerHand);
  await ui.showRound(playerHands, dealerHand, 0);

  // Dealer hitting logic under constraints:
  // Must hit on <= 16, stand on >= 17
  // Ace is 11 unless it busts (soft/hard logic handled by evaluateHand)
  while (dealerEval.total <= 16) {
    const card = deck.draw();
    card.faceUp = true;
    dealerHand.push(card);
    dealerEval = evaluateHand(dealerHand);
    await ui.showRound(playerHands, dealerHand, 0);
  }

  // 6. Compare player scores
  for (const p of players) {
    if (resultsMap.has(p.id)) continue; // Already busted

    const pEval = playerEvals.get(p.id)!;
    const traitsExhausted = playerTraitsExhausted.get(p.id)!;

    if (dealerEval.isBust) {
      // Dealer bust: everyone remaining wins!
      resultsMap.set(p.id, {
        outcome: 'WIN',
        finalPlayerTotal: pEval.total,
        finalDealerTotal: dealerEval.total,
        traitsExhausted
      });
    } else if (pEval.total > dealerEval.total) {
      resultsMap.set(p.id, {
        outcome: 'WIN',
        finalPlayerTotal: pEval.total,
        finalDealerTotal: dealerEval.total,
        traitsExhausted
      });
    } else if (pEval.total < dealerEval.total) {
      resultsMap.set(p.id, {
        outcome: 'LOSE',
        finalPlayerTotal: pEval.total,
        finalDealerTotal: dealerEval.total,
        traitsExhausted
      });
    } else {
      resultsMap.set(p.id, {
        outcome: 'PUSH',
        finalPlayerTotal: pEval.total,
        finalDealerTotal: dealerEval.total,
        traitsExhausted
      });
    }
  }

  return resultsMap;
}
