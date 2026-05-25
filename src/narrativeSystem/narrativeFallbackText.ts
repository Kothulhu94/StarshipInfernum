import { getAdversaryDefeatText, getAdversaryIntro } from './adversaryFlavorText';
import { getContextualTensionQuip, getRandomDealerQuip } from './dealerQuipLibrary';
import { getObstacleDescription, getOutcomeDescription, getRoomDescription } from './flavorTextLibrary';
import { NarrativeEvent } from './narrativeTypes';

export function getNarrativeFallbackText(event: NarrativeEvent): string {
  if (event.preWrittenText) {
    return event.preWrittenText;
  }

  const ctx = event.context;
  switch (event.type) {
    case 'ROOM_ENTERED':
      return getRoomDescription({
        roomName: ctx.roomName || 'Unknown Room',
        scenarioId: ctx.scenarioId,
        scenarioName: ctx.scenarioName,
        characterName: ctx.characterName,
        obstacleName: ctx.obstacleName,
      });
    case 'OBSTACLE_REVEALED':
      return getObstacleDescription(ctx.obstacleName || 'Unknown Obstacle');
    case 'TEST_BUST':
      return getOutcomeDescription(ctx.obstacleName || 'Obstacle', false);
    case 'TEST_SUCCESS':
      return getOutcomeDescription(ctx.obstacleName || 'Obstacle', true);
    case 'CRISIS_TRIGGERED':
      return `A crisis breaks across the ship: ${ctx.extraContext || 'alarms cut through the dark.'}`;
    case 'CRISIS_RESOLVED':
      return `The crew brings the crisis under control: ${ctx.extraContext || 'the ship steadies for now.'}`;
    case 'ADVERSARY_ENCOUNTER':
      return getAdversaryIntro(ctx.adversaryName || 'Unknown Adversary');
    case 'ADVERSARY_DEFEATED':
      return getAdversaryDefeatText(ctx.adversaryName || 'Unknown Adversary');
    case 'RISING_TENSION':
      return getContextualTensionQuip(ctx);
    case 'CHARACTER_DEATH':
      return `${ctx.characterName} has perished in the cold void.`;
    case 'GHOST_FLASHBACK':
      return `${ctx.characterName}'s memory flickers through the crew channel.`;
    default:
      return `${ctx.characterName} experiences a strange sensation.`;
  }
}
