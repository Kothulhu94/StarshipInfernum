import { Character } from '@characterSystem/characterTypes';
import { damageTrait } from '@characterSystem/traitManager';
import { gameStateStore } from '@gameFlow/gameStateStore';
import { ObstacleDefinition, TestResult, TestUI } from './encounterTypes';

export type ObstacleResolutionState =
  | 'cleared'
  | 'unresolved'
  | 'bypassed'
  | 'contained'
  | 'sealed'
  | 'destroyed';

export interface ObstacleRuleResult extends TestResult {
  obstacleResolution?: ObstacleResolutionState;
}

export type ObstacleDispatchResult = ObstacleRuleResult | Map<string, ObstacleRuleResult>;

export function hasObstacleRule(obstacle: ObstacleDefinition, ruleId: string): boolean {
  return obstacle.specialRules?.includes(ruleId) || false;
}

export function applyPreTestObstacleRules(
  obstacle: ObstacleDefinition,
  player: Character
): ObstacleRuleResult | null {
  if (hasObstacleRule(obstacle, 'spacesuit_bypass') && player.gear === 'spacesuit') {
    player.gear = null;
    gameStateStore.logMessage(`${player.name}'s spacesuit is destroyed while bypassing ${obstacle.name}.`);
    return {
      outcome: 'WIN',
      finalPlayerTotal: 21,
      finalDealerTotal: 0,
      traitsExhausted: [],
      obstacleResolution: 'bypassed',
    };
  }

  return null;
}

export async function applyPostTestObstacleRules(
  obstacle: ObstacleDefinition,
  result: TestResult | Map<string, TestResult>,
  participants: Character[],
  ui: TestUI
): Promise<ObstacleDispatchResult> {
  const normalized = normalizeObstacleResult(result);

  if (obstacle.id === 'extreme_temps') {
    await applyExtraBustDamage(obstacle, normalized, participants, ui);
  }

  applyDefaultResolution(obstacle, normalized);
  return normalized;
}

export function shouldRoomObstacleClear(
  obstacle: ObstacleDefinition,
  result: TestResult | Map<string, TestResult>
): boolean {
  const results = result instanceof Map ? Array.from(result.values()) : [result];
  const explicitStates = results
    .map((entry) => (entry as ObstacleRuleResult).obstacleResolution)
    .filter((state): state is ObstacleResolutionState => !!state);

  if (explicitStates.includes('unresolved')) {
    return false;
  }

  if (explicitStates.length === results.length) {
    return true;
  }

  if (obstacle.type === 'PERSISTENT') {
    return results.length > 0 && results.every((entry) => entry.outcome === 'WIN');
  }

  return true;
}

function normalizeObstacleResult(
  result: TestResult | Map<string, TestResult>
): ObstacleDispatchResult {
  if (!(result instanceof Map)) {
    return result as ObstacleRuleResult;
  }

  const normalized = new Map<string, ObstacleRuleResult>();
  for (const [characterId, entry] of result.entries()) {
    normalized.set(characterId, entry as ObstacleRuleResult);
  }
  return normalized;
}

async function applyExtraBustDamage(
  obstacle: ObstacleDefinition,
  result: ObstacleDispatchResult,
  participants: Character[],
  ui: TestUI
): Promise<void> {
  const entries = result instanceof Map ? Array.from(result.entries()) : [[participants[0]?.id || '', result] as const];

  for (const [characterId, entry] of entries) {
    if (entry.outcome !== 'BUST') continue;

    const character = participants.find((candidate) => candidate.id === characterId);
    if (!character || character.gear === 'spacesuit' || character.aptitude === 'Android') continue;

    const chosenTrait = await ui.promptBustedTraitSelection(character);
    if (!chosenTrait) continue;

    const damageTaken = damageTrait(character, chosenTrait.name);
    if (damageTaken) {
      entry.damageTaken = [entry.damageTaken, damageTaken].filter(Boolean).join(', ');
      gameStateStore.logMessage(`${obstacle.name} causes extra trait damage to ${character.name}: ${damageTaken}.`);
    }
  }
}

function applyDefaultResolution(
  obstacle: ObstacleDefinition,
  result: ObstacleDispatchResult
): void {
  const entries = result instanceof Map ? Array.from(result.values()) : [result];

  for (const entry of entries) {
    if (entry.obstacleResolution) continue;

    if (obstacle.type === 'PERSISTENT') {
      entry.obstacleResolution = entry.outcome === 'WIN' ? 'cleared' : 'unresolved';
    } else {
      entry.obstacleResolution = 'cleared';
    }
  }
}
