import { AptitudeType } from './characterTypes';

export type AptitudeTriggerPoint =
  | 'BEFORE_EXPLORE'       // e.g. Sanitation (peek/choose rooms)
  | 'GAME_START'           // e.g. Militant (bonus gear), Smuggler (extra card)
  | 'OBSTACLE_IMMUNITY'    // e.g. Android (immune to gas/temp/oxygen/radiation)
  | 'RISING_TENSION'       // e.g. Armored (ignore RT vs adversary), Counselor (ignore RT vs panic)
  | 'DEALER_INITIAL'       // e.g. Psychic (dealer face-up first hand)
  | 'PLAYER_CARD_DEALT'    // e.g. Commander (swap card), Shapeshifter (swap with dealer), Smuggler (swap with backup)
  | 'TIE_RESOLUTION'       // e.g. Security (win ties vs adversaries)
  | 'PLAYER_BUSTED'        // e.g. Science (redraw last card), Trainee (replace busted card)
  | 'CRISIS_REPAIR_FAILED' // e.g. Engineer (second attempt)
  | 'MEDKIT_HEAL'          // e.g. Medic (heal busted trait)
  | 'DISASTER_ROUND_END'   // e.g. Survivor (hide from disaster)
  | 'SPECIAL_ROOM_ACTION'; // e.g. Android (recover in repair shop)

export interface AptitudeDefinition {
  id: AptitudeType;
  name: string;
  description: string;
  triggerPoints: AptitudeTriggerPoint[];
  rulesText: string;
}

export const APTITUDE_REGISTRY: Record<AptitudeType, AptitudeDefinition> = {
  Android: {
    id: 'Android',
    name: 'Android',
    description: 'A synthetic construct unaffected by human vulnerabilities.',
    triggerPoints: ['OBSTACLE_IMMUNITY', 'SPECIAL_ROOM_ACTION'],
    rulesText: 'You are unaffected by the Extreme Temperature, Lack of Oxygen, and Toxic Gas obstacles and may perform an EVA without a spacesuit. In addition, you can attempt a Simple Test in the Repair Shop once per game to recover a single lost Trait of damage.'
  },
  Armored: {
    id: 'Armored',
    name: 'Armored',
    description: 'Equipped with heavy protective plating or natural carapace.',
    triggerPoints: ['RISING_TENSION'],
    rulesText: 'Due to military equipment or your unique biology, you may ignore one round of Rising Tension in all tests versus Adversaries.'
  },
  Commander: {
    id: 'Commander',
    name: 'Commander',
    description: 'A natural leader skilled at coordinating high-stress teamwork.',
    triggerPoints: ['PLAYER_CARD_DEALT'],
    rulesText: 'You may swap the last card you were dealt with the last card dealt to any other player in a Group Test. This may allow you to retroactively bust. Usable once per test.'
  },
  Counselor: {
    id: 'Counselor',
    name: 'Counselor',
    description: 'Trained to help others manage panic, fear, and cognitive dissonance.',
    triggerPoints: ['RISING_TENSION'],
    rulesText: 'You have insight to the way the mind works. You may ignore one round of Rising Tension in tests that attack your psyche (Panic, Claustrophobia, Paranoia, etc.).'
  },
  Engineer: {
    id: 'Engineer',
    name: 'Engineer',
    description: 'A mechanical wizard capable of fixing complex reactors under fire.',
    triggerPoints: ['CRISIS_REPAIR_FAILED'],
    rulesText: 'If you fail to repair a system when resolving a Crisis, you may take an immediate second attempt.'
  },
  Medic: {
    id: 'Medic',
    name: 'Medic',
    description: 'A trauma specialist whose medical kits restore permanent damage.',
    triggerPoints: ['MEDKIT_HEAL'],
    rulesText: 'You may heal a Busted Trait on yourself or another character with a medkit obtained from the Med Bay, Escape Pods, or Science Lab. Medkits are one use items and may only be used after the immediate obstacle in a room has been eliminated.'
  },
  Militant: {
    id: 'Militant',
    name: 'Militant',
    description: 'An armed operative who maintains a varied arsenal.',
    triggerPoints: ['GAME_START'],
    rulesText: 'You start with your choice of a ranged or melee weapon, or explosives. In addition, if you find them on the ship, you may continue to hold one of each (violating the standard 1-gear limit).'
  },
  Psychic: {
    id: 'Psychic',
    name: 'Psychic',
    description: 'Sensory pathways adapted to read minds and read dealer intentions.',
    triggerPoints: ['DEALER_INITIAL'],
    rulesText: 'The Dealer plays with both cards face up in all solo tests against this character. This applies to the first hand of the test only.'
  },
  Sanitation: {
    id: 'Sanitation',
    name: 'Sanitation',
    description: 'Knows every exhaust pipe, vent shaft, and maintenance chute on the ship.',
    triggerPoints: ['BEFORE_EXPLORE'],
    rulesText: 'You may flip two room cards before entering and choose which one it will be. The other card becomes the obstacle for that room.'
  },
  Security: {
    id: 'Security',
    name: 'Security',
    description: 'A tactical defender who excels at hand-to-hand combat.',
    triggerPoints: ['TIE_RESOLUTION'],
    rulesText: 'Through strength and tactics, you can gain the upper hand against any Adversary. You always win ties in tests versus Adversaries.'
  },
  Shapeshifter: {
    id: 'Shapeshifter',
    name: 'Shapeshifter',
    description: 'Able to alter physical form or replicate card values.',
    triggerPoints: ['PLAYER_CARD_DEALT'],
    rulesText: 'You may swap the last card dealt to you with the Dealer\'s face-up card, once per test.'
  },
  Science: {
    id: 'Science',
    name: 'Science',
    description: 'A meticulous researcher who uses data to correct critical errors.',
    triggerPoints: ['PLAYER_BUSTED'],
    rulesText: 'Once per test, you may redraw the last card dealt to you in a bust on a non-Adversary Survival Test.'
  },
  Smuggler: {
    id: 'Smuggler',
    name: 'Smuggler',
    description: 'Carries a hidden pocket card and knows how to cheat.',
    triggerPoints: ['GAME_START', 'PLAYER_CARD_DEALT'],
    rulesText: 'You are dealt a single card from the Survival Deck at the start of the game. You may swap this card with the last one dealt to you, once per test. The new card remains with you for future use.'
  },
  Survivor: {
    id: 'Survivor',
    name: 'Survivor',
    description: 'Expert at staying out of sight and letting others take the fall.',
    triggerPoints: ['DISASTER_ROUND_END'],
    rulesText: 'If you survive the first round of a Disaster, you may slink away and hide thus ignoring any further rounds of that test.'
  },
  Trainee: {
    id: 'Trainee',
    name: 'Trainee',
    description: 'Inexperienced and prone to mistakes, but occasionally lucky.',
    triggerPoints: ['PLAYER_BUSTED'],
    rulesText: 'In Group Tests where you are present, the first player to bust (including yourself) may curse your name and immediately draw a new card to replace their last one. Usable once per test.'
  }
};
