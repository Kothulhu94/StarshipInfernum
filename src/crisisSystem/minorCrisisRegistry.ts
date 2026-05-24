import { MinorCrisisType, MinorCrisisDefinition } from './crisisTypes';

export const MINOR_CRISIS_REGISTRY: Record<MinorCrisisType, MinorCrisisDefinition> = {
  GRAVITY_OFFLINE: {
    id: 'GRAVITY_OFFLINE',
    name: 'Gravity Offline',
    description: 'The gravity stabilizers are offline, leaving objects and crew floating.',
    resolutionRooms: ['Engineering', 'Repair Shop'],
    rulesModifier: 'No weapons may be used while this Crisis is unresolved.'
  },
  DOORS_OFFLINE: {
    id: 'DOORS_OFFLINE',
    name: 'Doors Offline',
    description: 'Power to doors is offline. Passageways remain open behind crew members.',
    resolutionRooms: ['Security HQ'],
    rulesModifier: 'Adversaries can chase players into adjacent rooms with no obstacle blocking doors.'
  },
  LIFE_SUPPORT_OFFLINE: {
    id: 'LIFE_SUPPORT_OFFLINE',
    name: 'Life Support Offline',
    description: 'Oxygen levels are critically low across the ship.',
    resolutionRooms: ['Life Support'],
    rulesModifier: 'Safety rooms cannot be used to recover Exhausted Traits, and players are unable to run away from Adversaries.'
  },
  RADIATION_LEAK: {
    id: 'RADIATION_LEAK',
    name: 'Radiation Leak',
    description: 'The power core is critial, emitting massive radiation.',
    resolutionRooms: ['Power Core Room'],
    rulesModifier: 'The Radiation, Illness, and Cotard Delusion obstacles begin with one round of automatic Rising Tension.'
  },
  MISSING_CREWMATES: {
    id: 'MISSING_CREWMATES',
    name: 'Missing Crewmates',
    description: 'Key crew members holding code overrides have vanished.',
    resolutionRooms: ['Crew Quarters'],
    rulesModifier: 'Attempts to resolve the Major Crisis may not be undertaken until this crisis is completely resolved.'
  },
  STARSHIP_BATTLE: {
    id: 'STARSHIP_BATTLE',
    name: 'Starship Battle',
    description: 'The ship is taking heavy fire from an alien vessel.',
    resolutionRooms: ['Weapons & Shield Control'],
    rulesModifier: 'All Hull Breach, External Impact, and Explosion obstacles begin with one round of automatic Rising Tension.'
  },
  ROGUE_AI: {
    id: 'ROGUE_AI',
    name: 'Rogue AI',
    description: 'The shipboard AI is hostily hacking primary defense and vent networks.',
    resolutionRooms: ['Central Server Room'],
    rulesModifier: 'All Security Malfunction, Toxic Gas, and Electricity obstacles begin with one round of automatic Rising Tension.'
  },
  EXPERIMENT_GONE_WRONG: {
    id: 'EXPERIMENT_GONE_WRONG',
    name: 'Experiment Gone Wrong',
    description: 'An experiment in the lab has ruptured containment, mutating lifeforms.',
    resolutionRooms: ['Science Lab'],
    rulesModifier: 'All Adversaries are automatically one level higher.'
  },
  COMMUNICATIONS_DOWN: {
    id: 'COMMUNICATIONS_DOWN',
    name: 'Communications Down',
    description: 'The shipwide communication grid is dead.',
    resolutionRooms: ['Communication Room'],
    rulesModifier: 'Prevents players in EVA suits or in separate rooms from talking to each other and coordinating.'
  },
  ENGINES_OUT: {
    id: 'ENGINES_OUT',
    name: 'Engines Out',
    description: 'The ship has run out of fuel or the thruster manifolds have blown.',
    resolutionRooms: ['Engineering'],
    rulesModifier: 'All Dimensional Rift, External Impact, and Claustrophobia obstacles begin with one round of automatic Rising Tension.'
  },
  MASSIVE_HULL_DAMAGE: {
    id: 'MASSIVE_HULL_DAMAGE',
    name: 'Massive Hull Damage',
    description: 'A large section of the ship is structurally obliterated.',
    resolutionRooms: ['Repair Shop'],
    rulesModifier: 'Five random cards from the Room & Obstacle deck are set aside (inaccessible rooms) until resolved.'
  },
  DIGNITARY_ONBOARD: {
    id: 'DIGNITARY_ONBOARD',
    name: 'Dignitary Onboard',
    description: 'An important civilian passenger is lost somewhere on the ship.',
    resolutionRooms: ['Lounge'],
    rulesModifier: 'Crew members are unable to use ranged weapons or explosives for fear of injuring the VIP.'
  },
  LOST: {
    id: 'LOST',
    name: 'Lost',
    description: 'The ship has been thrown off course into uncharted space.',
    resolutionRooms: ['Navigation Room'],
    rulesModifier: 'All personal Survival Tests begin with one round of automatic Rising Tension.'
  }
};
