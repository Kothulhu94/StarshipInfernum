import { GameState } from '@gameFlow/gameFlowTypes';
import { RoomNodeGraph } from '@mapGenerator/roomNodeGraph';
import { RoomNode } from '@mapGenerator/mapLayoutTypes';
import { AdversaryInstance } from './adversaryStateTypes';

function isMinorCrisisActive(state: GameState, crisisId: string): boolean {
  return state.minorCrisisState?.id === crisisId && !state.minorCrisisState.isResolved;
}

function canAdversaryEnterRoom(room: RoomNode | undefined, doorsOffline: boolean): boolean {
  if (!room || !room.isDiscovered) {
    return false;
  }
  if (doorsOffline) {
    return room.obstacleState !== 'sealed';
  }
  return room.obstacleState !== 'persistent' && room.obstacleState !== 'sealed';
}

function getNextChaseStep(
  graph: RoomNodeGraph,
  state: GameState,
  instance: AdversaryInstance,
  targetRoomId: string
): string | null {
  const doorsOffline = isMinorCrisisActive(state, 'DOORS_OFFLINE');
  const path = graph.findPath(instance.currentRoomId, targetRoomId);
  if (!path || path.length < 2) {
    return null;
  }

  const nextRoom = graph.getRoom(path[1]);
  return canAdversaryEnterRoom(nextRoom, doorsOffline) ? path[1] : null;
}

export function moveChasingAdversariesTowardRoom(
  state: GameState,
  graph: RoomNodeGraph,
  targetRoomId: string | null
): string[] {
  if (!targetRoomId) {
    return [];
  }

  const movedNames: string[] = [];
  for (const instance of state.adversaryInstances) {
    if (instance.disposition !== 'chasing') {
      continue;
    }

    const nextRoomId = getNextChaseStep(graph, state, instance, targetRoomId);
    if (nextRoomId) {
      instance.currentRoomId = nextRoomId;
      movedNames.push(instance.name);
    }
  }
  return movedNames;
}

export function canPlayerFleeAdversary(state: GameState): boolean {
  return !isMinorCrisisActive(state, 'LIFE_SUPPORT_OFFLINE');
}
