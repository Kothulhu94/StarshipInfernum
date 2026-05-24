import { ScenarioConfig } from './scenarioTypes';

export const PRISON_BREAK: ScenarioConfig = {
  id: 'prison_break',
  name: 'Prison Break',
  majorCrisis: 'MUTINY',
  defaultMinorCrisis: 'GRAVITY_OFFLINE', // Can be any except Missing Crewmate or Lost
  shipName: 'Pembroke 13',
  restrictedAptitudes: ['Militant', 'Sanitation', 'Shapeshifter', 'Smuggler', 'Trainee'],
  startWithNoGear: false, // Players start with gear choice (weapon, explosive, or medkit)
  adversaryTypes: ['pirate', 'mutineer'],
  backstory: `Yesterday, the transport freighter Pembroke 13 reported convicts bound for hard labor in the hydrogen mines on Jupiter.
By 2235, a short distress signal was received before communication went offline. The ship is now off-course, heading for a pirate outpost on Saturn.
Your special forces astronaut team has infiltrated the hull to retake the ship from mutineers.`,
  extraRulesText: 'All characters begin with a weapon, explosive, or medkit of their choice. Enemies are former prisoners (Pirates).',
  requiresSpacesuitForEva: true
};
