import { RoomNode } from '@mapGenerator/mapLayoutTypes';
import { MAJOR_CRISIS_REGISTRY } from './majorCrisisRegistry';
import { MINOR_CRISIS_REGISTRY } from './minorCrisisRegistry';
import { GameState } from '@gameFlow/gameFlowTypes';
import { MajorCrisisState, MinorCrisisState } from './crisisTypes';

export type CrisisAttemptTarget =
  | {
      type: 'MAJOR';
      state: MajorCrisisState;
    }
  | {
      type: 'MINOR';
      state: MinorCrisisState;
    };

export interface CrisisAttemptDecision {
  target: CrisisAttemptTarget | null;
  reason?: string;
}

function normalizeRoomName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function roomMatchesName(room: RoomNode, legalRoomNames: string[]): boolean {
  const currentNames = [room.name, room.roomType].map(normalizeRoomName);
  return legalRoomNames.some((legalName) => currentNames.includes(normalizeRoomName(legalName)));
}

function roomHasRoomObstacleMatch(room: RoomNode): boolean {
  return !!room.roomObstacleDraw?.isRankMatch || !!room.roomObstacleDraw?.isSuitMatch;
}

function wasStepCompletedInRoom(
  state: MajorCrisisState | MinorCrisisState,
  roomId: string
): boolean {
  return !!state.completedStepRoomIds?.includes(roomId);
}

function isFinalBlockedByRoom(
  state: MajorCrisisState | MinorCrisisState,
  roomId: string
): boolean {
  return !!state.completedStepRoomIds?.includes(roomId);
}

function missingCrewmatesBlocksMajor(state: GameState): boolean {
  return state.minorCrisisState?.id === 'MISSING_CREWMATES' && !state.minorCrisisState.isResolved;
}

function evaluateMajorTarget(state: GameState, room: RoomNode): CrisisAttemptDecision {
  const major = state.majorCrisisState;
  if (!major || major.isResolved) return { target: null };
  if (missingCrewmatesBlocksMajor(state)) {
    return { target: null, reason: 'Missing Crewmates must be resolved before the Major Crisis can progress.' };
  }

  if (major.jokersRemaining <= 0 && isFinalBlockedByRoom(major, room.id)) {
    return { target: null, reason: 'The final resolution test must be performed in a different room from previous steps.' };
  }

  if (wasStepCompletedInRoom(major, room.id)) {
    return { target: null, reason: 'This room has already produced a successful Major Crisis step.' };
  }

  const definition = MAJOR_CRISIS_REGISTRY[major.id];
  if (roomMatchesName(room, definition.resolutionRooms) || roomHasRoomObstacleMatch(room)) {
    return { target: { type: 'MAJOR', state: major } };
  }
  return { target: null };
}

function evaluateMinorTarget(state: GameState, room: RoomNode): CrisisAttemptDecision {
  const minor = state.minorCrisisState;
  if (!minor || minor.isResolved) return { target: null };

  if (minor.jokersRemaining <= 0 && isFinalBlockedByRoom(minor, room.id)) {
    return { target: null, reason: 'The final resolution test must be performed in a different room from previous steps.' };
  }

  if (wasStepCompletedInRoom(minor, room.id)) {
    return { target: null, reason: 'This room has already produced a successful Minor Crisis step.' };
  }

  const definition = MINOR_CRISIS_REGISTRY[minor.id];
  if (roomMatchesName(room, definition.resolutionRooms) || roomHasRoomObstacleMatch(room)) {
    return { target: { type: 'MINOR', state: minor } };
  }
  return { target: null };
}

export function selectCrisisAttemptTarget(state: GameState, room: RoomNode): CrisisAttemptDecision {
  const minorDecision = evaluateMinorTarget(state, room);
  if (minorDecision.target) return minorDecision;

  const majorDecision = evaluateMajorTarget(state, room);
  if (majorDecision.target) return majorDecision;

  return {
    target: null,
    reason: minorDecision.reason || majorDecision.reason || 'No unresolved crisis can be attempted in this room.'
  };
}

export function recordSuccessfulCrisisStep(
  crisisState: MajorCrisisState | MinorCrisisState,
  roomId: string
): void {
  const roomIds = crisisState.completedStepRoomIds || [];
  if (!roomIds.includes(roomId)) {
    crisisState.completedStepRoomIds = [...roomIds, roomId];
  }
}

export function recordFinalCrisisResolution(
  crisisState: MajorCrisisState | MinorCrisisState,
  roomId: string
): void {
  crisisState.finalResolutionRoomId = roomId;
  crisisState.isResolved = true;
}
