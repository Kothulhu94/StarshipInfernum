import { Card } from '@cardEngine/cardDefinitions';
import { Deck } from '@cardEngine/deckManager';
import { evaluateHand } from '@cardEngine/handEvaluator';
import { Character } from '@characterSystem/characterTypes';
import { TestUI } from '@encounterSystem/encounterTypes';
import { damageTrait } from '@characterSystem/traitManager';
import { canSurvivorSlink } from '@characterSystem/aptitudeExecutor';
import { canUseTraitModifier } from '@characterSystem/playerActionModel';
import { gameStateStore } from '@gameFlow/gameStateStore';

export interface DisasterResult {
  resolved: boolean;
  damagedPlayerId?: string;
  damageTaken?: string;
}

/**
 * Resolves a crisis-specific Disaster as a Group Test against all surviving characters
 * using the Room & Obstacle deck.
 *
 * Rules:
 *  1. Any player deals a Natural 21 -> Disaster immediately averted.
 *  2. Any player busts -> Player takes Trait damage, Disaster ends in failure.
 *  3. Every player beats the Dealer in the same round -> Disaster averted.
 *  4. Mixed results -> Next round dealt. Winning players reset tension; losing players increment tension.
 */
export async function runDisasterTest(
  players: Character[],
  deadPCs: Character[],
  roDeck: Deck,
  ui: TestUI
): Promise<DisasterResult> {
  const activePlayers = [...players].filter(p => !p.isDead);
  if (activePlayers.length === 0) {
    return { resolved: false };
  }

  // Track individual tension levels for each player
  const playerTension = new Map<string, number>();
  for (const p of activePlayers) {
    playerTension.set(p.id, 0);
  }

  let disasterRound = 1;
  const survivorSlinked = new Set<string>();

  while (true) {
    // Filter out players who have slunk away (Survivor aptitude)
    const currentRoundPlayers = activePlayers.filter(p => !survivorSlinked.has(p.id));

    if (currentRoundPlayers.length === 0) {
      // If everyone slunk away, technically the disaster is resolved/averted
      return { resolved: true };
    }

    const playerHands = new Map<string, Card[]>();
    const dealerHand: Card[] = [];
    const playerEvals = new Map<string, { total: number; isSoft: boolean; isBust: boolean; isNatural21: boolean }>();
    const playerTraitsExhausted = new Map<string, string[]>();
    const playerAppliedModifiers = new Map<string, number>();

    // 1. Initial Deal
    for (const p of currentRoundPlayers) {
      const tension = playerTension.get(p.id) || 0;
      const startCards = 2 + tension;
      const hand: Card[] = [];
      for (let i = 0; i < startCards; i++) {
        const card = roDeck.draw();
        card.faceUp = true;
        hand.push(card);
      }
      playerHands.set(p.id, hand);
      playerTraitsExhausted.set(p.id, []);
      playerAppliedModifiers.set(p.id, 0);
      playerEvals.set(p.id, evaluateHand(hand));
    }

    // Dealer gets 2 cards (first face-down, second face-up)
    const d1 = roDeck.draw();
    d1.faceUp = false;
    const d2 = roDeck.draw();
    d2.faceUp = true;
    dealerHand.push(d1, d2);

    await ui.showRound(playerHands, dealerHand, 0); // Display round

    const rawDealerEval = evaluateHand([{ ...d1, faceUp: true }, d2]);

    // 2. Check for Natural 21
    const anyPlayerHasNatural21 = Array.from(playerEvals.values()).some(e => e.isNatural21);
    if (anyPlayerHasNatural21 && !rawDealerEval.isNatural21) {
      // Natural 21 immediately averts the disaster!
      // Recover an exhausted trait on anyone who has one
      for (const p of currentRoundPlayers) {
        if (playerEvals.get(p.id)!.isNatural21) {
          const exhausted = p.traits.find(t => t.exhausted && !t.busted);
          if (exhausted) {
            exhausted.exhausted = false;
          }
        }
      }
      return { resolved: true };
    }

    // 3. Player Turn Loop
    for (const p of currentRoundPlayers) {
      let pHand = playerHands.get(p.id)!;
      let pEval = playerEvals.get(p.id)!;
      let stand = false;
      let appliedTraitModifier = 0;
      const traitsExhausted = playerTraitsExhausted.get(p.id)!;

      while (!stand && !pEval.isBust) {
        const canApplyTrait = canUseTraitModifier(p, appliedTraitModifier === 0);
        const action = await ui.promptPlayerAction(p, pHand, canApplyTrait);

        if (action === 'HIT') {
          const card = roDeck.draw();
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
          const trait = canApplyTrait
            ? p.traits.find(t => t.name === action.traitName && !t.exhausted && !t.busted)
            : undefined;
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

      // Mitigate bust with trait
      if (pEval.isBust && canUseTraitModifier(p, appliedTraitModifier === 0)) {
        const availableTraits = p.traits.filter(t => !t.exhausted && !t.busted);
        if (availableTraits.length > 0) {
          const action = await ui.promptPlayerAction(p, pHand, true);
          if (typeof action === 'object' && action.type === 'TRAIT') {
            const trait = canUseTraitModifier(p, true)
              ? p.traits.find(t => t.name === action.traitName && !t.exhausted && !t.busted)
              : undefined;
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

      // Trainee backup ability check on bust
      if (pEval.isBust) {
        const traineePresent = currentRoundPlayers.some(other => other.aptitude === 'Trainee' && !other.isDead);
        if (traineePresent && pHand.length > 0) {
          const useTrainee = await (ui as any).promptTraineeAbilty?.(p);
          if (useTrainee) {
            pHand.pop(); // Discard busted card
            const newCard = roDeck.draw();
            newCard.faceUp = true;
            pHand.push(newCard);
            pEval = evaluateHand(pHand);
            pEval.total += appliedTraitModifier;
            if (pEval.total > 21) {
              pEval.isBust = true;
            } else {
              pEval.isBust = false;
              stand = true;
            }
            playerEvals.set(p.id, pEval);
            await ui.showRound(playerHands, dealerHand, 0);
          }
        }
      }

      // BUST ends the Disaster in failure
      if (pEval.isBust) {
        const chosenTrait = await ui.promptBustedTraitSelection(p);
        let damagedTrait: string | null = null;
        if (chosenTrait) {
          damagedTrait = damageTrait(p, chosenTrait.name);
        }
        return {
          resolved: false,
          damagedPlayerId: p.id,
          damageTaken: damagedTrait || undefined
        };
      }
    }

    // 4. Dead PC Ghost Swap Mechanic (only for players who didn't bust)
    if (deadPCs.length > 0) {
      for (const ghost of deadPCs) {
        if (ghost.ghostCard) {
          const gCard: Card = {
            suit: ghost.ghostCard.suit as any,
            rank: ghost.ghostCard.rank as any,
            faceUp: true
          };
          for (const p of currentRoundPlayers) {
            const pHand = playerHands.get(p.id)!;
            const swapChoice = await ui.promptDeadPCFlashback(ghost, p, [gCard]);
            if (swapChoice) {
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
                const chosenTrait = await ui.promptBustedTraitSelection(p);
                let damagedTrait: string | null = null;
                if (chosenTrait) {
                  damagedTrait = damageTrait(p, chosenTrait.name);
                }
                return {
                  resolved: false,
                  damagedPlayerId: p.id,
                  damageTaken: damagedTrait || undefined
                };
              }
              break;
            }
          }
        }
      }
    }

    // 5. Dealer Play
    d1.faceUp = true;
    let dealerEval = evaluateHand(dealerHand);
    await ui.showRound(playerHands, dealerHand, 0);

    // Dealer hits on <= 16, stands on >= 17
    while (dealerEval.total <= 16) {
      const card = roDeck.draw();
      card.faceUp = true;
      dealerHand.push(card);
      dealerEval = evaluateHand(dealerHand);
      await ui.showRound(playerHands, dealerHand, 0);
    }

    // 6. Compare outcomes
    let allPlayersBeatDealer = true;
    const roundWinners: string[] = [];

    for (const p of currentRoundPlayers) {
      const pEval = playerEvals.get(p.id)!;
      const playerBeatsDealer = dealerEval.isBust || pEval.total > dealerEval.total;

      if (playerBeatsDealer) {
        roundWinners.push(p.id);
        playerTension.set(p.id, 0); // Reset tension
      } else {
        allPlayersBeatDealer = false;
        const currentT = playerTension.get(p.id) || 0;
        playerTension.set(p.id, currentT + 1); // Increment tension
      }
    }

    // If everyone beat the dealer, the disaster is averted!
    if (allPlayersBeatDealer) {
      return { resolved: true };
    }

    // Since the round was not won by all players, the disaster continues. Show intermediate result.
    gameStateStore.logMessage(`Disaster round ${disasterRound} ends. Tension is rising!`);
    await ui.showTestResult({
      outcome: 'LOSE',
      finalPlayerTotal: 0,
      finalDealerTotal: dealerEval.total,
      traitsExhausted: []
    }, true);

    // Survivor Slink check for round winners after the first round
    for (const winnerId of roundWinners) {
      const winner = currentRoundPlayers.find(p => p.id === winnerId);
      if (winner && canSurvivorSlink(winner, true, disasterRound)) {
        survivorSlinked.add(winner.id);
      }
    }

    disasterRound++;
  }
}
