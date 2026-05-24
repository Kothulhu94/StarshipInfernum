import { Card, Suit } from '@cardEngine/cardDefinitions';
import { Deck } from '@cardEngine/deckManager';
import { Character } from '@characterSystem/characterTypes';
import { TestResult, TestUI, ObstacleDefinition } from './encounterTypes';
import { OBSTACLE_REGISTRY } from './obstacleRegistry';
import { getAdversaryByCard } from './adversaryRegistry';
import { runSurvivalTest } from './survivalTestRunner';
import { runSimpleTest } from './simpleTestRunner';
import { runGroupTest } from './groupTestRunner';
import { runAdversaryCombat } from './adversaryCombat';

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
    if (['contamination', 'contamination_group', 'oxygen_critical', 'toxic_gas', 'radiation', 'parasite_illness'].includes(obstacle.id)) {
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
): Promise<TestResult | Map<string, TestResult>> {
  const cardCode = getCardCode(card);
  const obstacle = OBSTACLE_REGISTRY[cardCode];

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

  // 1. Check Immunity
  if (checkImmunity(player, obstacle)) {
    return {
      outcome: 'WIN',
      finalPlayerTotal: 21,
      finalDealerTotal: 0,
      traitsExhausted: [],
      damageTaken: undefined
    };
  }

  // 2. Dispatch by Obstacle Type
  switch (obstacle.type) {
    case 'ADVERSARY': {
      // Determine adversary tier level based on rank
      let level: 1 | 2 | 3 = 1;
      if (['7', '8', '9', '10'].includes(card.rank)) level = 2;
      if (['J', 'Q', 'K'].includes(card.rank)) level = 3;

      const adversary = getAdversaryByCard(cardCode, level);
      
      // Warmongers always level 3, except special rules
      const result = await runAdversaryCombat(player, adversary, deadPCs, survivalDeck, ui);
      
      const testResult: TestResult = {
        outcome: result.defeated ? 'WIN' : 'LOSE',
        finalPlayerTotal: 0,
        finalDealerTotal: 0,
        traitsExhausted: result.traitsExhausted
      };
      return testResult;
    }

    case 'PERSONAL': {
      if (obstacle.id === 'cotard_delusion') {
        // Cotard Delusion: Single-hand Survival Test with no Rising Tension
        // We simulate a single round using a simple test but apply Cotard consequences
        const result = await runSimpleTest(player, survivalDeck, ui);
        if (result.outcome === 'LOSE') {
          // Failure sets delusion (handled by state manager; we pass flag or note in result)
          (result as any).cotardDelusionApplied = true;
        }
        return result;
      }
      return await runSurvivalTest(player, deadPCs, survivalDeck, ui);
    }

    case 'GROUP': {
      const activePlayers = [player, ...otherPlayers].filter(p => !p.isDead);
      
      if (obstacle.id === 'crewmate_rescue_group') {
        // Crewmate rescue special rule: draw a second obstacle card
        const secondCard = roDeck.draw();
        const secondObstacle = OBSTACLE_REGISTRY[getCardCode(secondCard)];
        
        if (secondObstacle && secondObstacle.type === 'GROUP') {
          return await runGroupTest(activePlayers, deadPCs, survivalDeck, ui);
        }
      }
      return await runGroupTest(activePlayers, deadPCs, survivalDeck, ui);
    }

    case 'PERSISTENT': {
      if (obstacle.id === 'vermin_swarm') {
        // Vermin swarm: tested individually by each person who encounters it, in turn order
        // Returns the result of the main player, others are handled sequentially by the game flow
        return await runSurvivalTest(player, deadPCs, survivalDeck, ui);
      }
      
      // Standard persistent obstacles can be run as a Group Test or Survival Test depending on action
      const activePlayers = [player, ...otherPlayers].filter(p => !p.isDead);
      return await runGroupTest(activePlayers, deadPCs, survivalDeck, ui);
    }

    default:
      return safetyResult;
  }
}
