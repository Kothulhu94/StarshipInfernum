import { ObstacleClearanceState } from '@mapGenerator/mapLayoutTypes';

export interface RoomSurfaceDetail {
  canonicalName: string;
  aliases: string[];
  purpose: string;
  fixtures: string;
  clue: string;
}

export interface RoomDescriptionContext {
  roomName: string;
  scenarioId?: string;
  scenarioName?: string;
  characterName?: string;
  obstacleName?: string;
  obstacleState?: ObstacleClearanceState;
  hasAdversary?: boolean;
  isFirstVisit?: boolean;
  activeCrisisId?: string;
}

export interface ScenarioRoomVoice {
  id: string;
  entry(room: RoomSurfaceDetail, context: RoomDescriptionContext): string;
  revisit(room: RoomSurfaceDetail, context: RoomDescriptionContext): string;
  cleared(room: RoomSurfaceDetail, context: RoomDescriptionContext): string;
  obstacle(obstacleName: string, room: RoomSurfaceDetail): string;
  adversary(adversaryName: string, room: RoomSurfaceDetail): string;
  crisis(crisisId: string, room: RoomSurfaceDetail): string;
}
