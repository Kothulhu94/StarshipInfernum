import { SerializableGameState } from '@gameFlow/gameFlowTypes';
import { RoomNode } from '@mapGenerator/mapLayoutTypes';
import { createRoomObstacleDrawState } from '@mapGenerator/roomObstacleState';
import { Suit } from '@cardEngine/cardDefinitions';

const REQUIRED_SAVE_KEYS: Array<keyof SerializableGameState> = [
  'gamePhase',
  'scenarioId',
  'characters',
  'activeCharacterId',
  'majorCrisisState',
  'minorCrisisState',
  'majorCrisisCard',
  'minorCrisisCard',
  'crisisClockTokensRemaining',
  'crisisClockTokensTotal',
  'activeRoomId',
  'currentDeck',
  'isFatalDisasters',
  'historyLog',
  'survivalDeckCards',
  'roDeckCards',
  'drawnJokers',
  'adversaryInstances',
  'mapGraphSerialized',
];

export function buildSerializableSaveFixture(): SerializableGameState {
  const room: RoomNode = {
    id: 'bridge-qa',
    name: 'Bridge',
    cardCode: '7H',
    roomCardCode: '7H',
    obstacleCardCode: '7S',
    obstacleState: 'persistent',
    roomObstacleDraw: createRoomObstacleDrawState('7H', '7S'),
    roomType: 'Bridge',
    x: 0,
    y: 0,
    z: 0,
    width: 6,
    height: 6,
    templateId: 'qa-bridge',
    doors: [],
    features: {},
    isDiscovered: true,
    isObstacleCleared: false,
  };

  return {
    gamePhase: 'EXPLORING',
    scenarioId: 'qa-scenario',
    characters: [],
    activeCharacterId: null,
    majorCrisisState: {
      id: 'ALIEN_HORROR',
      jokersRemaining: 1,
      jokersTotal: 1,
      isUnlocked: false,
      isResolved: false,
      completedStepRoomIds: [],
    },
    minorCrisisState: {
      id: 'LOST',
      jokersRemaining: 1,
      isResolved: false,
      completedStepRoomIds: [],
    },
    majorCrisisCard: { suit: Suit.SPADES, rank: 'A', faceUp: true },
    minorCrisisCard: { suit: Suit.CLUBS, rank: 'K', faceUp: true },
    crisisClockTokensRemaining: 3,
    crisisClockTokensTotal: 4,
    activeRoomId: room.id,
    currentDeck: 0,
    isFatalDisasters: true,
    historyLog: ['QA fixture created.'],
    survivalDeckCards: [],
    roDeckCards: [],
    drawnJokers: [{ suit: Suit.SPADES, rank: 'A', faceUp: true, isJoker: true }],
    adversaryInstances: [],
    mapGraphSerialized: {
      rooms: [room],
      corridors: [],
    },
  };
}

export function assertSerializableSaveContract(save: SerializableGameState): void {
  for (const key of REQUIRED_SAVE_KEYS) {
    if (!(key in save)) {
      throw new Error(`SerializableGameState is missing ${String(key)}.`);
    }
  }

  if (!Array.isArray(save.mapGraphSerialized.rooms)) {
    throw new Error('SerializableGameState.mapGraphSerialized.rooms must be an array.');
  }

  const firstRoom = save.mapGraphSerialized.rooms[0] as Partial<RoomNode> | undefined;
  if (!firstRoom?.roomCardCode || !firstRoom?.obstacleCardCode || !firstRoom?.roomObstacleDraw) {
    throw new Error('Room save contract must preserve paired room and obstacle card state.');
  }

  if (!Array.isArray(save.drawnJokers)) {
    throw new Error('SerializableGameState.drawnJokers must always be an array.');
  }
}
