import { GameState } from '@gameFlow/gameFlowTypes';
import { AdversaryData } from './adversaryRegistry';
import {
  AdversaryCombatStateUpdate,
  AdversaryInstance,
  getRequiredAdversarySuccesses
} from './adversaryStateTypes';

function buildAdversaryInstanceId(roomId: string, cardCode: string, typeId: string): string {
  return `${roomId}:${cardCode}:${typeId}`;
}

export function findAdversaryInRoom(
  state: GameState,
  roomId: string,
  typeId: string
): AdversaryInstance | undefined {
  return state.adversaryInstances.find((instance) => (
    instance.currentRoomId === roomId &&
    instance.typeId === typeId &&
    instance.disposition !== 'defeated'
  ));
}

export function getOrCreateAdversaryInstance(
  state: GameState,
  adversary: AdversaryData,
  roomId: string,
  cardCode: string
): AdversaryInstance {
  const existing = findAdversaryInRoom(state, roomId, adversary.id);
  if (existing) {
    return existing;
  }

  const instance: AdversaryInstance = {
    id: buildAdversaryInstanceId(roomId, cardCode, adversary.id),
    typeId: adversary.id,
    name: adversary.name,
    level: adversary.level,
    currentRoomId: roomId,
    successesRemaining: getRequiredAdversarySuccesses(adversary),
    disposition: 'ambushing',
  };
  state.adversaryInstances.push(instance);
  return instance;
}

export function applyAdversaryCombatStateUpdate(
  state: GameState,
  instanceId: string,
  update: AdversaryCombatStateUpdate
): void {
  const instance = state.adversaryInstances.find((item) => item.id === instanceId);
  if (!instance) {
    return;
  }

  instance.successesRemaining = Math.max(0, update.successesRemaining);
  instance.disposition = update.disposition;
  if (update.defeated) {
    instance.successesRemaining = 0;
    instance.disposition = 'defeated';
  }
}
