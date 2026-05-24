import { Card } from '@cardEngine/cardDefinitions';
import { Deck } from '@cardEngine/deckManager';
import { evaluateHand } from '@cardEngine/handEvaluator';
import { Character } from '@characterSystem/characterTypes';
import { TestUI } from './encounterTypes';
import { AdversaryData } from './adversaryRegistry';
import { damageTrait } from '@characterSystem/traitManager';
import { destroyWeapon, hasGear } from '@characterSystem/gearInventory';
import { canUseTraitModifier } from '@characterSystem/playerActionModel';
import { gameStateStore } from '@gameFlow/gameStateStore';
import { gameEventBus } from '@gameFlow/gameEventBus';
import { AdversaryDisposition, getRequiredAdversarySuccesses } from './adversaryStateTypes';

/**
 * Handles the combat loop against a mobile Adversary.
 * Runs sequential round tests until either:
 *  - The Adversary is defeated (HP reaches 0)
 *  - The player escapes (flees to another room)
 *  - The player dies (all traits busted)
 */
export async function runAdversaryCombat(
  player: Character,
  adversary: AdversaryData,
  deadPCs: Character[],
  deck: Deck,
  ui: TestUI,
  initialTension: number = 0,
  successesRemaining: number = getRequiredAdversarySuccesses(adversary),
  canDefeatInRegularCombat: boolean = true
): Promise<{
  defeated: boolean;
  playerEscaped: boolean;
  traitsExhausted: string[];
  successesRemaining: number;
  disposition: AdversaryDisposition;
  busted?: boolean;
}> {
  // Set starting HP based on level
  let hp: number = successesRemaining;

  let playerEscaped = false;
  const traitsExhausted: string[] = [];
  let tension = initialTension;

  // Armored Aptitude: Ignore 1 round of Rising Tension in all tests versus Adversaries
  const hasArmored = player.aptitude === 'Armored';
  let armoredTensionMitigationUsed = false;

  while (hp > 0 && !player.isDead && !playerEscaped) {
    // 1. Setup hands
    const playerHand: Card[] = [];
    const dealerHand: Card[] = [];

    // Calculate start cards (with Armored tension check)
    let currentTension = tension;
    if (hasArmored && currentTension > 0 && !armoredTensionMitigationUsed) {
      currentTension--;
      armoredTensionMitigationUsed = true;
    }

    const startCards = 2 + currentTension;
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

    // Apply Greyskin Level 3 Ability: Dealer gets two face-up cards and keeps the best one
    let secondaryDealerFaceUpCard: Card | null = null;
    if (adversary.id === 'greyskin' && adversary.level === 3) {
      secondaryDealerFaceUpCard = deck.draw();
      secondaryDealerFaceUpCard.faceUp = true;
      // Evaluate which card is better for the Dealer (lower is usually better to build on, or closer to 10. Let's keep the higher value rank for ease)
      const val1 = evaluateHand([d1, d2]).total;
      const val2 = evaluateHand([d1, secondaryDealerFaceUpCard]).total;
      if (val2 > val1 && val2 <= 21) {
        dealerHand[1] = secondaryDealerFaceUpCard; // Replace d2
      }
    }

    // Update UI
    const handsMap = new Map<string, Card[]>();
    handsMap.set(player.id, playerHand);
    await ui.showRound(handsMap, dealerHand, tension);

    // 2. Evaluate Natural 21s
    const rawPlayerEval = evaluateHand(playerHand);
    const rawDealerEval = evaluateHand([{ ...d1, faceUp: true }, dealerHand[1]]);

    if (rawDealerEval.isNatural21 && !rawPlayerEval.isNatural21) {
      gameStateStore.logMessage(`${adversary.name} gets a Natural 21 and gains the upper hand!`);
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
      continue; // Round loss, increment tension
    }

    if (rawPlayerEval.isNatural21) {
      // Natural 21 defeats a level of adversary HP instantly!
      hp--;
      const exhausted = player.traits.find(t => t.exhausted && !t.busted);
      if (exhausted) {
        exhausted.exhausted = false;
      }
      gameStateStore.logMessage(`${player.name} gets a Natural 21 and strikes ${adversary.name}!`);
      if (hp > 0) {
        await ui.showTestResult({
          outcome: 'WIN',
          finalPlayerTotal: 21,
          finalDealerTotal: rawDealerEval.total,
          traitsExhausted: []
        }, true);
      }
      continue;
    }

    // 3. Player Decision Loop
    let playerEval = evaluateHand(playerHand);
    let stand = false;
    let appliedTraitModifier = 0;
    let weaponRedrawUsed = false;
    let weaponUsed: 'ranged_weapon' | 'melee_weapon' | null = null;

    // Predatory Horror: No Aptitudes allowed
    const canUseAptitude = adversary.id !== 'predatory_horror';

    while (!stand && !playerEval.isBust) {
      const hasWeapon = hasGear(player, 'ranged_weapon') || hasGear(player, 'melee_weapon');
      const canApplyTrait = canUseTraitModifier(player, appliedTraitModifier === 0);
      const action = await ui.promptPlayerAction(player, playerHand, canApplyTrait, {
        canUseWeaponRedraw: hasWeapon && !weaponRedrawUsed
      });

      if (action === 'HIT') {
        const card = deck.draw();
        card.faceUp = true;
        playerHand.push(card);
        playerEval = evaluateHand(playerHand);
        playerEval.total += appliedTraitModifier;
        if (playerEval.total > 21) {
          playerEval.isBust = true;
        }
        await ui.showRound(handsMap, dealerHand, tension);
      } else if (action === 'STAND') {
        stand = true;
      } else if (typeof action === 'object' && action.type === 'TRAIT') {
        const trait = canApplyTrait
          ? player.traits.find(t => t.name === action.traitName && !t.exhausted && !t.busted)
          : undefined;
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
          await ui.showRound(handsMap, dealerHand, tension);
        }
      } else if (typeof action === 'object' && action.type === 'GEAR' && action.action === 'REDRAW_LAST_CARD') {
        playerHand.pop();
        const newCard = deck.draw();
        newCard.faceUp = true;
        playerHand.push(newCard);
        playerEval = evaluateHand(playerHand);
        playerEval.total += appliedTraitModifier;
        if (playerEval.total > 21) {
          playerEval.isBust = true;
        }
        weaponRedrawUsed = true;
        weaponUsed = action.gear;
        await ui.showRound(handsMap, dealerHand, tension);
      }

      if (playerEval.isBust && hasWeapon && !weaponRedrawUsed && playerHand.length > 0) {
        const redrawAction = await ui.promptPlayerAction(player, playerHand, false, {
          canUseWeaponRedraw: true
        });
        if (typeof redrawAction === 'object' && redrawAction.type === 'GEAR' && redrawAction.action === 'REDRAW_LAST_CARD') {
          playerHand.pop(); // Remove busted card
          const newCard = deck.draw();
          newCard.faceUp = true;
          playerHand.push(newCard);
          playerEval = evaluateHand(playerHand);
          playerEval.total += appliedTraitModifier;
          if (playerEval.total > 21) {
            playerEval.isBust = true;
          }
          weaponRedrawUsed = true;
          weaponUsed = redrawAction.gear;
          await ui.showRound(handsMap, dealerHand, tension);
        }
      }
    }

    // Mitigate player bust with Trait if not yet used
    if (playerEval.isBust && canUseTraitModifier(player, appliedTraitModifier === 0)) {
      const availableTraits = player.traits.filter(t => !t.exhausted && !t.busted);
      if (availableTraits.length > 0) {
        const action = await ui.promptPlayerAction(player, playerHand, true);
        if (typeof action === 'object' && action.type === 'TRAIT') {
          const trait = canUseTraitModifier(player, true)
            ? player.traits.find(t => t.name === action.traitName && !t.exhausted && !t.busted)
            : undefined;
          if (trait) {
            trait.exhausted = true;
            traitsExhausted.push(trait.name);
            appliedTraitModifier = trait.modifier;
            playerEval.total += appliedTraitModifier;
            if (playerEval.total <= 21) {
              playerEval.isBust = false;
              stand = true;
            }
            await ui.showRound(handsMap, dealerHand, tension);
          }
        }
      }
    }

    // Handle BUST (permanently damage a Trait)
    if (playerEval.isBust) {
      if (weaponRedrawUsed && weaponUsed) {
        destroyWeapon(player, weaponUsed);
      }

      const chosenTrait = await ui.promptBustedTraitSelection(player);
      if (chosenTrait) {
        damageTrait(player, chosenTrait.name);
        if (adversary.id === 'giant_insect' && adversary.level === 3) {
          // Giant Insect Level 3 ability: causes TWO traits of damage on a bust
          const secondTrait = await ui.promptBustedTraitSelection(player);
          if (secondTrait) {
            damageTrait(player, secondTrait.name);
          }
        }
      }
      return {
        defeated: false,
        playerEscaped: false,
        traitsExhausted,
        successesRemaining: hp,
        disposition: 'chasing',
        busted: true
      };
    }

    // Dead PC Ghost Swap Mechanic
    if (deadPCs.length > 0) {
      for (const ghost of deadPCs) {
        if (ghost.ghostCard && playerHand.length > 0) {
          const gCard: Card = {
            suit: ghost.ghostCard.suit as any,
            rank: ghost.ghostCard.rank as any,
            faceUp: true
          };
          const swapChoice = await ui.promptDeadPCFlashback(ghost, player, [gCard]);
          if (swapChoice) {
            const lastPlayerCard = playerHand[playerHand.length - 1];
            playerHand[playerHand.length - 1] = swapChoice.cardToGive;

            ghost.ghostCard = {
              suit: lastPlayerCard.suit,
              rank: lastPlayerCard.rank
            };

            playerEval = evaluateHand(playerHand);
            playerEval.total += appliedTraitModifier;
            if (playerEval.total > 21) {
              playerEval.isBust = true;
            }
            await ui.showRound(handsMap, dealerHand, tension);

            if (playerEval.isBust) {
              // Busted after swap
              const chosenTrait = await ui.promptBustedTraitSelection(player);
              if (chosenTrait) {
                damageTrait(player, chosenTrait.name);
              }
              return {
                defeated: false,
                playerEscaped: false,
                traitsExhausted,
                successesRemaining: hp,
                disposition: 'chasing',
                busted: true
              };
            }
            break;
          }
        }
      }
    }

    // 4. Dealer Turn
    d1.faceUp = true;
    let dealerEval = evaluateHand(dealerHand);
    await ui.showRound(handsMap, dealerHand, tension);

    // Apply Assimilator Level 3 Ability: Swap Dealer card with Player card for every hand of the test
    if (adversary.id === 'assimilator' && adversary.level === 3 && playerHand.length > 0 && dealerHand.length > 0) {
      const lastPlayerIdx = playerHand.length - 1;
      const lastDealerIdx = dealerHand.length - 1;
      const temp = playerHand[lastPlayerIdx];
      playerHand[lastPlayerIdx] = dealerHand[lastDealerIdx];
      dealerHand[lastDealerIdx] = temp;

      // Re-evaluate both
      playerEval = evaluateHand(playerHand);
      playerEval.total += appliedTraitModifier;
      dealerEval = evaluateHand(dealerHand);
      await ui.showRound(handsMap, dealerHand, tension);

      if (playerEval.isBust) {
        // Swap caused player to bust!
        const chosenTrait = await ui.promptBustedTraitSelection(player);
        if (chosenTrait) {
          damageTrait(player, chosenTrait.name);
        }
        return {
          defeated: false,
          playerEscaped: false,
          traitsExhausted,
          successesRemaining: hp,
          disposition: 'chasing',
          busted: true
        };
      }
    }

    // Dealer hits to beat player score
    while (dealerEval.total < playerEval.total && dealerEval.total < 21) {
      const card = deck.draw();
      card.faceUp = true;
      dealerHand.push(card);
      dealerEval = evaluateHand(dealerHand);
      await ui.showRound(handsMap, dealerHand, tension);
    }

    // Apply Super Brain Level 3 Ability: Dealer redraws once in case of a bust
    let brainRedrawUsed = false;
    if (adversary.id === 'super_brain' && adversary.level === 3 && dealerEval.isBust && !brainRedrawUsed) {
      dealerHand.pop(); // Remove busted card
      const newCard = deck.draw();
      newCard.faceUp = true;
      dealerHand.push(newCard);
      dealerEval = evaluateHand(dealerHand);
      brainRedrawUsed = true;
      await ui.showRound(handsMap, dealerHand, tension);
    }

    // 5. Evaluate Combat Round Results
    let isPush = dealerEval.total === playerEval.total;
    let dealerWins = dealerEval.total > playerEval.total && !dealerEval.isBust;
    let playerWins = dealerEval.isBust || playerEval.total > dealerEval.total;

    // Apply Bio-Drinker Level 3 Ability: Ties (Pushes) are failures unless player has Security Aptitude
    if (adversary.id === 'bio_drinker' && adversary.level === 3 && isPush) {
      const isSecurity = canUseAptitude && player.aptitude === 'Security';
      if (!isSecurity) {
        isPush = false;
        dealerWins = true; // Treats tie as dealer win
      }
    }

    if (playerWins) {
      // Success: decrease Adversary HP
      hp--;
      tension = 0;
      gameStateStore.logMessage(`${player.name} wins the exchange against ${adversary.name}! (${playerEval.total} vs ${dealerEval.total})`);
      if (hp > 0) {
        await ui.showTestResult({
          outcome: 'WIN',
          finalPlayerTotal: playerEval.total,
          finalDealerTotal: dealerEval.total,
          traitsExhausted: []
        }, true);
      }
    } else if (dealerWins) {
      // Failure: increase tension for the next hand
      tension++;
      gameStateStore.logMessage(`${adversary.name} gains the upper hand! (${dealerEval.total} vs ${playerEval.total})`);
      gameEventBus.emit('narrative_triggered', {
        type: 'RISING_TENSION',
        context: {
          characterName: player.name,
        }
      });
      await ui.showTestResult({
        outcome: 'LOSE',
        finalPlayerTotal: playerEval.total,
        finalDealerTotal: dealerEval.total,
        traitsExhausted: []
      }, true);
    } else if (isPush) {
      // Push: re-deal hand without increasing tension
      gameStateStore.logMessage(`Push! Both lock horns in a stalemate. (${playerEval.total} vs ${dealerEval.total})`);
      await ui.showTestResult({
        outcome: 'PUSH',
        finalPlayerTotal: playerEval.total,
        finalDealerTotal: dealerEval.total,
        traitsExhausted: []
      }, true);
      continue;
    }

    // Apply Energy Form Level 3 Ability: if injured but not fully eliminated, splits into three Level 1s that flee
    if (adversary.id === 'energy_form' && adversary.level === 3 && hp < 3 && hp > 0) {
      // In a real game context, this splits and flees (meaning combat ends and spawns others)
      // We will set hp to 0 to end combat and note that the entity split
      return {
        defeated: false,
        playerEscaped: false,
        traitsExhausted,
        successesRemaining: 1,
        disposition: 'fled'
      };
    }
  }

  const defeated = hp <= 0;
  const disposition: AdversaryDisposition = defeated
    ? (canDefeatInRegularCombat ? 'defeated' : 'temporarily_driven_off')
    : (playerEscaped ? 'fled' : 'chasing');
  return {
    defeated: defeated && canDefeatInRegularCombat,
    playerEscaped,
    traitsExhausted,
    successesRemaining: defeated && canDefeatInRegularCombat ? 0 : Math.max(1, hp),
    disposition
  };
}
