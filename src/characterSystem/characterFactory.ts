import { Character, AptitudeType, Gear, Trait, AIPersonality } from './characterTypes';
import { PREGEN_ROSTER } from './pregenRoster';

/**
 * Generates a unique character ID.
 */
function generateId(): string {
  return 'char_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Creates a new Character with default states.
 */
export function generateRandomAIProfile(): AIPersonality {
  const riskTolerances: ('cautious' | 'balanced' | 'reckless')[] = ['cautious', 'balanced', 'reckless'];
  const gearStyles: ('selfish' | 'altruistic' | 'tactical')[] = ['selfish', 'altruistic', 'tactical'];
  const explosiveStyles: ('reckless' | 'cautious')[] = ['reckless', 'cautious'];
  const weaponStyles: ('aggressive' | 'defensive')[] = ['aggressive', 'defensive'];
  const spacesuitStyles: ('selfish' | 'altruistic')[] = ['selfish', 'altruistic'];

  return {
    crisisPropensity: Math.random(),
    explorationDrive: Math.random(),
    riskTolerance: riskTolerances[Math.floor(Math.random() * riskTolerances.length)],
    gearPreferences: {
      medkit: gearStyles[Math.floor(Math.random() * gearStyles.length)],
      weapon: weaponStyles[Math.floor(Math.random() * weaponStyles.length)],
      explosive: explosiveStyles[Math.floor(Math.random() * explosiveStyles.length)],
      spacesuit: spacesuitStyles[Math.floor(Math.random() * spacesuitStyles.length)]
    }
  };
}

export function createCharacter(config: {
  name: string;
  concept: string;
  aptitude: AptitudeType;
  traits: Trait[];
  gear?: Gear;
  isAI?: boolean;
  aiProfile?: AIPersonality;
}): Character {
  return {
    id: generateId(),
    name: config.name,
    concept: config.concept,
    traits: config.traits.map(t => ({ ...t, exhausted: false, busted: false })),
    aptitude: config.aptitude,
    gear: config.gear || null,
    isDead: false,
    isAI: config.isAI || false,
    aiProfile: config.aiProfile || (config.isAI ? generateRandomAIProfile() : undefined)
  };
}

/**
 * Creates a character from one of the pregenerated templates.
 * If the name is not found, throws an error.
 */
export function createPregenCharacter(pregenName: string, isAI: boolean = false): Character {
  const template = PREGEN_ROSTER.find(p => p.name.toLowerCase() === pregenName.toLowerCase() || p.concept.toLowerCase() === pregenName.toLowerCase());
  if (!template) {
    throw new Error(`Pregen character template not found for name/concept: ${pregenName}`);
  }

  return {
    id: generateId(),
    name: template.name,
    concept: template.concept,
    traits: template.traits.map(t => ({ ...t })),
    aptitude: template.aptitude,
    gear: template.gear,
    isDead: false,
    isAI,
    aiProfile: template.aiProfile
  };
}

/**
 * Generates a completely random custom character (useful for quick start or random AI NPCs).
 */
export function createRandomCharacter(isAI: boolean = false): Character {
  const firstSyllables = ["Ves", "Dak", "Kor", "Nim", "Zal", "Tev", "Brek", "Ral", "Cen", "Mor", "Jax", "Quin", "Yor", "Zan"];
  const secondSyllables = ["rin", "tar", "las", "na", "to", "vek", "lis", "dor", "ka", "th", "on", "us"];
  const lastNames = ["Obal", "Kesh", "Tarn", "Riker", "Drax", "Surn", "Voss", "Bane", "Cort", "Rey", "Jin"];

  const concepts = ['Rookie Pilot', 'Cynical Officer', 'Resourceful Scavenger', 'Hotshot Gunner', 'Absent-minded Tech', 'Stoic Guard'];
  
  const aptitudes: AptitudeType[] = [
    'Android', 'Armored', 'Commander', 'Counselor', 'Engineer',
    'Medic', 'Militant', 'Psychic', 'Sanitation', 'Security',
    'Shapeshifter', 'Science', 'Smuggler', 'Survivor', 'Trainee'
  ];

  const gearOptions: Gear[] = [null, 'spacesuit', 'medkit', 'ranged_weapon', 'melee_weapon', 'explosives'];

  const f1 = firstSyllables[Math.floor(Math.random() * firstSyllables.length)];
  const f2 = secondSyllables[Math.floor(Math.random() * secondSyllables.length)];
  const l = lastNames[Math.floor(Math.random() * lastNames.length)];
  const name = `${f1}${f2} ${l}`;
  
  const concept = concepts[Math.floor(Math.random() * concepts.length)];
  const aptitude = aptitudes[Math.floor(Math.random() * aptitudes.length)];
  const gear = gearOptions[Math.floor(Math.random() * gearOptions.length)];

  const traits: Trait[] = [
    { name: 'Adrenaline Rush', modifier: 3, exhausted: false, busted: false },
    { name: 'Observant', modifier: 2, exhausted: false, busted: false },
    { name: 'Agile', modifier: 1, exhausted: false, busted: false }
  ];

  return {
    id: generateId(),
    name,
    concept,
    traits,
    aptitude,
    gear,
    isDead: false,
    isAI,
    aiProfile: isAI ? generateRandomAIProfile() : undefined
  };
}
