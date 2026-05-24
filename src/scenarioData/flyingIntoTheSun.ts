import { ScenarioConfig } from './scenarioTypes';

export const FLYING_INTO_THE_SUN: ScenarioConfig = {
  id: 'flying_into_the_sun',
  name: 'Flying into the Sun',
  majorCrisis: 'COLLISION_COURSE',
  defaultMinorCrisis: 'LOST',
  year: 3115,
  shipName: 'Starship Welke',
  restrictedAptitudes: ['Armored', 'Shapeshifter'],
  startWithNoGear: true,
  adversaryTypes: ['nanotech_zombie'], // Matches Level 1/2/3 nanotech zombies
  backstory: `It is the year 3115. You are the crew of the Starship Welke, the final hope of a dying species.
Humanity had to abandon Earth, heading for Avalon. You were awoken from suspended animation because of a critical trajectory error.
Given your current rate of travel, in six hours and fifty-three minutes, the Welke will crash into the nearby sun.
Strangely, the corpses of previous crews are missing... they have been reanimated as nanotech zombies, shambling around cleaning up messes and attacking anyone out of place.`,
  extraRulesText: 'No starting gear allowed. Nanotech zombies roam the corridors.',
  requiresSpacesuitForEva: true
};
