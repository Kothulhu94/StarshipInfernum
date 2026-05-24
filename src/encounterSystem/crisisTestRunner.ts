import { Deck } from '@cardEngine/deckManager';
import { Character } from '@characterSystem/characterTypes';
import { TestUI } from './encounterTypes';
import { runSimpleTest } from './simpleTestRunner';

export type CrisisTestOutcome = 'SUCCESS' | 'FAIL' | 'BUST';

/**
 * Runs a Crisis Test for a Character to resolve a step of a Crisis.
 * Resolves as a single-round Simple Test using the Room & Obstacle deck.
 */
export async function runCrisisTest(
  player: Character,
  roDeck: Deck,
  ui: TestUI
): Promise<{ outcome: CrisisTestOutcome; details: any }> {
  // Crisis Tests are non-fatal (except in the case of a BUST, which causes standard Trait damage)
  // The test itself is run as a Simple Test using the Room & Obstacle Deck
  const result = await runSimpleTest(player, roDeck, ui);

  if (result.outcome === 'WIN') {
    return {
      outcome: 'SUCCESS',
      details: result
    };
  } else if (result.outcome === 'BUST') {
    return {
      outcome: 'BUST',
      details: result
    };
  } else {
    // Simple tests re-deal pushes internally, so only a resolved loss reaches this path.
    return {
      outcome: 'FAIL',
      details: result
    };
  }
}
