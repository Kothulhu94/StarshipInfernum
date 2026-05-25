export interface Trait {
  name: string;
  modifier: number; // +/- 3, +/- 2, or +/- 1
  exhausted: boolean;
  busted: boolean; // Permanently crossed off
}

export type AptitudeType =
  | 'Android'
  | 'Armored'
  | 'Commander'
  | 'Counselor'
  | 'Engineer'
  | 'Medic'
  | 'Militant'
  | 'Psychic'
  | 'Sanitation'
  | 'Security'
  | 'Shapeshifter'
  | 'Science'
  | 'Smuggler'
  | 'Survivor'
  | 'Trainee';

export type Gear = 'spacesuit' | 'medkit' | 'ranged_weapon' | 'melee_weapon' | 'explosives' | null;

export interface AIPersonality {
  crisisPropensity: number; // 0.0 to 1.0 (likelihood to attempt a crisis if available)
  explorationDrive: number; // 0.0 to 1.0 (likelihood to explore a door over wandering)
  riskTolerance: 'cautious' | 'balanced' | 'reckless'; // Affects Blackjack decisions
  gearPreferences: {
    medkit: 'selfish' | 'altruistic' | 'tactical';
    weapon: 'aggressive' | 'defensive';
    explosive: 'reckless' | 'cautious';
    spacesuit: 'selfish' | 'altruistic';
  };
}

export interface Character {
  id: string;
  name: string;
  concept: string;
  traits: Trait[];
  aptitude: AptitudeType;
  gear: Gear;
  isDead: boolean;
  isAI: boolean;
  roomId: string; // The specific room ID this character is currently in
  aiProfile?: AIPersonality;
  ghostCard?: { suit: string; rank: string }; // Held card for Dead PC ghost swap
}
