export type NarrativeInterruptionVolume = 'RARE' | 'FREQUENT' | 'CONSTANT';
export type VerbosityLevel = NarrativeInterruptionVolume;

export type NarrativeEventType = 
  | 'ROOM_ENTERED'
  | 'OBSTACLE_REVEALED'
  | 'TEST_BUST'
  | 'TEST_SUCCESS'
  | 'CRISIS_TRIGGERED'
  | 'CRISIS_RESOLVED'
  | 'ADVERSARY_ENCOUNTER'
  | 'ADVERSARY_DEFEATED'
  | 'RISING_TENSION'
  | 'CHARACTER_DEATH'
  | 'GHOST_FLASHBACK';

export interface PromptContext {
  scenarioName: string;
  characterName: string;
  characterTraits: string[];
  roomName?: string;
  obstacleName?: string;
  adversaryName?: string;
  scenarioId?: string;
  extraContext?: string;
}

export interface NarrativeEvent {
  type: NarrativeEventType;
  context: PromptContext;
  preWrittenText?: string;
}
