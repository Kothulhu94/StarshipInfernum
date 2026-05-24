import { Deck } from '@cardEngine/deckManager';
import { Character } from '@characterSystem/characterTypes';
import { TestUI, TestResult, EVAState } from './encounterTypes';
import { runSimpleTest } from './simpleTestRunner';
import { runSurvivalTest } from './survivalTestRunner';

/**
 * Checks if a Character is eligible to start an EVA.
 * Must be in a room with EVA access and must have the Android aptitude or carry a spacesuit.
 */
export function canInitiateEVA(character: Character, roomName: string, roomHasEvaFeature: boolean): boolean {
  if (!roomHasEvaFeature && roomName !== 'Airlock' && roomName !== 'Hangar Bay') {
    return false;
  }
  return character.aptitude === 'Android' || character.gear === 'spacesuit';
}

/**
 * Resolves one round of EVA Travel along the hull of the ship.
 * Uses the Room & Obstacle deck.
 * On success, adds 1 travel counter. On bust, inflicts damage.
 */
export async function runEVATravelStep(
  character: Character,
  roDeck: Deck,
  ui: TestUI,
  state: EVAState
): Promise<{ success: boolean; bust: boolean; hazardCheckTriggered: boolean }> {
  // If wearing a spacesuit, cannot use traits. This constraint is passed to runSimpleTest.
  // Since spacesuit blocks traits, we temporarily exhaust all traits or rely on ui/runner to block.
  // We can pass a flag or handle it by temporarily disabling trait availability.
  const originalTraitsState = character.traits.map(t => ({ ...t }));
  const isWearingSpacesuit = character.gear === 'spacesuit';
  if (isWearingSpacesuit) {
    character.traits.forEach(t => t.exhausted = true); // temporarily disable traits
  }

  const result = await runSimpleTest(character, roDeck, ui);

  // Restore traits if they were temporarily exhausted
  if (isWearingSpacesuit) {
    character.traits.forEach((t, i) => {
      t.exhausted = originalTraitsState[i].exhausted;
    });
  }

  if (result.outcome === 'WIN') {
    state.travelCounters++;
    const hazardCheckTriggered = state.travelCounters % 3 === 0;
    return { success: true, bust: false, hazardCheckTriggered };
  } else if (result.outcome === 'BUST') {
    return { success: false, bust: true, hazardCheckTriggered: false };
  } else {
    // Failure: no progress, no damage
    return { success: false, bust: false, hazardCheckTriggered: false };
  }
}

/**
 * Resolves an external repair test (to fix a crisis step).
 * Runs as a standard Survival Test using the Survival deck.
 */
export async function runEVARepairStep(
  character: Character,
  deadPCs: Character[],
  deck: Deck,
  ui: TestUI
): Promise<TestResult> {
  const isWearingSpacesuit = character.gear === 'spacesuit';
  const originalTraitsState = character.traits.map(t => ({ ...t }));
  if (isWearingSpacesuit) {
    character.traits.forEach(t => t.exhausted = true);
  }

  const result = await runSurvivalTest(character, deadPCs, deck, ui);

  if (isWearingSpacesuit) {
    character.traits.forEach((t, i) => {
      t.exhausted = originalTraitsState[i].exhausted;
    });
  }

  return result;
}

/**
 * Resolves the mandatory Hazards Survival Test triggered every 3 travel counters.
 * Runs as a Survival Test using the Survival deck.
 */
export async function runEVAHazardCheck(
  character: Character,
  deadPCs: Character[],
  deck: Deck,
  ui: TestUI
): Promise<TestResult> {
  const isWearingSpacesuit = character.gear === 'spacesuit';
  const originalTraitsState = character.traits.map(t => ({ ...t }));
  if (isWearingSpacesuit) {
    character.traits.forEach(t => t.exhausted = true);
  }

  const result = await runSurvivalTest(character, deadPCs, deck, ui);

  if (isWearingSpacesuit) {
    character.traits.forEach((t, i) => {
      t.exhausted = originalTraitsState[i].exhausted;
    });
  }

  return result;
}

/**
 * Resolves one step of returning to the ship.
 * Requires a Simple Test to remove one travel counter.
 * For every 3 counters removed, triggers a hazard check.
 * Returned is true when counters reach 0.
 */
export async function runEVAReturnStep(
  character: Character,
  roDeck: Deck,
  ui: TestUI,
  state: EVAState
): Promise<{ success: boolean; bust: boolean; returned: boolean; hazardCheckTriggered: boolean }> {
  if (state.travelCounters <= 0) {
    return { success: true, bust: false, returned: true, hazardCheckTriggered: false };
  }

  const isWearingSpacesuit = character.gear === 'spacesuit';
  const originalTraitsState = character.traits.map(t => ({ ...t }));
  if (isWearingSpacesuit) {
    character.traits.forEach(t => t.exhausted = true);
  }

  const result = await runSimpleTest(character, roDeck, ui);

  if (isWearingSpacesuit) {
    character.traits.forEach((t, i) => {
      t.exhausted = originalTraitsState[i].exhausted;
    });
  }

  if (result.outcome === 'WIN') {
    state.travelCounters--;
    const returned = state.travelCounters === 0;
    // Hazard check triggers on every 3rd counter removed (i.e. remaining counters division check)
    // Wait, the guide says: "For every three counters removed, they must face a Survival Test"
    const hazardCheckTriggered = !returned && state.travelCounters % 3 === 0;
    return { success: true, bust: false, returned, hazardCheckTriggered };
  } else if (result.outcome === 'BUST') {
    return { success: false, bust: true, returned: false, hazardCheckTriggered: false };
  } else {
    return { success: false, bust: false, returned: false, hazardCheckTriggered: false };
  }
}
