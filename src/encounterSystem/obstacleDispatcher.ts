import { Card, Suit } from '@cardEngine/cardDefinitions';
import { Deck } from '@cardEngine/deckManager';
import { Character } from '@characterSystem/characterTypes';
import { TestResult, TestUI, ObstacleDefinition } from './encounterTypes';
import { getHydratedObstacle } from './obstacleRegistry';
import { runSurvivalTest } from './survivalTestRunner';
import { runSimpleTest } from './simpleTestRunner';
import { runGroupTest } from './groupTestRunner';
import { runAdversaryCombat } from './adversaryCombat';
import { gameStateStore } from '@gameFlow/gameStateStore';
import { getOrCreateAdversaryInstance, applyAdversaryCombatStateUpdate } from './adversaryStateManager';
import { canPlayerFleeAdversary, moveChasingAdversariesTowardRoom } from './adversaryChaseMovement';
import {
  getScenarioAdversaryByCard,
  shouldRegularCombatDefeatAdversary,
} from './adversaryScenarioRules';
import {
  applyPostTestObstacleRules,
  applyPreTestObstacleRules,
  hasObstacleRule,
  ObstacleDispatchResult,
} from './obstacleSpecialRuleEffects';

/**
 * Checks if a character is immune to a specific obstacle.
 *  - Androids are immune to: extreme temperature, oxygen critical, toxic gas.
 *  - Spacesuits make wearer immune to: contamination, oxygen critical, toxic gas, radiation.
 */
export function checkImmunity(player: Character, obstacle: ObstacleDefinition): boolean {
  if (player.aptitude === 'Android') {
    if (['extreme_temps', 'oxygen_critical', 'toxic_gas'].includes(obstacle.id)) {
      return true;
    }
  }

  if (player.gear === 'spacesuit') {
    if (hasObstacleRule(obstacle, 'spacesuit_immune')) {
      return true;
    }
  }

  return false;
}

/**
 * Translates a card Suit enum and Rank string to the corresponding card code key.
 * e.g., Suit.SPADES, Rank "2" -> "2S"
 */
export function getCardCode(card: Card): string {
  let suitLetter = '';
  switch (card.suit) {
    case Suit.SPADES: suitLetter = 'S'; break;
    case Suit.HEARTS: suitLetter = 'H'; break;
    case Suit.DIAMONDS: suitLetter = 'D'; break;
    case Suit.CLUBS: suitLetter = 'C'; break;
  }
  return `${card.rank}${suitLetter}`;
}

/**
 * Helper to calculate initial tension for an obstacle based on active minor crises.
 */
function getInitialTensionForObstacle(obstacle: ObstacleDefinition): number {
  const state = gameStateStore.getState();
  let initialTension = 0;

  const isMinorCrisisActive = (crisisId: string) => {
    return state.minorCrisisState && 
           state.minorCrisisState.id === crisisId && 
           !state.minorCrisisState.isResolved;
  };

  // 1. RADIATION_LEAK
  if (isMinorCrisisActive('RADIATION_LEAK')) {
    if (['radiation', 'parasite_illness', 'cotard_delusion'].includes(obstacle.id)) {
      initialTension = 1;
    }
  }

  // 2. STARSHIP_BATTLE
  if (isMinorCrisisActive('STARSHIP_BATTLE')) {
    if (['hull_breach', 'external_impact', 'explosion'].includes(obstacle.id)) {
      initialTension = 1;
    }
  }

  // 3. ROGUE_AI
  if (isMinorCrisisActive('ROGUE_AI')) {
    if (['security_malfunction', 'toxic_gas', 'electric_discharge'].includes(obstacle.id)) {
      initialTension = 1;
    }
  }

  // 4. ENGINES_OUT
  if (isMinorCrisisActive('ENGINES_OUT')) {
    if (['dimensional_rift', 'external_impact', 'claustrophobia'].includes(obstacle.id)) {
      initialTension = 1;
    }
  }

  // 5. LOST (All personal Survival Tests begin with one round of automatic Rising Tension)
  if (isMinorCrisisActive('LOST')) {
    if (obstacle.type === 'PERSONAL') {
      initialTension = 1;
    }
  }

  return initialTension;
}

/**
 * Dispatches a drawn obstacle card to the appropriate test runner, applying
 * immunity checks, adversary lookups, and specialized rule hooks.
 */
export async function dispatchObstacle(
  card: Card,
  player: Character,
  otherPlayers: Character[],
  deadPCs: Character[],
  survivalDeck: Deck,
  roDeck: Deck,
  ui: TestUI
): Promise<ObstacleDispatchResult> {
  const cardCode = getCardCode(card);
  const state = gameStateStore.getState();
  const obstacle = getHydratedObstacle(cardCode, state.scenario);

  // Default fallback if card not found or is Safety
  const safetyResult: TestResult = {
    outcome: 'WIN',
    finalPlayerTotal: 0,
    finalDealerTotal: 0,
    traitsExhausted: []
  };

  if (!obstacle || obstacle.type === 'SAFETY') {
    return safetyResult;
  }

  const activePlayers = [player, ...otherPlayers].filter(p => !p.isDead);
  const preTestResult = applyPreTestObstacleRules(obstacle, player);
  if (preTestResult) {
    return preTestResult;
  }

  // 1. Check Immunity
  if (checkImmunity(player, obstacle)) {
    return {
      outcome: 'WIN',
      finalPlayerTotal: 21,
      finalDealerTotal: 0,
      traitsExhausted: [],
      damageTaken: undefined,
      obstacleResolution: obstacle.type === 'PERSISTENT' ? 'bypassed' : 'cleared'
    };
  }

  // 2. Dispatch by Obstacle Type
  const initialTension = getInitialTensionForObstacle(obstacle);
  let result: TestResult | Map<string, TestResult>;
  const activeRoomId = gameStateStore.getState().activeRoomId;

  gameStateStore.updateState((state) => {
    const movedAdversaries = moveChasingAdversariesTowardRoom(
      state,
      gameStateStore.getMapGraph(),
      activeRoomId
    );
    for (const adversaryName of movedAdversaries) {
      state.historyLog.push(`${adversaryName} stalks closer through the ship.`);
    }
  });

  switch (obstacle.type) {
    case 'ADVERSARY': {
      // Determine adversary tier level based on rank
      let level: 1 | 2 | 3 = 1;
      if (['7', '8', '9', '10'].includes(card.rank)) level = 2;
      if (['J', 'Q', 'K'].includes(card.rank)) level = 3;

      const state = gameStateStore.getState();
      const adversary = getScenarioAdversaryByCard(cardCode, level, state.scenario);
      const roomId = state.activeRoomId || 'unknown-room';
      let adversaryInstanceId = '';
      let successesRemaining: number = level;

      gameStateStore.updateState((draftState) => {
        const instance = getOrCreateAdversaryInstance(draftState, adversary, roomId, cardCode);
        instance.disposition = 'ambushing';
        adversaryInstanceId = instance.id;
        successesRemaining = instance.successesRemaining;
      });

      const canDefeat = shouldRegularCombatDefeatAdversary(state.scenario, adversary);
      const combatResult = await runAdversaryCombat(
        player,
        adversary,
        deadPCs,
        survivalDeck,
        ui,
        initialTension,
        successesRemaining,
        canDefeat
      );

      gameStateStore.updateState((draftState) => {
        const canFlee = canPlayerFleeAdversary(draftState);
        applyAdversaryCombatStateUpdate(draftState, adversaryInstanceId, {
          defeated: combatResult.defeated,
          playerEscaped: canFlee && combatResult.playerEscaped,
          successesRemaining: combatResult.successesRemaining,
          disposition: combatResult.defeated
            ? combatResult.disposition
            : (canFlee ? combatResult.disposition : 'chasing'),
        });
      });
      
      const testResult: TestResult = {
        outcome: combatResult.defeated ? 'WIN' : (combatResult.busted ? 'BUST' : 'LOSE'),
        finalPlayerTotal: 0,
        finalDealerTotal: 0,
        traitsExhausted: combatResult.traitsExhausted
      };
      result = testResult;
      break;
    }

    case 'PERSONAL': {
      if (obstacle.id === 'cotard_delusion') {
        // Cotard Delusion: Single-hand Survival Test with no Rising Tension
        // We simulate a single round using a simple test but apply Cotard consequences
        const cotardResult = await runSimpleTest(player, survivalDeck, ui, initialTension);
        if (cotardResult.outcome === 'LOSE') {
          // Failure sets delusion (handled by state manager; we pass flag or note in result)
          (cotardResult as any).cotardDelusionApplied = true;
        }
        result = cotardResult;
        break;
      }
      result = await runSurvivalTest(player, deadPCs, survivalDeck, ui, initialTension);
      break;
    }

    case 'GROUP': {
      if (obstacle.id === 'crewmate_rescue_group') {
        // Crewmate rescue special rule: draw a second obstacle card
        const secondCard = roDeck.draw();
        const secondCardCode = getCardCode(secondCard);
        const secondObstacle = getHydratedObstacle(secondCardCode, gameStateStore.getState().scenario);
        
        if (secondObstacle && secondObstacle.type === 'GROUP') {
          result = await runGroupTest(activePlayers, deadPCs, survivalDeck, ui, true, initialTension);
          break;
        }
      }
      result = await runGroupTest(activePlayers, deadPCs, survivalDeck, ui, true, initialTension);
      break;
    }

    case 'PERSISTENT': {
      if (obstacle.id === 'vermin_swarm') {
        // Vermin swarm: tested individually by each person who encounters it, in turn order
        // Returns the result of the main player, others are handled sequentially by the game flow
        result = await runSurvivalTest(player, deadPCs, survivalDeck, ui, initialTension);
        break;
      }
      
      // Standard persistent obstacles can be run as a Group Test or Survival Test depending on action
      result = await runGroupTest(activePlayers, deadPCs, survivalDeck, ui, true, initialTension);
      break;
    }

    default:
      return safetyResult;
  }

  return await applyPostTestObstacleRules(obstacle, result, activePlayers, ui);
}
