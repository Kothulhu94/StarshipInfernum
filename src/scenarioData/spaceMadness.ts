import { ScenarioConfig } from './scenarioTypes';

export const SPACE_MADNESS: ScenarioConfig = {
  id: 'space_madness',
  name: 'Space Madness',
  majorCrisis: 'CONTAMINATED',
  defaultMinorCrisis: 'DIGNITARY_ONBOARD',
  shipName: 'Space Force One',
  restrictedAptitudes: [],
  startWithNoGear: false,
  adversaryTypes: ['bio_drinker', 'cuddly_breeder', 'pirate', 'rogue_crewmate'],
  backstory: `The crew of Space Force One has been exposed to 'Space Madness.' You cannot trust your own senses or judgment.
Madame President is currently onboard, hindering the use of heavy weaponry/explosives until she is found and secured.
Solve the crisis by curing everyone or setting the ship to self-destruct and escaping.
Tone is campy, classic 70s sci-fi.`,
  extraRulesText: 'Cheesy overacting, tight color-coded uniforms, and direct looks at the camera are highly encouraged. Weapons are set to stun (no lethal damage between crew).',
  requiresSpacesuitForEva: false // Holodeck/indoor styled or no EVA focus
};
