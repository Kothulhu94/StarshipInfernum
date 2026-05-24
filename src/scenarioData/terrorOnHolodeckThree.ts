import { ScenarioConfig } from './scenarioTypes';

export const TERROR_ON_HOLODECK_THREE: ScenarioConfig = {
  id: 'terror_on_holodeck_three',
  name: 'Terror on Holodeck Three',
  majorCrisis: 'DIMENSIONAL_RIFT',
  defaultMinorCrisis: 'DOORS_OFFLINE',
  shipName: 'Starship Redemption (Holodeck)',
  restrictedAptitudes: [],
  startWithNoGear: true, // Must discover weapons/gear in simulation play
  adversaryTypes: ['alter_dimensional', 'rogue_crewmate'],
  backstory: `You wake up in what appears to be an antique hotel, smelling dust and mildew.
The safety suppressors on Holodeck Three have failed, trapping you in a glitching simulation.
If you die here, you 'respawn' in your holodeck quarters with one Trait permanently lost but all others refreshed.
On the third death, you escape the simulation and can assist your crew from the controls outside.`,
  extraRulesText: 'No EVA or space suits. Crewmates respawn on death twice, after which they operate from the external console.',
  requiresSpacesuitForEva: false
};
