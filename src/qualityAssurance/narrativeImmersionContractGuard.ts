import { OBSTACLE_REGISTRY, ROOM_REGISTRY, getHydratedObstacle } from '@encounterSystem/obstacleRegistry';
import { SCENARIO_REGISTRY } from '@scenarioData/scenarioRegistry';
import { getRoomDescription } from '@narrativeSystem/flavorTextLibrary';
import { getRoomDescriptionScenarioIds } from '@narrativeSystem/roomDescriptions/roomDescriptionRegistry';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertNoAdversaryLevelLabel(value: string, context: string): void {
  const genericLevelLabel = new RegExp(`Level [123] ${'Adversary'}`);
  assert(!genericLevelLabel.test(value), `${context} exposes a generic adversary level label.`);
}

export function assertNarrativeImmersionContract(): void {
  const supportedScenarioIds = new Set(getRoomDescriptionScenarioIds());

  for (const scenario of SCENARIO_REGISTRY) {
    assert(supportedScenarioIds.has(scenario.id), `${scenario.id} must have a room description voice.`);

    for (const room of Object.values(ROOM_REGISTRY)) {
      const description = getRoomDescription({
        roomName: room.name,
        scenarioId: scenario.id,
        scenarioName: scenario.name,
        obstacleName: 'active hazard',
        obstacleState: 'unresolved',
        isFirstVisit: true,
      });

      assert(description.length > 160, `${scenario.id} ${room.name} room text is too thin.`);
      assert(!description.includes(['eerily', 'quiet'].join(' ')), `${scenario.id} ${room.name} uses the old room fallback.`);
    }

    for (const cardCode of Object.keys(OBSTACLE_REGISTRY).filter((code) => code.endsWith('H') && code !== 'AH')) {
      const baseObstacle = OBSTACLE_REGISTRY[cardCode];
      const hydratedObstacle = getHydratedObstacle(cardCode, scenario);
      assertNoAdversaryLevelLabel(baseObstacle.name, `${cardCode} base obstacle`);
      assertNoAdversaryLevelLabel(hydratedObstacle?.name || '', `${cardCode} ${scenario.id} obstacle`);
    }
  }
}
