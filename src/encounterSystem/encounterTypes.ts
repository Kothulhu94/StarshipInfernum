import { Card } from '@cardEngine/cardDefinitions';
import { Character, Trait } from '@characterSystem/characterTypes';

export type ObstacleType = 'PERSISTENT' | 'ADVERSARY' | 'PERSONAL' | 'GROUP' | 'SAFETY';

export interface ObstacleDefinition {
  id: string;
  name: string;
  cardCode: string; // e.g., "2S", "AH", "8D", "5C"
  type: ObstacleType;
  flavorText: string;
  rulesText: string;
  specialRules?: string[]; // e.g. ["spacesuit_bypass", "spacesuit_immune", "single_hand_no_tension"]
}

export interface AdversaryDefinition {
  id: string;
  name: string;
  level: 1 | 2 | 3;
  description: string;
  abilities?: string[];
}

export type ResolutionOutcome = 'WIN' | 'LOSE' | 'PUSH' | 'BUST';

export interface TestResult {
  outcome: ResolutionOutcome;
  finalPlayerTotal: number;
  finalDealerTotal: number;
  traitsExhausted: string[];
  damageTaken?: string; // Name of the Trait permanently lost if busted
}

export interface EVAState {
  travelCounters: number;
  repairProgress: number;
}

export interface TestUI {
  showRound(playerHands: Map<string, Card[]>, dealerHand: Card[], tension: number): Promise<void>;
  promptPlayerAction(character: Character, hand: Card[], canUseTrait: boolean): Promise<'HIT' | 'STAND' | { type: 'TRAIT'; traitName: string }>;
  promptDeadPCFlashback(deadChar: Character, livingChar: Character, availableCards: Card[]): Promise<{ cardToGive: Card; flashbackText: string } | null>;
  showTestResult(result: TestResult, keepOverlayOpen?: boolean): Promise<void>;
  promptBustedTraitSelection(character: Character): Promise<Trait | null>;
}

