import { Character, AptitudeType, Gear, Trait } from './characterTypes';
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
export function createCharacter(config: {
  name: string;
  concept: string;
  aptitude: AptitudeType;
  traits: Trait[];
  gear?: Gear;
  isAI?: boolean;
}): Character {
  return {
    id: generateId(),
    name: config.name,
    concept: config.concept,
    traits: config.traits.map(t => ({ ...t, exhausted: false, busted: false })),
    aptitude: config.aptitude,
    gear: config.gear || null,
    isDead: false,
    isAI: config.isAI || false
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
    isAI
  };
}

/**
 * Generates a completely random custom character (useful for quick start or random AI NPCs).
 */
export function createRandomCharacter(isAI: boolean = false): Character {
  const firstNames = ['John', 'Sarah', 'Kaelen', 'Elena', 'Marcus', 'Li', 'Alistair', 'Nadia', 'Darius', 'Vesper'];
  const lastNames = ['Shepard', 'Riddick', 'Ripley', 'O\'Connor', 'Chen', 'Vance', 'Mercer', 'Cooper', 'Thorne', 'Aurelia'];
  const concepts = ['Rookie Pilot', 'Cynical Officer', 'Resourceful Scavenger', 'Hotshot Gunner', 'Absent-minded Tech', 'Stoic Guard'];
  
  const aptitudes: AptitudeType[] = [
    'Android', 'Armored', 'Commander', 'Counselor', 'Engineer',
    'Medic', 'Militant', 'Psychic', 'Sanitation', 'Security',
    'Shapeshifter', 'Science', 'Smuggler', 'Survivor', 'Trainee'
  ];

  const gearOptions: Gear[] = [null, 'spacesuit', 'medkit', 'ranged_weapon', 'melee_weapon', 'explosives'];

  const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
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
    isAI
  };
}
