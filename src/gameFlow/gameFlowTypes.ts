import { Character } from '@characterSystem/characterTypes';
import { MajorCrisisState, MinorCrisisState } from '@crisisSystem/crisisTypes';
import { ScenarioConfig } from '@scenarioData/scenarioTypes';
import { Card } from '@cardEngine/cardDefinitions';
import { AdversaryInstance } from '@encounterSystem/adversaryStateTypes';

export type GamePhase =
  | 'SETUP'
  | 'EXPLORING'
  | 'OBSTACLE'
  | 'TEST'
  | 'CRISIS_TEST'
  | 'DISASTER'
  | 'GAME_OVER';

export interface GameState {
  gamePhase: GamePhase;
  scenario: ScenarioConfig | null;
  characters: Character[];
  activeCharacterId: string | null;
  majorCrisisState: MajorCrisisState | null;
  minorCrisisState: MinorCrisisState | null;
  majorCrisisCard: Card | null;
  minorCrisisCard: Card | null;
  crisisClockTokensRemaining: number;
  crisisClockTokensTotal: number;
  activeRoomId: string | null;
  currentDeck: number;
  isFatalDisasters: boolean;
  historyLog: string[];
  survivalDeckCards: Card[];
  roDeckCards: Card[];
  drawnJokers: Card[]; // Tracks Jokers drawn during the current reel to shuffle back in
  adversaryInstances: AdversaryInstance[];
}

export interface SerializableGameState {
  gamePhase: GamePhase;
  scenarioId: string | null;
  characters: Character[];
  activeCharacterId: string | null;
  majorCrisisState: MajorCrisisState | null;
  minorCrisisState: MinorCrisisState | null;
  majorCrisisCard: Card | null;
  minorCrisisCard: Card | null;
  crisisClockTokensRemaining: number;
  crisisClockTokensTotal: number;
  activeRoomId: string | null;
  currentDeck: number;
  isFatalDisasters: boolean;
  historyLog: string[];
  survivalDeckCards: Card[];
  roDeckCards: Card[];
  drawnJokers: Card[];
  adversaryInstances: AdversaryInstance[];
  mapGraphSerialized: {
    rooms: any[];
    corridors: any[];
  };
}
