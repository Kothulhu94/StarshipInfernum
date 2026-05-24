import { ScenarioConfig } from './scenarioTypes';

export const WISH_UPON_DYING_STAR: ScenarioConfig = {
  id: 'wish_upon_dying_star',
  name: 'When You Wish Upon a (Dying) Star',
  majorCrisis: 'DEAD_SHIP',
  defaultMinorCrisis: 'LOST',
  shipName: 'Phoenix',
  restrictedAptitudes: ['Psychic', 'Shapeshifter', 'Smuggler'],
  startWithNoGear: false,
  adversaryTypes: ['alter_dimensional', 'rogue_crewmate'],
  backstory: `The rescue vessel Phoenix has arrived at the pulsar star Lich (PSR B1257+12) following a human-language distress signal.
Upon entering the system, horrific nightmares plagued the crew. Thirteen hours later, the power went out.
The walls began to bleed. Crewmates went mad. Shadowy beings now stalk the darkened bulkheads. You must restore power and escape.`,
  extraRulesText: 'No one may play the Captain. Personal survival tests begin with automatic Rising Tension (due to the Lost crisis). Shadowy entities block paths.',
  requiresSpacesuitForEva: true
};
