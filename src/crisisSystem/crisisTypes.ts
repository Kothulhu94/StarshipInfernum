export type MajorCrisisType =
  | 'ALIEN_HORROR'
  | 'COLLISION_COURSE'
  | 'CONTAMINATED'
  | 'DEAD_SHIP'
  | 'DIMENSIONAL_RIFT'
  | 'INVASION'
  | 'MUTINY';

export type MinorCrisisType =
  | 'GRAVITY_OFFLINE'
  | 'DOORS_OFFLINE'
  | 'LIFE_SUPPORT_OFFLINE'
  | 'RADIATION_LEAK'
  | 'MISSING_CREWMATES'
  | 'STARSHIP_BATTLE'
  | 'ROGUE_AI'
  | 'EXPERIMENT_GONE_WRONG'
  | 'COMMUNICATIONS_DOWN'
  | 'ENGINES_OUT'
  | 'MASSIVE_HULL_DAMAGE'
  | 'DIGNITARY_ONBOARD'
  | 'LOST';

export interface MajorCrisisDefinition {
  id: MajorCrisisType;
  name: string;
  description: string;
  resolutionRooms: string[]; // Room names where crisis steps can be resolved
  disasterEffect: string; // Narration prompt context for the Joker disaster
}

export interface MinorCrisisDefinition {
  id: MinorCrisisType;
  name: string;
  description: string;
  resolutionRooms: string[];
  rulesModifier: string; // Text description of the mechanical impact
}

export interface MajorCrisisState {
  id: MajorCrisisType;
  jokersRemaining: number;
  jokersTotal: number;
  isUnlocked: boolean; // True once all jokers are removed and we can resolve the crisis card itself
  isResolved: boolean;
}

export interface MinorCrisisState {
  id: MinorCrisisType;
  jokersRemaining: number; // Shuffled into the deck or held on card
  isResolved: boolean;
}

export interface CrisisClockState {
  tokensRemaining: number;
  tokensTotal: number;
}
