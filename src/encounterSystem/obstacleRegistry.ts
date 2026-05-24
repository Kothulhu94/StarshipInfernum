import { ObstacleDefinition } from './encounterTypes';

export interface RoomDefinition {
  cardCode: string;
  name: string;
  features: {
    weapons?: boolean;
    medkit?: boolean;
    explosives?: boolean;
    eva?: boolean;
    special?: boolean;
  };
}

// Maps card codes (e.g. "2S" -> 2 of Spades) to their Room name and features
export const ROOM_REGISTRY: Record<string, RoomDefinition> = {
  // Spades (♠)
  'AS': { cardCode: 'AS', name: 'Airlock', features: { eva: true } },
  '2S': { cardCode: '2S', name: 'Cantina / Mess Hall', features: {} },
  '3S': { cardCode: '3S', name: 'Brig / Interrogation Room', features: {} },
  '4S': { cardCode: '4S', name: 'Hallway', features: {} },
  '5S': { cardCode: '5S', name: 'Command Bridge', features: {} },
  '6S': { cardCode: '6S', name: 'Storage Room', features: { medkit: true, explosives: true } },
  '7S': { cardCode: '7S', name: 'Crew Quarters', features: {} },
  '8S': { cardCode: '8S', name: 'Engineering', features: {} },
  '9S': { cardCode: '9S', name: 'Medbay', features: { medkit: true } },
  '10S': { cardCode: '10S', name: 'Rec Room', features: {} },
  'JS': { cardCode: 'JS', name: 'Ready / War Room', features: {} },
  'QS': { cardCode: 'QS', name: 'Library', features: {} },
  'KS': { cardCode: 'KS', name: 'Science Lab', features: { medkit: true, explosives: true } },

  // Hearts (♥)
  'AH': { cardCode: 'AH', name: 'Lift / Elevator', features: {} },
  '2H': { cardCode: '2H', name: 'Life Support', features: {} },
  '3H': { cardCode: '3H', name: 'Armory', features: { weapons: true } },
  '4H': { cardCode: '4H', name: 'Hallway', features: {} },
  '5H': { cardCode: '5H', name: 'Transporter Room', features: { special: true } },
  '6H': { cardCode: '6H', name: 'Maintenance Tunnel', features: { special: true } },
  '7H': { cardCode: '7H', name: 'Officer Quarters', features: {} },
  '8H': { cardCode: '8H', name: 'Hangar Bay', features: { eva: true } },
  '9H': { cardCode: '9H', name: 'Cargo Bay', features: {} },
  '10H': { cardCode: '10H', name: 'Lounge', features: {} },
  'JH': { cardCode: 'JH', name: 'Weapons & Shield Control', features: {} },
  'QH': { cardCode: 'QH', name: 'Central Server Room', features: {} },
  'KH': { cardCode: 'KH', name: 'Observation Deck', features: {} },

  // Diamonds (♦)
  'AD': { cardCode: 'AD', name: 'Airlock', features: { eva: true } },
  '2D': { cardCode: '2D', name: 'Communication Room', features: {} },
  '3D': { cardCode: '3D', name: 'Navigation Room', features: {} },
  '4D': { cardCode: '4D', name: 'Hallway', features: {} },
  '5D': { cardCode: '5D', name: 'Galley / Kitchen', features: { weapons: true } },
  '6D': { cardCode: '6D', name: 'Vault', features: { special: true } },
  '7D': { cardCode: '7D', name: 'Crew Quarters', features: {} },
  '8D': { cardCode: '8D', name: 'Robotics Lab', features: {} },
  '9D': { cardCode: '9D', name: 'Medbay', features: { medkit: true } },
  '10D': { cardCode: '10D', name: 'Torpedo Room / Turret', features: {} },
  'JD': { cardCode: 'JD', name: 'Locker Room / Bathroom', features: {} },
  'QD': { cardCode: 'QD', name: 'Waste Processing', features: {} },
  'KD': { cardCode: 'KD', name: 'Power Core Room', features: {} },

  // Clubs (♣)
  'AC': { cardCode: 'AC', name: 'Lift / Elevator', features: {} },
  '2C': { cardCode: '2C', name: 'Repair Shop', features: { special: true } },
  '3C': { cardCode: '3C', name: 'Security HQ', features: { weapons: true } },
  '4C': { cardCode: '4C', name: 'Hallway', features: {} },
  '5C': { cardCode: '5C', name: 'Gym', features: {} },
  '6C': { cardCode: '6C', name: 'Maintenance Tunnel', features: { special: true } },
  '7C': { cardCode: '7C', name: 'Laundry Room', features: {} },
  '8C': { cardCode: '8C', name: 'Escape Pods', features: { medkit: true } },
  '9C': { cardCode: '9C', name: 'Administration Office', features: {} },
  '10C': { cardCode: '10C', name: 'Cryopods Room', features: {} },
  'JC': { cardCode: 'JC', name: 'Classroom / Training Room', features: {} },
  'QC': { cardCode: 'QC', name: 'Garden / Hydroponics', features: {} },
  'KC': { cardCode: 'KC', name: 'Science Lab', features: { medkit: true, explosives: true } }
};



// Maps card codes (e.g. "2S" -> 2 of Spades) to their Obstacle definition
export const OBSTACLE_REGISTRY: Record<string, ObstacleDefinition> = {
  // --- SPADES: Persistent Obstacles ---
  'AS': {
    id: 'double_obstacle',
    name: 'Double Obstacle',
    cardCode: 'AS',
    type: 'PERSISTENT',
    flavorText: 'Trouble rarely travels alone in the depths of space.',
    rulesText: 'Draw two more obstacle cards. Both must be resolved to clear the room.',
    specialRules: ['double_draw']
  },
  '2S': {
    id: 'acid',
    name: 'Acid Leak',
    cardCode: '2S',
    type: 'PERSISTENT',
    flavorText: 'Pools of bubbling green acid corrode the floor, giving off a burning stench.',
    rulesText: 'Bust costs 1 Trait. Wearing a spacesuit allows automatic bypass, but destroys the suit.',
    specialRules: ['spacesuit_bypass']
  },
  '3S': {
    id: 'fire',
    name: 'Fire',
    cardCode: '3S',
    type: 'PERSISTENT',
    flavorText: 'Fierce flames consume oxygen and block path.',
    rulesText: 'Must be resolved to pass. Spacesuits protect from heat but prevent trait use.',
    specialRules: ['fire_rules']
  },
  '4S': {
    id: 'radiation',
    name: 'Radiation',
    cardCode: '4S',
    type: 'PERSISTENT',
    flavorText: 'An invisible, silent killer leaks from damaged cooling ducts.',
    rulesText: 'Characters in spacesuits are immune. Others face automatic Rising Tension.',
    specialRules: ['spacesuit_immune']
  },
  '5S': {
    id: 'hull_breach',
    name: 'Hull Breach',
    cardCode: '5S',
    type: 'PERSISTENT',
    flavorText: 'Decompression pulls everything towards a gaping tear in the hull.',
    rulesText: 'Allows EVA transition. Persistent until sealed. Bust causes debris strike damage.',
    specialRules: ['eva_transition', 'persistent']
  },
  '6S': {
    id: 'extreme_pressure',
    name: 'Extreme Pressure',
    cardCode: '6S',
    type: 'PERSISTENT',
    flavorText: 'The atmosphere in this section is compressed to crushing levels.',
    rulesText: 'Simple actions become exhausting tests. Trait modifiers are halved.',
    specialRules: []
  },
  '7S': {
    id: 'vermin_swarm',
    name: 'Vermin Swarm',
    cardCode: '7S',
    type: 'PERSISTENT',
    flavorText: 'A wave of chittering vermin bursts from the ventilation grates.',
    rulesText: 'Acts like an Adversary but tested individually in turn order. Moves rooms if not killed.',
    specialRules: ['vermin_swarm_behavior']
  },
  '8S': {
    id: 'alien_pods',
    name: 'Alien Pods',
    cardCode: '8S',
    type: 'PERSISTENT',
    flavorText: 'Slime-covered pods pulsate obscenely, guarding dormant organisms.',
    rulesText: 'Bust causes an hatchling attack. Can be bypassed with caution or destroyed with fire.',
    specialRules: []
  },
  '9S': {
    id: 'extreme_temps',
    name: 'Extreme Temperatures',
    cardCode: '9S',
    type: 'PERSISTENT',
    flavorText: 'The thermal regulation system has failed, leaving the room freezing or boiling.',
    rulesText: 'Androids are immune. Spacesuits protect. Others take double damage on bust.',
    specialRules: ['spacesuit_immune']
  },
  '10S': {
    id: 'dimensional_rift',
    name: 'Dimensional Rift',
    cardCode: '10S',
    type: 'PERSISTENT',
    flavorText: 'The fabric of space is torn open, glowing with iridescent non-light.',
    rulesText: 'Reroutes paths randomly. Characters passing through must test or warp to a random room.',
    specialRules: []
  },
  'JS': {
    id: 'dangerous_debris',
    name: 'Dangerous Debris',
    cardCode: 'JS',
    type: 'PERSISTENT',
    flavorText: 'Jagged metal and shattered glass float weightless or litter the floor.',
    rulesText: 'Group Test for traversing. Bust causes lacerations (1 Trait damage).',
    specialRules: []
  },
  'QS': {
    id: 'structural_issues',
    name: 'Structural Issues',
    cardCode: 'QS',
    type: 'PERSISTENT',
    flavorText: 'Metal bulkheads groan and buckle under structural stress.',
    rulesText: 'Collapses on a bust, sealing the doorway permanently and damaging occupants.',
    specialRules: []
  },
  'KS': {
    id: 'minor_crisis_persistent',
    name: 'Minor Crisis (Persistent)',
    cardCode: 'KS',
    type: 'PERSISTENT',
    flavorText: 'System failure logs indicate an escalating minor crisis.',
    rulesText: 'Triggers a random Minor Crisis if none is active, or advances the active one.',
    specialRules: ['trigger_minor_crisis']
  },

  // --- HEARTS: Adversaries & Safety ---
  'AH': {
    id: 'safety_hearts',
    name: 'Safety Room',
    cardCode: 'AH',
    type: 'SAFETY',
    flavorText: 'A rare pocket of calm in the midst of chaos.',
    rulesText: 'Allows character resting to recover an Exhausted Trait. Requires test if crewmates are dead.',
    specialRules: ['safety_room_rules']
  },
  // 2H to KH are Adversaries. Mapped dynamically or statically.
  // We'll populate them with default Level 1-3 definitions, mapped to specific adversary indices.
  '2H': { id: 'adv_lvl1_1', name: 'Level 1 Adversary', cardCode: '2H', type: 'ADVERSARY', flavorText: 'A low-level threat crawls out of the shadows.', rulesText: 'Requires 1 success to defeat.', specialRules: ['level_1'] },
  '3H': { id: 'adv_lvl1_2', name: 'Level 1 Adversary', cardCode: '3H', type: 'ADVERSARY', flavorText: 'A hostile intruder spots you.', rulesText: 'Requires 1 success to defeat.', specialRules: ['level_1'] },
  '4H': { id: 'adv_lvl1_3', name: 'Level 1 Adversary', cardCode: '4H', type: 'ADVERSARY', flavorText: 'A security system locks onto you.', rulesText: 'Requires 1 success to defeat.', specialRules: ['level_1'] },
  '5H': { id: 'adv_lvl1_4', name: 'Level 1 Adversary', cardCode: '5H', type: 'ADVERSARY', flavorText: 'A mechanical cleaner goes wild.', rulesText: 'Requires 1 success to defeat.', specialRules: ['level_1'] },
  '6H': { id: 'adv_lvl1_5', name: 'Level 1 Adversary', cardCode: '6H', type: 'ADVERSARY', flavorText: 'A low-level parasite searches for a host.', rulesText: 'Requires 1 success to defeat.', specialRules: ['level_1'] },
  '7H': { id: 'adv_lvl2_1', name: 'Level 2 Adversary', cardCode: '7H', type: 'ADVERSARY', flavorText: 'A dangerous enemy stands in your way.', rulesText: 'Requires 2 successes to defeat.', specialRules: ['level_2'] },
  '8H': { id: 'adv_lvl2_2', name: 'Level 2 Adversary', cardCode: '8H', type: 'ADVERSARY', flavorText: 'A larger threat charges at you.', rulesText: 'Requires 2 successes to defeat.', specialRules: ['level_2'] },
  '9H': { id: 'adv_lvl2_3', name: 'Level 2 Adversary', cardCode: '9H', type: 'ADVERSARY', flavorText: 'A mutant crewmate blocks the door.', rulesText: 'Requires 2 successes to defeat.', specialRules: ['level_2'] },
  '10H': { id: 'adv_lvl2_4', name: 'Level 2 Adversary', cardCode: '10H', type: 'ADVERSARY', flavorText: 'An armored defense unit powers up.', rulesText: 'Requires 2 successes to defeat.', specialRules: ['level_2'] },
  'JH': { id: 'adv_lvl3_1', name: 'Level 3 Adversary', cardCode: 'JH', type: 'ADVERSARY', flavorText: 'An apex predator or major threat stalks you.', rulesText: 'Requires 3 successes to defeat. Possesses unique abilities.', specialRules: ['level_3'] },
  'QH': { id: 'adv_lvl3_2', name: 'Level 3 Adversary', cardCode: 'QH', type: 'ADVERSARY', flavorText: 'A devastating threat stands before you.', rulesText: 'Requires 3 successes to defeat. Possesses unique abilities.', specialRules: ['level_3'] },
  'KH': { id: 'adv_lvl3_3', name: 'Level 3 Adversary', cardCode: 'KH', type: 'ADVERSARY', flavorText: 'A fearsome boss blockades the area.', rulesText: 'Requires 3 successes to defeat. Possesses unique abilities.', specialRules: ['level_3'] },

  // --- DIAMONDS: Personal Obstacles & Safety ---
  'AD': {
    id: 'safety_diamonds',
    name: 'Safety Room',
    cardCode: 'AD',
    type: 'SAFETY',
    flavorText: 'An airlock safety zone with sealed bulkheads.',
    rulesText: 'Allows character resting to recover an Exhausted Trait. Requires test if crewmates are dead.',
    specialRules: ['safety_room_rules']
  },
  '2D': {
    id: 'claustrophobia',
    name: 'Claustrophobia',
    cardCode: '2D',
    type: 'PERSONAL',
    flavorText: 'The walls close in as you realize there is nowhere to escape to in the vastness of space.',
    rulesText: 'Single PC Survival Test. Bust causes panic and loss of 1 Trait as mental damage.',
    specialRules: []
  },
  '3D': {
    id: 'hallucination',
    name: 'Hallucination',
    cardCode: '3D',
    type: 'PERSONAL',
    flavorText: 'Shadows warp and speak to you, dragging old memories into light.',
    rulesText: 'Single PC Test. On failure/bust, the character must swap a card with a dead teammate or discard a trait.',
    specialRules: []
  },
  '4D': {
    id: 'paranoia',
    name: 'Paranoia',
    cardCode: '4D',
    type: 'PERSONAL',
    flavorText: 'You become convinced your crewmates are conspiring against you.',
    rulesText: 'Single PC Test. If failed, character cannot participate in Group Tests or accept swaps for 1 turn.',
    specialRules: []
  },
  '5D': {
    id: 'microblast',
    name: 'Microblast',
    cardCode: '5D',
    type: 'PERSONAL',
    flavorText: 'A tiny micrometeorite punctures the room suddenly, leaving a pinprick breach.',
    rulesText: 'Single PC test to block the hole. Bust causes depressurization injury.',
    specialRules: []
  },
  '6D': {
    id: 'parasite_illness',
    name: 'Parasite / Illness',
    cardCode: '6D',
    type: 'PERSONAL',
    flavorText: 'A sudden, wracking sickness sweeps through your system.',
    rulesText: 'Androids are immune. Spacesuits protect. Others must test; bust causes permanent contamination.',
    specialRules: ['spacesuit_immune']
  },
  '7D': {
    id: 'teleport',
    name: 'Teleportation Glitch',
    cardCode: '7D',
    type: 'PERSONAL',
    flavorText: 'A spatial anomaly or transporter mismatch pulls you away.',
    rulesText: 'Single PC test. Failure warps the character to an undiscovered room alone, triggering an obstacle.',
    specialRules: []
  },
  '8D': {
    id: 'cotard_delusion',
    name: 'Cotard Delusion',
    cardCode: '8D',
    type: 'PERSONAL',
    flavorText: 'You become convinced you are already dead, a ghost wandering the ship.',
    rulesText: 'Single-hand Survival Test (no Rising Tension). Fail triggers automatic Rising Tension on the next test.',
    specialRules: ['single_hand_no_tension']
  },
  '9D': {
    id: 'exhaustion',
    name: 'Exhaustion',
    cardCode: '9D',
    type: 'PERSONAL',
    flavorText: 'Your muscles burn and your vision blurs; you cannot go on without rest.',
    rulesText: 'Single PC test. Fail forces all traits to be exhausted for the next turn.',
    specialRules: []
  },
  '10D': {
    id: 'time_rift',
    name: 'Time Rift',
    cardCode: '10D',
    type: 'PERSONAL',
    flavorText: 'Temporal anomalies cause your actions to loop.',
    rulesText: 'Single PC test. Fail loops the round: cards drawn must be re-dealt.',
    specialRules: []
  },
  'JD': {
    id: 'trapdoor',
    name: 'Trapdoor Chute',
    cardCode: 'JD',
    type: 'PERSONAL',
    flavorText: 'A loose grating drops out under your feet, plummeting you downward.',
    rulesText: 'Single PC test. Fail drops character to a lower floor/room. Must climb back up.',
    specialRules: []
  },
  'QD': {
    id: 'panic_attack',
    name: 'Panic Attack',
    cardCode: 'QD',
    type: 'PERSONAL',
    flavorText: 'Hyperventilating, you collapse as adrenaline floods your system.',
    rulesText: 'Single PC test. Counselor can assist. Fail disables the character for 1 round.',
    specialRules: []
  },
  'KD': {
    id: 'minor_crisis_personal',
    name: 'Minor Crisis (Personal)',
    cardCode: 'KD',
    type: 'PERSONAL',
    flavorText: 'System logs indicate a personal critical item.',
    rulesText: 'Triggers a random Minor Crisis or advances the active one.',
    specialRules: ['trigger_minor_crisis']
  },

  // --- CLUBS: Group Obstacles ---
  'AC': {
    id: 'crewmate_rescue',
    name: 'Crewmate in Distress',
    cardCode: 'AC',
    type: 'GROUP',
    flavorText: 'You find a fellow survivor trapped by a secondary hazard.',
    rulesText: 'Draw a second obstacle. Resolve it as a group. Success saves the crewmate.',
    specialRules: ['crewmate_rescue_rules']
  },
  '2C': {
    id: 'flood',
    name: 'Liquid Flood',
    cardCode: '2C',
    type: 'GROUP',
    flavorText: 'Water treatment or coolant failure floods the room with waist-deep liquid.',
    rulesText: 'Group Test. Failure prevents movement out of the room. Bust ruins gear.',
    specialRules: []
  },
  '3C': {
    id: 'external_impact',
    name: 'External Impact',
    cardCode: '3C',
    type: 'GROUP',
    flavorText: 'Debris or artillery strikes the hull, causing severe vibrations.',
    rulesText: 'Group Test. Dealt from R&O deck. Failure knocks characters down.',
    specialRules: []
  },
  '4C': {
    id: 'vent_to_space',
    name: 'Vent to Space',
    cardCode: '4C',
    type: 'GROUP',
    flavorText: 'An emergency blow-off valve opens, sucking air out rapidly.',
    rulesText: 'Group Test. Spacesuits protect. Failure sucks character towards the airlock.',
    specialRules: ['spacesuit_immune']
  },
  '5C': {
    id: 'toxic_gas',
    name: 'Toxic Gas',
    cardCode: '5C',
    type: 'GROUP',
    flavorText: 'Yellowish gas fills the room from corroded piping.',
    rulesText: 'Group Test. Androids immune. Spacesuits protect. Others take damage on bust.',
    specialRules: ['spacesuit_immune']
  },
  '6C': {
    id: 'explosion',
    name: 'Explosion',
    cardCode: '6C',
    type: 'GROUP',
    flavorText: 'A junction box sparks and ignites a chemical line, bursting into a fireball.',
    rulesText: 'Group Test. Dealt from Survival deck. Bust inflicts 1 Trait damage.',
    specialRules: []
  },
  '7C': {
    id: 'electric_discharge',
    name: 'Electrical Discharge',
    cardCode: '7C',
    type: 'GROUP',
    flavorText: 'Severed cables swing wildly, arcing high voltage electricity.',
    rulesText: 'Group Test. Bust knocks character unconscious or causes damage.',
    specialRules: []
  },
  '8C': {
    id: 'contamination_group',
    name: 'Contamination Leak',
    cardCode: '8C',
    type: 'GROUP',
    flavorText: 'Caustic fluids spray from the ceiling vents.',
    rulesText: 'Group Test. Spacesuits protect. Bust destroys spacesuits or damages traits.',
    specialRules: ['spacesuit_immune']
  },
  '9C': {
    id: 'darkness',
    name: 'Complete Darkness',
    cardCode: '9C',
    type: 'GROUP',
    flavorText: 'All primary and backup lighting in this section is dead.',
    rulesText: 'Group Test. Character stats/modifiers are restricted unless flashlight is held.',
    specialRules: []
  },
  '10C': {
    id: 'noise',
    name: 'Deafening Noise',
    cardCode: '10C',
    type: 'GROUP',
    flavorText: 'A high-pitched siren or engine feedback screams through the bulkheads.',
    rulesText: 'Group Test. Prevents verbal communication, blocks Counselor and Commander benefits.',
    specialRules: []
  },
  'JC': {
    id: 'security_malfunction',
    name: 'Security Malfunction',
    cardCode: 'JC',
    type: 'GROUP',
    flavorText: 'Automated turrets drop from the ceiling, classifying you as intruders.',
    rulesText: 'Group Test. Security Aptitude wins ties.',
    specialRules: []
  },
  'QC': {
    id: 'oxygen_critical',
    name: 'Oxygen Critical',
    cardCode: 'QC',
    type: 'GROUP',
    flavorText: 'The air becomes thin and stale. Lungs burn.',
    rulesText: 'Group Test. Androids immune. Spacesuits protect. Failure makes movement impossible.',
    specialRules: ['spacesuit_immune']
  },
  'KC': {
    id: 'hologram',
    name: 'Hologram Glitch',
    cardCode: 'KC',
    type: 'GROUP',
    flavorText: 'Flickering hard-light projections simulate dangerous obstacles.',
    rulesText: 'Group Test. Science Aptitude can identify as illusion. Bust causes mental shock.',
    specialRules: []
  }
};
