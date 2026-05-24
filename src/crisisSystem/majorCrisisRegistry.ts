import { MajorCrisisType, MajorCrisisDefinition } from './crisisTypes';

export const MAJOR_CRISIS_REGISTRY: Record<MajorCrisisType, MajorCrisisDefinition> = {
  ALIEN_HORROR: {
    id: 'ALIEN_HORROR',
    name: 'Alien Horror',
    description: 'A predatory alien stalks the ship, killing off the crew one by one.',
    resolutionRooms: ['Hangar Bay', 'Engineering', 'Life Support'],
    disasterEffect: 'The Alien Horror ambushes the group. Only crew members in the room where the Joker was drawn must participate in this Disaster.'
  },
  COLLISION_COURSE: {
    id: 'COLLISION_COURSE',
    name: 'Collision Course',
    description: 'The ship is on a crash course with a star, black hole, or giant asteroid.',
    resolutionRooms: ['Navigation Room', 'Command Bridge', 'Power Core Room'], // Core Room representing emergency thrusters
    disasterEffect: 'Turbulence rocks through the ship, threatening to collapse hull sections or create a hull breach.'
  },
  CONTAMINATED: {
    id: 'CONTAMINATED',
    name: 'Contaminated',
    description: 'The entire crew is sick with an extinction-level pathogen, and it is getting worse.',
    resolutionRooms: ['Medbay', 'Science Lab', 'Life Support', 'Engineering', 'Escape Pods'],
    disasterEffect: 'Symptoms of the illness develop in the PCs, or their existing symptoms worsen.'
  },
  DEAD_SHIP: {
    id: 'DEAD_SHIP',
    name: 'Dead Ship',
    description: 'Adrift and disabled, the ship has totally lost power and life support is failing.',
    resolutionRooms: ['Power Core Room', 'Engineering'],
    disasterEffect: 'Power spikes cause explosions, oxygen runs out, and heavy doors close suddenly, threatening to crush those in the way.'
  },
  DIMENSIONAL_RIFT: {
    id: 'DIMENSIONAL_RIFT',
    name: 'Dimensional Rift',
    description: 'The fabric of space-time has ruptured, drawing the ship into an alternate dimension where reality breaks down.',
    resolutionRooms: ['Science Lab', 'Central Server Room', 'Power Core Room'],
    disasterEffect: 'Reality twists, causing crew members to mutate, phase shift, or warp locations.'
  },
  INVASION: {
    id: 'INVASION',
    name: 'Invasion',
    description: 'Hostile boarders have breached the hangar bays and are searching the ship room by room.',
    resolutionRooms: ['Armory', 'Security HQ', 'Hangar Bay'],
    disasterEffect: 'A squad of invaders boards the area and attacks.'
  },
  MUTINY: {
    id: 'MUTINY',
    name: 'Mutiny',
    description: 'Pirates or disgruntled crewmates have rebelled, retaking sections and isolating survivors.',
    resolutionRooms: ['Security HQ', 'Communication Room'],
    disasterEffect: 'An armed squad of mutineers appears and attacks, or security traps trigger as the crew passes by.'
  }
};
