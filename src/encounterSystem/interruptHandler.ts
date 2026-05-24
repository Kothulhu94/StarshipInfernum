import { Card } from '@cardEngine/cardDefinitions';
import { Deck } from '@cardEngine/deckManager';
import { Character } from '@characterSystem/characterTypes';
import { TestUI } from './encounterTypes';
import { runSimpleTest } from './simpleTestRunner';

export interface InterruptResult {
  interrupted: boolean;
  interrupterName?: string;
  obstacleResolved: boolean; // True if the obstacle is cleared (either interrupter won, or busted to save original)
  interrupterBusted: boolean;
}

/**
 * Checks if the original hand can be split (first 2 cards match ranks) and handles
 * the interrupt prompt, split deal, and single-hand test for the interrupter.
 */
export async function handlePotentialInterrupt(
  originalPlayer: Character,
  originalHand: Card[],
  otherPlayers: Character[],
  roDeck: Deck,
  ui: TestUI
): Promise<InterruptResult> {
  // A split is only possible if they have exactly 2 cards and they match in rank
  if (originalHand.length !== 2) {
    return { interrupted: false, obstacleResolved: false, interrupterBusted: false };
  }

  const card1 = originalHand[0];
  const card2 = originalHand[1];

  if (card1.rank !== card2.rank) {
    return { interrupted: false, obstacleResolved: false, interrupterBusted: false };
  }

  // Find other characters in the room who are alive and can interrupt
  const eligibleInterrupters = otherPlayers.filter(p => p.id !== originalPlayer.id && !p.isDead);
  if (eligibleInterrupters.length === 0) {
    return { interrupted: false, obstacleResolved: false, interrupterBusted: false };
  }

  // In a real UI, we prompt the player if they want to interrupt
  // We'll use a custom check in promptPlayerAction or define a specific UI hook.
  // For the stub/engine, we can ask the UI if anyone wants to interrupt.
  // Let's assume the UI returns the interrupter character, or null.
  // Let's add a prompt on the UI: "promptInterrupt"
  // Since we did not include promptInterrupt in TestUI, we can cast it or use a custom prompt.
  // Let's check: can we just cast the ui object or check if a method exists?
  // Let's define a method and call it:
  const uiWithInterrupt = ui as any;
  let interrupter: Character | null = null;
  if (typeof uiWithInterrupt.promptInterrupt === 'function') {
    interrupter = await uiWithInterrupt.promptInterrupt(eligibleInterrupters, originalPlayer, originalHand);
  }

  if (!interrupter) {
    return { interrupted: false, obstacleResolved: false, interrupterBusted: false };
  }

  // 1. Split the pair
  const splitCard = originalHand.pop()!; // Remove 2nd card from original player's hand

  // 2. Setup interrupter's hand starting with the split card
  const interrupterHand: Card[] = [splitCard];
  const nextCard = roDeck.draw();
  nextCard.faceUp = true;
  interrupterHand.push(nextCard);

  // Show round for interrupter
  const handsMap = new Map<string, Card[]>();
  handsMap.set(interrupter.id, interrupterHand);
  
  // Run single-round Simple Test for the interrupter
  // Since simple test deals 2 cards, we can pass a dummy deck or let runSimpleTest handle it
  // Let's manually run the single round for interrupter to ensure correct hands are preserved:
  const result = await runSimpleTest(interrupter, roDeck, ui);

  if (result.outcome === 'WIN') {
    // Interrupter wins: focus drawn, obstacle defeated! Original player is safe.
    return {
      interrupted: true,
      interrupterName: interrupter.name,
      obstacleResolved: true,
      interrupterBusted: false
    };
  } else if (result.outcome === 'BUST') {
    // Interrupter busts: damaged, but pulled focus. Original player escapes, does not need to test.
    return {
      interrupted: true,
      interrupterName: interrupter.name,
      obstacleResolved: true,
      interrupterBusted: true
    };
  } else {
    // Interrupter fails (standard loss): out of test, focus returns to original player
    // Draw a new 2nd card for original player
    const replacementCard = roDeck.draw();
    replacementCard.faceUp = true;
    originalHand.push(replacementCard);

    return {
      interrupted: true,
      interrupterName: interrupter.name,
      obstacleResolved: false,
      interrupterBusted: false
    };
  }
}
