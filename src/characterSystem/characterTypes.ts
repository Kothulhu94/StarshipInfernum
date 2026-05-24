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

export interface Character {
  id: string;
  name: string;
  concept: string;
  traits: Trait[];
  aptitude: AptitudeType;
  gear: Gear;
  isDead: boolean;
  isAI: boolean;
  ghostCard?: { suit: string; rank: string }; // Held card for Dead PC ghost swap
}
