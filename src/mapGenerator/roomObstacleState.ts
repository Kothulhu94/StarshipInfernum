import { RoomNode, RoomObstacleDrawState, ObstacleClearanceState } from './mapLayoutTypes';

function getRank(cardCode: string): string {
  return cardCode.slice(0, -1);
}

function getSuit(cardCode: string): string {
  return cardCode.slice(-1);
}

export function createRoomObstacleDrawState(
  roomCardCode: string,
  obstacleCardCode: string
): RoomObstacleDrawState {
  return {
    roomCardCode,
    obstacleCardCode,
    isRankMatch: getRank(roomCardCode) === getRank(obstacleCardCode),
    isSuitMatch: getSuit(roomCardCode) === getSuit(obstacleCardCode),
    isDouble: roomCardCode === obstacleCardCode,
  };
}

export function getRoomCardCode(room: RoomNode): string | undefined {
  return room.roomCardCode || room.cardCode;
}

export function getObstacleCardCode(room: RoomNode): string | undefined {
  return room.obstacleCardCode || room.cardCode;
}

export function getObstacleState(room: RoomNode): ObstacleClearanceState {
  if (room.obstacleState) return room.obstacleState;
  return room.isObstacleCleared ? 'cleared' : 'unresolved';
}

export function hasBlockingObstacle(room: RoomNode): boolean {
  const state = getObstacleState(room);
  return Boolean(getObstacleCardCode(room)) && (state === 'unresolved' || state === 'persistent');
}

export function normalizeRoomObstacleState(room: RoomNode): RoomNode {
  const roomCardCode = getRoomCardCode(room);
  const obstacleCardCode = getObstacleCardCode(room);
  room.roomCardCode = roomCardCode;
  room.obstacleCardCode = obstacleCardCode;
  room.cardCode = roomCardCode;
  room.obstacleState = getObstacleState(room);
  room.isObstacleCleared = room.obstacleState === 'cleared' || room.obstacleState === 'bypassed';
  if (roomCardCode && obstacleCardCode && !room.roomObstacleDraw) {
    room.roomObstacleDraw = createRoomObstacleDrawState(roomCardCode, obstacleCardCode);
  }
  return room;
}
