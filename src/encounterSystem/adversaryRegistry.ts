import { AdversaryDefinition } from './encounterTypes';

export interface AdversaryData extends AdversaryDefinition {
  level3AbilityName?: string;
  level3AbilityDesc?: string;
}

export const ADVERSARY_REGISTRY: Record<string, AdversaryData> = {
  'alter_dimensional': {
    id: 'alter_dimensional',
    name: 'Alter-Dimensional Entity',
    level: 3, // Mapped dynamically based on card Level (1, 2, or 3)
    description: 'Entity from another plane that can phase out of harm\'s way.',
    level3AbilityName: 'Phase Slip',
    level3AbilityDesc: 'The Dealer may redraw the last card dealt to them in tests against this Adversary, once per test.'
  },
  'assimilator': {
    id: 'assimilator',
    name: 'Assimilator',
    level: 3,
    description: 'Cybernetic or robotic drone seeking to eliminate individuality and merge you into their collective.',
    level3AbilityName: 'Assimilation Swap',
    level3AbilityDesc: 'After the initial cards of a hand are dealt, swap the last card dealt to the Dealer with the last card dealt to the player. Do this for every hand of the test.'
  },
  'bio_drinker': {
    id: 'bio_drinker',
    name: 'Bio-Drinker',
    level: 3,
    description: 'Opportunistic parasite that drains blood, spinal fluid, or nightmares.',
    level3AbilityName: 'Lethal Feed',
    level3AbilityDesc: 'Ties are considered failures instead of Pushes. Security Aptitude treats ties as normal Pushes.'
  },
  'cuddly_breeder': {
    id: 'cuddly_breeder',
    name: 'Cuddly Breeder',
    level: 3,
    description: 'Deceptively harmless fluffy creature that reproduces at an alarming rate.',
    level3AbilityName: 'Exponential Swarm',
    level3AbilityDesc: 'At the end of a full round, if this enemy is not defeated, it spreads to an adjacent room as a weaker offspring.'
  },
  'drone_robot': {
    id: 'drone_robot',
    name: 'Drone / Robot',
    level: 3,
    description: 'Haywire automated service machine or autonomous combat droid.',
    level3AbilityName: 'None',
    level3AbilityDesc: 'No special Level 3 abilities.'
  },
  'energy_form': {
    id: 'energy_form',
    name: 'Energy Form',
    level: 3,
    description: 'Sentient mass of electrical, plasma, or solar energy immune to standard bullets.',
    level3AbilityName: 'Reactive Split',
    level3AbilityDesc: 'If this enemy is injured but not fully eliminated, it splits into three Level 1 Adversaries that flee in different directions.'
  },
  'ghoul_zombie': {
    id: 'ghoul_zombie',
    name: 'Ghoul / Zombie',
    level: 3,
    description: 'Mindless crew corpse animated by alien parasites or nanobots.',
    level3AbilityName: 'None',
    level3AbilityDesc: 'No special Level 3 abilities.'
  },
  'giant_insect': {
    id: 'giant_insect',
    name: 'Giant Insect',
    level: 3,
    description: 'Nesting arachnid or radioactive arthropod seeking food and hosts for eggs.',
    level3AbilityName: 'Double Wound',
    level3AbilityDesc: 'This Adversary causes two Traits of damage on a bust instead of one.'
  },
  'greyskin': {
    id: 'greyskin',
    name: 'Greyskin',
    level: 3,
    description: 'Highly intelligent Grey alien wielding advanced telepathic or stun weaponry.',
    level3AbilityName: 'Tactical Choice',
    level3AbilityDesc: 'Dealer is dealt two face-up cards and chooses one to keep, discarding the other.'
  },
  'hive_mind': {
    id: 'hive_mind',
    name: 'Hive Mind',
    level: 3,
    description: 'Swarm of nanobots, cybernetic cyborgs, or coordinated pests acting under one voice.',
    level3AbilityName: 'Coordinate Swarm',
    level3AbilityDesc: 'Spawns Level 1 versions in all adjacent rooms upon encounter.'
  },
  'pirate_scavenger': {
    id: 'pirate_scavenger',
    name: 'Pirate / Scavenger',
    level: 3,
    description: 'Hostile boarder seeking to loot the ship and eliminate witnesses.',
    level3AbilityName: 'None',
    level3AbilityDesc: 'No special Level 3 abilities.'
  },
  'predatory_horror': {
    id: 'predatory_horror',
    name: 'Predatory Horror',
    level: 3,
    description: 'Intelligent alien beast stalking the corridors and hunting the crew.',
    level3AbilityName: 'Absolute Hunter',
    level3AbilityDesc: 'No Aptitudes may be used in tests against this Adversary.'
  },
  'rogue_crewmate': {
    id: 'rogue_crewmate',
    name: 'Rogue Crewmate',
    level: 3,
    description: 'Saboteur, traitor, or paranoid officer acting for a rival faction.',
    level3AbilityName: 'Traitorous Cut',
    level3AbilityDesc: 'Defeating this Adversary counts as a dead crewmate for any future tests to use a Safety room.'
  },
  'super_brain': {
    id: 'super_brain',
    name: 'Super Brain',
    level: 3,
    description: 'Rogue shipboard mainframe, floating neural node, or brain-in-a-jar master mind.',
    level3AbilityName: 'Predictive Reflex',
    level3AbilityDesc: 'The Dealer may redraw the last card dealt to them in case of a bust (once per test).'
  },
  'warmonger': {
    id: 'warmonger',
    name: 'Warmonger',
    level: 3,
    description: 'Brutal, armor-clad alien soldier bred specifically for warfare.',
    level3AbilityName: 'Brutal Resilience',
    level3AbilityDesc: 'Requires four successes to fully defeat instead of the usual three.'
  }
};

// Helper to select an adversary type based on scenario context or draw index
export function getAdversaryByCard(cardCode: string, level: 1 | 2 | 3): AdversaryData {
  const keys = Object.keys(ADVERSARY_REGISTRY);
  // Pick one deterministically based on character code hash
  let hash = 0;
  for (let i = 0; i < cardCode.length; i++) {
    hash += cardCode.charCodeAt(i);
  }
  const key = keys[hash % keys.length];
  const template = ADVERSARY_REGISTRY[key];
  
  // Return a copy with the level overridden according to card rank
  return {
    ...template,
    level
  };
}
