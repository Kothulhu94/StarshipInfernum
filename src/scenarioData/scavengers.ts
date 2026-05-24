import { ScenarioConfig } from './scenarioTypes';

export const SCAVENGERS: ScenarioConfig = {
  id: 'scavengers',
  name: 'Scavengers',
  majorCrisis: 'ALIEN_HORROR',
  defaultMinorCrisis: 'MISSING_CREWMATES',
  shipName: 'Derelict Alien Hulk',
  restrictedAptitudes: ['Sanitation'],
  startWithNoGear: true, // Hangar bay is the only location with starting gear
  adversaryTypes: ['predatory_horror'],
  backstory: `You are independent salvage workers stripping a massive alien vessel crashed into an asteroid.
Stein's comms went down, and a strange sound began echoing through the corridors.
The PCs start separated, and must locate their missing crewmate (Stein) before they can resolve the Major Crisis.
The predatory alien horror cannot be killed in regular tests; only trapped or damaged via Crisis steps.`,
  extraRulesText: 'Characters start separated in different rooms. Stein must be found to proceed with Major Crisis resolution.',
  requiresSpacesuitForEva: true
};
