import { gameEventBus } from './gameEventBus';
import { gameStateStore } from './gameStateStore';
import { turnSequencer } from './turnSequencer';
import { cardTableOverlay } from '@userInterface/cardTableOverlay';
import { selectCrisisAttemptTarget } from '@crisisSystem/crisisAttemptRules';

export function initNPCTurnController(): void {
  gameEventBus.on('active_character_changed', () => {
    // Add a slight delay to simulate "thinking" and allow UI to catch up
    setTimeout(async () => {
      await executeAITurn();
    }, 1200);
  });
}

async function executeAITurn(): Promise<void> {
  const state = gameStateStore.getState();
  const activeChar = turnSequencer.getActiveCharacter();
  
  if (!activeChar || !activeChar.isAI || state.gamePhase !== 'EXPLORING') {
    return;
  }

  const graph = gameStateStore.getMapGraph();
  const currentRoom = state.activeRoomId ? graph.getRoom(state.activeRoomId) : null;
  if (!currentRoom) {
    turnSequencer.advanceTurn();
    return;
  }

  const tryAction = async (action: () => Promise<any> | any): Promise<boolean> => {
    await action();
    const newState = gameStateStore.getState();
    if (newState.gamePhase !== 'EXPLORING' || newState.activeCharacterId !== activeChar.id) {
      return true;
    }
    return false;
  };

  // 1. Safety room rest
  const isSafety = currentRoom.roomType.toLowerCase().includes('airlock') || currentRoom.roomType.toLowerCase().includes('safety');
  if (isSafety && activeChar.traits.some((t) => t.exhausted && !t.busted)) {
    gameStateStore.logMessage(`NPC heuristic: ${activeChar.name} decides to rest in the safety room.`);
    if (await tryAction(() => turnSequencer.restInSafetyRoom(cardTableOverlay))) return;
  }

  // 2. Crisis Attempt (heuristic based on profile)
  const crisisPropensity = activeChar.aiProfile?.crisisPropensity ?? 0.4;
  const crisisDecision = selectCrisisAttemptTarget(state, currentRoom);
  if (crisisDecision.target && Math.random() < crisisPropensity) {
    gameStateStore.logMessage(`NPC heuristic: ${activeChar.name} attempts a Crisis Step!`);
    if (await tryAction(() => turnSequencer.attemptCrisisStep(cardTableOverlay))) return;
  }

  // 3. Explore unexplored door vs move to random neighbor
  const explorationDrive = activeChar.aiProfile?.explorationDrive ?? 0.5;
  const unexploredDoors = currentRoom.doors.filter((d) => !d.connectedDoorId);
  const neighbors = graph.getNeighbors(currentRoom.id);

  if (unexploredDoors.length > 0 && (Math.random() < explorationDrive || neighbors.length === 0)) {
    const door = unexploredDoors[Math.floor(Math.random() * unexploredDoors.length)];
    gameStateStore.logMessage(`NPC heuristic: ${activeChar.name} explores door ${door.direction}.`);
    if (await tryAction(() => turnSequencer.exploreDoor(door.direction))) return;
  }

  // 4. Move to random neighbor if didn't explore
  if (neighbors.length > 0) {
    const neighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
    gameStateStore.logMessage(`NPC heuristic: ${activeChar.name} moves to an adjacent room.`);
    
    await turnSequencer.moveActiveCharacter(neighbor.neighborId);
    
    // moving does not natively consume a turn unless it triggers an obstacle
    if (gameStateStore.getState().gamePhase === 'EXPLORING' && gameStateStore.getState().activeCharacterId === activeChar.id) {
      turnSequencer.advanceTurn();
    }
    return;
  }

  // 5. Default fallback
  gameStateStore.logMessage(`NPC heuristic: ${activeChar.name} idles and waits.`);
  turnSequencer.advanceTurn();
}
