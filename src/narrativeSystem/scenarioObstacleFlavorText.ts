import type { ObstacleDefinition } from '@encounterSystem/encounterTypes';
import type { ScenarioConfig } from '@scenarioData/scenarioTypes';
import { normalizeScenarioDescriptionId } from './roomDescriptions/roomDescriptionRegistry';

type ScenarioHazardVoice = (obstacle: ObstacleDefinition) => string;

const SCENARIO_HAZARD_VOICES: Record<string, ScenarioHazardVoice> = {
  flying_into_the_sun: (obstacle) => `On the Welke, ${obstacle.name} is another system failing under solar punishment; alarms stutter as heat turns the ship against you.`,
  prison_break: (obstacle) => `On the Pembroke 13, ${obstacle.name} bears the fingerprints of the mutiny: sabotage, stolen tools, and violence repurposed as architecture.`,
  scavengers: (obstacle) => `In the derelict, ${obstacle.name} feels less like damage and more like the alien ship defending an old wound.`,
  space_madness: (obstacle) => `Aboard Space Force One, ${obstacle.name} arrives with theatrical absurdity, but the injuries it threatens are completely real.`,
  wish_upon_dying_star: (obstacle) => `On the Phoenix, ${obstacle.name} carries the dead star's cold influence, making even ordinary failure feel haunted.`,
  terror_on_holodeck_three: (obstacle) => `Inside Holodeck Three, ${obstacle.name} may be simulated in origin, but the safeties are gone and the consequences are physical.`,
};

export function getScenarioObstacleFlavorText(
  obstacle: ObstacleDefinition,
  scenario: ScenarioConfig | null
): string {
  if (!scenario) return obstacle.flavorText;
  const scenarioId = normalizeScenarioDescriptionId(scenario.id, scenario.name);
  const scenarioVoice = SCENARIO_HAZARD_VOICES[scenarioId];
  return scenarioVoice ? `${obstacle.flavorText} ${scenarioVoice(obstacle)}` : obstacle.flavorText;
}
