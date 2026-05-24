import { ScenarioConfig } from './scenarioTypes';
import { FLYING_INTO_THE_SUN } from './flyingIntoTheSun';
import { PRISON_BREAK } from './prisonBreak';
import { SCAVENGERS } from './scavengers';
import { SPACE_MADNESS } from './spaceMadness';
import { WISH_UPON_DYING_STAR } from './wishUponDyingStar';
import { TERROR_ON_HOLODECK_THREE } from './terrorOnHolodeckThree';

export const SCENARIO_REGISTRY: ScenarioConfig[] = [
  FLYING_INTO_THE_SUN,
  PRISON_BREAK,
  SCAVENGERS,
  SPACE_MADNESS,
  WISH_UPON_DYING_STAR,
  TERROR_ON_HOLODECK_THREE
];

export function getScenarioById(id: string): ScenarioConfig | undefined {
  return SCENARIO_REGISTRY.find(s => s.id === id);
}
