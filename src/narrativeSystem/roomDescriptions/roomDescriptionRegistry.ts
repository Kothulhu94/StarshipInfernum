import { flyingIntoTheSunRoomVoice } from './flyingIntoTheSunRoomDescriptions';
import { prisonBreakRoomVoice } from './prisonBreakRoomDescriptions';
import { scavengersRoomVoice } from './scavengersRoomDescriptions';
import { spaceMadnessRoomVoice } from './spaceMadnessRoomDescriptions';
import { terrorOnHolodeckThreeRoomVoice } from './terrorOnHolodeckThreeRoomDescriptions';
import { wishUponDyingStarRoomVoice } from './wishUponDyingStarRoomDescriptions';
import { getRoomSurfaceDetail } from './roomSurfaceDetails';
import { RoomDescriptionContext, ScenarioRoomVoice } from './roomDescriptionTypes';
import { RoomFlavorText } from '../roomFlavorText';

const ROOM_VOICES: Record<string, ScenarioRoomVoice> = {
  [flyingIntoTheSunRoomVoice.id]: flyingIntoTheSunRoomVoice,
  [prisonBreakRoomVoice.id]: prisonBreakRoomVoice,
  [scavengersRoomVoice.id]: scavengersRoomVoice,
  [spaceMadnessRoomVoice.id]: spaceMadnessRoomVoice,
  [terrorOnHolodeckThreeRoomVoice.id]: terrorOnHolodeckThreeRoomVoice,
  [wishUponDyingStarRoomVoice.id]: wishUponDyingStarRoomVoice,
};

const SCENARIO_ALIASES: Record<string, string> = {
  flyingintothesun: 'flying_into_the_sun',
  flying_into_the_sun: 'flying_into_the_sun',
  prisonbreak: 'prison_break',
  prison_break: 'prison_break',
  scavengers: 'scavengers',
  spacemadness: 'space_madness',
  space_madness: 'space_madness',
  terroronholodeckthree: 'terror_on_holodeck_three',
  terror_on_holodeck_three: 'terror_on_holodeck_three',
  wishuponadyingstar: 'wish_upon_dying_star',
  wishupondyingstar: 'wish_upon_dying_star',
  wish_upon_a_dying_star: 'wish_upon_dying_star',
  wish_upon_dying_star: 'wish_upon_dying_star',
  whenyouwishuponadyingstar: 'wish_upon_dying_star',
};

const LEGACY_SCENARIO_KEYS: Record<string, string> = {
  flying_into_the_sun: 'flyingIntoTheSun',
  prison_break: 'prisonBreak',
  scavengers: 'scavengers',
  space_madness: 'spaceMadness',
  terror_on_holodeck_three: 'terrorOnHolodeckThree',
  wish_upon_dying_star: 'wishUponADyingStar',
};

function normalizeScenarioKey(value?: string): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9_]+/g, '');
}

export function normalizeScenarioDescriptionId(scenarioId?: string, scenarioName?: string): string {
  const idKey = normalizeScenarioKey(scenarioId);
  const nameKey = normalizeScenarioKey(scenarioName);
  return SCENARIO_ALIASES[idKey] || SCENARIO_ALIASES[nameKey] || 'flying_into_the_sun';
}

function isUnresolvedObstacle(context: RoomDescriptionContext): boolean {
  return Boolean(context.obstacleName) && context.obstacleState !== 'cleared';
}

function getSpecificRoomText(context: RoomDescriptionContext, scenarioId: string): string {
  const room = getRoomSurfaceDetail(context.roomName);
  const scenarioKey = LEGACY_SCENARIO_KEYS[scenarioId];
  if (!scenarioKey) return '';

  for (const alias of [room.canonicalName, ...room.aliases]) {
    const text = RoomFlavorText[alias]?.[scenarioKey];
    if (text) return text;
  }

  return '';
}

export function buildScenarioRoomDescription(context: RoomDescriptionContext): string {
  const scenarioId = normalizeScenarioDescriptionId(context.scenarioId, context.scenarioName);
  const voice = ROOM_VOICES[scenarioId] || flyingIntoTheSunRoomVoice;
  const room = getRoomSurfaceDetail(context.roomName);
  const specificRoomText = getSpecificRoomText(context, scenarioId);
  const lines: string[] = [];

  if (context.obstacleState === 'cleared') {
    lines.push(voice.cleared(room, context));
  } else if (context.isFirstVisit === false) {
    lines.push(voice.revisit(room, context));
  } else {
    lines.push(voice.entry(room, context));
  }

  if (specificRoomText) {
    lines.push(specificRoomText);
  }

  if (context.activeCrisisId) {
    lines.push(voice.crisis(context.activeCrisisId, room));
  }

  if (context.hasAdversary && context.obstacleName) {
    lines.push(voice.adversary(context.obstacleName, room));
  } else if (isUnresolvedObstacle(context)) {
    lines.push(voice.obstacle(context.obstacleName || 'the active hazard', room));
  }

  return lines.join(' ');
}

export function getRoomDescriptionScenarioIds(): string[] {
  return Object.keys(ROOM_VOICES);
}
