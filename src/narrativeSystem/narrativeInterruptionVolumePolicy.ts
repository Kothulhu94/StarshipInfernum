import { NarrativeEventType, NarrativeInterruptionVolume } from './narrativeTypes';

export interface NarrativeVolumePolicy {
  narratedEvents: readonly NarrativeEventType[];
  maxTokens: number;
  promptLengthRule: string;
}

const rareEvents: readonly NarrativeEventType[] = [
  'CRISIS_TRIGGERED',
  'CRISIS_RESOLVED',
  'ADVERSARY_ENCOUNTER',
  'ADVERSARY_DEFEATED',
  'CHARACTER_DEATH',
  'GHOST_FLASHBACK'
];

const frequentEvents: readonly NarrativeEventType[] = [
  ...rareEvents,
  'ROOM_ENTERED',
  'OBSTACLE_REVEALED',
  'TEST_BUST',
  'TEST_SUCCESS',
  'RISING_TENSION'
];

export const narrativeVolumePolicies: Record<NarrativeInterruptionVolume, NarrativeVolumePolicy> = {
  RARE: {
    narratedEvents: rareEvents,
    maxTokens: 90,
    promptLengthRule: 'Write one vivid milestone beat in no more than two sentences.'
  },
  FREQUENT: {
    narratedEvents: frequentEvents,
    maxTokens: 60,
    promptLengthRule: 'Write one compact narration beat in one or two short sentences.'
  },
  CONSTANT: {
    narratedEvents: frequentEvents,
    maxTokens: 36,
    promptLengthRule: 'Write one terse atmospheric line. Do not exceed 18 words.'
  }
};

export function getNarrativeVolumePolicy(volume: NarrativeInterruptionVolume): NarrativeVolumePolicy {
  return narrativeVolumePolicies[volume];
}

export function shouldNarrateEvent(volume: NarrativeInterruptionVolume, eventType: NarrativeEventType): boolean {
  return getNarrativeVolumePolicy(volume).narratedEvents.includes(eventType);
}
