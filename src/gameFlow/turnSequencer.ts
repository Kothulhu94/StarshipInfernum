import { gameStateStore } from './gameStateStore';
import { phaseStateMachine } from './phaseStateMachine';
import { gameEventBus } from './gameEventBus';
import { saveLoadManager } from './saveLoadManager';
import { getCardCode, dispatchObstacle } from '@encounterSystem/obstacleDispatcher';
import { runCrisisTest } from '@encounterSystem/crisisTestRunner';
import { runDisasterTest } from '@crisisSystem/disasterResolver';
import { runSimpleTest } from '@encounterSystem/simpleTestRunner';
import { onCrisisTestSuccess, onCrisisTestBust, resolveCrisisCard } from '@crisisSystem/jokerEventHandler';
import {
  recordFinalCrisisResolution,
  recordSuccessfulCrisisStep,
  selectCrisisAttemptTarget
} from '@crisisSystem/crisisAttemptRules';
import { DoorDirection } from '@mapGenerator/mapLayoutTypes';
import { ShipLayoutBuilder } from '@mapGenerator/shipLayoutBuilder';
import {
  createRoomObstacleDrawState,
  getObstacleCardCode,
  getRoomCardCode,
  hasBlockingObstacle
} from '@mapGenerator/roomObstacleState';
import { Card } from '@cardEngine/cardDefinitions';
import { TestUI, TestResult } from '@encounterSystem/encounterTypes';
import { Character } from '@characterSystem/characterTypes';
import { endGame } from './gameOverHandler';
import { getDecksFromState, saveDecksToState, instrumentDecks } from './deckStateSynchronizer';
import { OBSTACLE_REGISTRY } from '@encounterSystem/obstacleRegistry';
import { shouldRoomObstacleClear } from '@encounterSystem/obstacleSpecialRuleEffects';

function cardCodeToCard(cardCode: string): Card {
  const rank = cardCode.substring(0, cardCode.length - 1) as any;
  const suitLetter = cardCode.charAt(cardCode.length - 1);
  let suit = 'SPADES';
  if (suitLetter === 'H') suit = 'HEARTS';
  if (suitLetter === 'D') suit = 'DIAMONDS';
  if (suitLetter === 'C') suit = 'CLUBS';
  return { suit: suit as any, rank, faceUp: true };
}

export class TurnSequencer {
  private lastDrawnROCardCode: string | null = null;
  private crisisTestCountPerRoom = new Map<string, number>();

  constructor() {
    gameEventBus.on('game_reset', () => this.reset());
  }

  /**
   * Resets turn sequencer state. Called when initializing or loading a game.
   */
  public reset(): void {
    this.lastDrawnROCardCode = null;
    this.crisisTestCountPerRoom.clear();
  }

  /**
   * Gets the currently active character.
   */
  public getActiveCharacter(): Character | null {
    const state = gameStateStore.getState();
    return state.characters.find((c) => c.id === state.activeCharacterId) || null;
  }

  /**
   * Rotate turn to the next living crew member.
   */
  public advanceTurn(): void {
    const state = gameStateStore.getState();
    const living = state.characters.filter((c) => !c.isDead);
    if (living.length === 0) {
      endGame(false, 'All crew members have perished.');
      return;
    }

    const currentIndex = living.findIndex((c) => c.id === state.activeCharacterId);
    let nextIndex = (currentIndex + 1) % living.length;
    const nextChar = living[nextIndex];

    gameStateStore.updateState((s) => {
      s.activeCharacterId = nextChar.id;
    });

    gameStateStore.logMessage(`It is now ${nextChar.name}'s turn.`);
    gameEventBus.emit('active_character_changed', nextChar.id);
  }

  /**
   * Move active character to an already connected room.
   */
  public moveActiveCharacter(toRoomId: string): void {
    const state = gameStateStore.getState();
    const graph = gameStateStore.getMapGraph();
    const activeChar = this.getActiveCharacter();

    if (!activeChar || state.gamePhase !== 'EXPLORING') return;

    const targetRoom = graph.getRoom(toRoomId);
    if (!targetRoom) return;

    const currentRoomId = state.activeRoomId;
    if (!currentRoomId || !graph.areConnected(currentRoomId, toRoomId)) {
      gameStateStore.logMessage(`Room: ${targetRoom.name}.`);
      return;
    }

    gameStateStore.updateState((s) => {
      s.activeRoomId = toRoomId;
      s.currentDeck = targetRoom.z;
    });

    gameStateStore.logMessage(`${activeChar.name} moved to the ${targetRoom.name}.`);
    
    // Autosave immediately upon room entry
    saveLoadManager.saveGame('autosave');

    // Check if the target room has an unresolved obstacle
    if (hasBlockingObstacle(targetRoom)) {
      phaseStateMachine.transitionTo('OBSTACLE');
    }
  }

  /**
   * Explore a doorway to generate a new room.
   */
  public async exploreDoor(doorDirection: DoorDirection): Promise<void> {
    const state = gameStateStore.getState();
    const graph = gameStateStore.getMapGraph();
    const activeChar = this.getActiveCharacter();

    if (!activeChar || state.gamePhase !== 'EXPLORING' || !state.activeRoomId) return;

    const { survivalDeck, roDeck } = getDecksFromState();

    // Draw separate R&O cards: first for room identity, second for obstacle identity.
    const roomCard = roDeck.draw();
    const obstacleCard = roDeck.draw();
    const roomCardCode = getCardCode(roomCard);
    const obstacleCardCode = getCardCode(obstacleCard);

    // Grow map graph
    const layoutBuilder = new ShipLayoutBuilder();
    console.log("BEFORE EXPLORE rooms in graph:", Array.from(graph.rooms.keys()));
    const newRoom = layoutBuilder.discoverRoom(graph, state.activeRoomId, doorDirection, roomCardCode, obstacleCardCode);
    console.log("AFTER EXPLORE rooms in graph:", Array.from(graph.rooms.keys()));

    if (!newRoom) {
      gameStateStore.logMessage(`Could not grow room in direction: ${doorDirection} (blocked or out of bounds).`);
      saveDecksToState(survivalDeck, roDeck);
      return;
    }

    // Set new room as active
    gameStateStore.updateState((s) => {
      s.activeRoomId = newRoom.id;
      s.currentDeck = newRoom.z;
    });

    gameStateStore.logMessage(
      `${activeChar.name} explored ${doorDirection} and discovered the ${newRoom.name}!`
    );

    // Save decks back
    saveDecksToState(survivalDeck, roDeck);

    if (newRoom.roomObstacleDraw?.isRankMatch || newRoom.roomObstacleDraw?.isSuitMatch) {
      gameStateStore.logMessage('Room and obstacle cards match for a crisis opportunity.');
    }

    // Check for crisis card match: does roomCardCode match previous drawn room card rank/suit?
    if (this.lastDrawnROCardCode) {
      const currentRank = roomCard.rank;
      const currentSuit = roomCard.suit;
      const prevRank = this.lastDrawnROCardCode[0];
      const prevSuit = this.lastDrawnROCardCode[1]; // approximate check
      if (currentRank === prevRank || currentSuit[0] === prevSuit) {
        gameStateStore.logMessage('Crisis match detected!');
      }
    }
    this.lastDrawnROCardCode = roomCardCode;

    const obstacleName = OBSTACLE_REGISTRY[obstacleCardCode]?.name || newRoom.name;

    // Trigger narrative router
    gameEventBus.emit('narrative_triggered', {
      type: 'ROOM_ENTERED',
      context: {
        scenarioName: state.scenario?.name || '',
        characterName: activeChar.name,
        characterTraits: activeChar.traits.map((t) => t.name),
        roomName: newRoom.name,
        obstacleName,
      },
    });

    // Save game immediately before resolving obstacle
    saveLoadManager.saveGame('autosave');

    // Transition to obstacle phase
    phaseStateMachine.transitionTo('OBSTACLE');
  }

  /**
   * Rests character in a safety room to recover a trait.
   */
  public async restInSafetyRoom(ui: TestUI): Promise<boolean> {
    const state = gameStateStore.getState();
    const activeChar = this.getActiveCharacter();
    if (!activeChar || state.gamePhase !== 'EXPLORING' || !state.activeRoomId) return false;

    const graph = gameStateStore.getMapGraph();
    const currentRoom = graph.getRoom(state.activeRoomId);
    if (!currentRoom || !currentRoom.roomType.toLowerCase().includes('airlock') && !currentRoom.roomType.toLowerCase().includes('safety')) {
      gameStateStore.logMessage('You can only rest in Airlocks or Safety Rooms.');
      return false;
    }

    // Check if dead PCs exist
    const hasDeadCrew = state.characters.some((c) => c.isDead);
    if (hasDeadCrew) {
      gameStateStore.logMessage(`Crewmates have died. Recovering a trait requires passing a Simple Test with automatic Rising Tension.`);
      const { survivalDeck, roDeck } = getDecksFromState();
      
      // Simple test with +1 tension card count (simulated via 1 starting tension in SimpleTest)
      const result = await runSimpleTest(activeChar, roDeck, ui, 1);
      saveDecksToState(survivalDeck, roDeck);
      await ui.showTestResult(result);

      if (result.outcome !== 'WIN') {
        gameStateStore.logMessage(`${activeChar.name} failed the safety rest test. No traits recovered.`);
        this.advanceTurn();
        return false;
      }
    }

    // Recover first exhausted trait
    const exhausted = activeChar.traits.find((t) => t.exhausted && !t.busted);
    if (exhausted) {
      gameStateStore.updateState(() => {
        exhausted.exhausted = false;
      });
      gameStateStore.logMessage(`${activeChar.name} rested and recovered trait: "${exhausted.name}".`);
    } else {
      gameStateStore.logMessage(`${activeChar.name} rested but has no exhausted traits.`);
    }

    this.advanceTurn();
    return true;
  }

  /**
   * Resolves the obstacle in the current room.
   */
  public async resolveObstacle(ui: TestUI): Promise<void> {
    const state = gameStateStore.getState();
    const graph = gameStateStore.getMapGraph();
    const activeChar = this.getActiveCharacter();

    if (!activeChar || state.gamePhase !== 'OBSTACLE' || !state.activeRoomId) return;

    const currentRoom = graph.getRoom(state.activeRoomId);
    const obstacleCardCode = currentRoom ? getObstacleCardCode(currentRoom) : undefined;
    if (!currentRoom || !obstacleCardCode) {
      phaseStateMachine.transitionTo('EXPLORING');
      return;
    }

    const { survivalDeck, roDeck } = getDecksFromState();
    const trigger = instrumentDecks(survivalDeck);

    const obstacleCard = cardCodeToCard(obstacleCardCode);

    const otherPlayers = state.characters.filter((c) => c.id !== activeChar.id);
    const deadPCs = state.characters.filter((c) => c.isDead);

    const roomCardCode = getRoomCardCode(currentRoom) || obstacleCardCode;
    const obstacleName = OBSTACLE_REGISTRY[obstacleCardCode]?.name || currentRoom.name;
    gameStateStore.logMessage(`Encountering obstacle: ${obstacleName} (${obstacleCardCode}) in ${currentRoom.name} (${roomCardCode})`);
    phaseStateMachine.transitionTo('TEST');

    let testResult: TestResult | Map<string, TestResult>;
    try {
      testResult = await dispatchObstacle(
        obstacleCard,
        activeChar,
        otherPlayers,
        deadPCs,
        survivalDeck,
        roDeck,
        ui
      );
    } catch (err) {
      console.error('Error during obstacle execution:', err);
      // Fallback result on error
      testResult = { outcome: 'WIN', finalPlayerTotal: 21, finalDealerTotal: 0, traitsExhausted: [] };
    }

    saveDecksToState(survivalDeck, roDeck);
    
    // Helper logic moved here for simplicity in this file
    const getDisplayResult = (res: TestResult | Map<string, TestResult>): TestResult => {
      if (!(res instanceof Map)) return res;
      const preferred = activeChar.id ? res.get(activeChar.id) : undefined;
      return preferred || Array.from(res.values())[0] || {
        outcome: 'PUSH',
        finalPlayerTotal: 0,
        finalDealerTotal: 0,
        traitsExhausted: [],
      };
    };
    await ui.showTestResult(getDisplayResult(testResult));

    const obstacleDefinition = OBSTACLE_REGISTRY[obstacleCardCode];
    const isCleared = obstacleDefinition
      ? shouldRoomObstacleClear(obstacleDefinition, testResult)
      : true;

    if (isCleared) {
      gameStateStore.updateState(() => {
        currentRoom.isObstacleCleared = true;
        currentRoom.obstacleState = 'cleared';
      });
    } else {
      gameStateStore.updateState(() => {
        currentRoom.isObstacleCleared = false;
        currentRoom.obstacleState = 'unresolved';
      });
    }

    gameStateStore.logMessage(isCleared ? `Obstacle successfully cleared.` : `Obstacle remains unresolved.`);

    // If Joker was drawn, resolve the Disaster immediately
    if (trigger.jokerDrawnThisStep) {
      gameStateStore.logMessage('A Joker was drawn! Triggering a crisis Disaster...');
      phaseStateMachine.transitionTo('DISASTER');

      const disasterPlayers = state.characters.filter((c) => !c.isDead);
      const disasterDead = state.characters.filter((c) => c.isDead);

      const dRes = await runDisasterTest(disasterPlayers, disasterDead, roDeck, ui);
      gameStateStore.logMessage(dRes.resolved ? 'Disaster averted!' : 'Disaster ended in failure.');
      saveDecksToState(survivalDeck, roDeck);
      await ui.showTestResult({
        outcome: dRes.resolved ? 'WIN' : 'LOSE',
        finalPlayerTotal: 0,
        finalDealerTotal: 0,
        traitsExhausted: [],
        damageTaken: dRes.damageTaken,
      });
    }

    // Check if everyone is dead
    const allDead = state.characters.every((c) => c.isDead);
    if (allDead) {
      endGame(false, 'The entire crew has perished.');
      return;
    }

    phaseStateMachine.transitionTo('EXPLORING');
    this.advanceTurn();
  }

  /**
   * Attempts to resolve a crisis step in the current room.
   */
  public async attemptCrisisStep(ui: TestUI): Promise<boolean> {
    const state = gameStateStore.getState();
    const activeChar = this.getActiveCharacter();
    if (!activeChar || state.gamePhase !== 'EXPLORING' || !state.activeRoomId) return false;

    const graph = gameStateStore.getMapGraph();
    const currentRoom = graph.getRoom(state.activeRoomId);
    if (!currentRoom) return false;

    // Check if we already exceeded 3 attempts in this room
    const count = this.crisisTestCountPerRoom.get(currentRoom.id) || 0;
    if (count >= 3) {
      gameStateStore.logMessage('Exceeded maximum of 3 crisis resolution attempts in this room.');
      return false;
    }

    const attemptDecision = selectCrisisAttemptTarget(state, currentRoom);
    if (!attemptDecision.target) {
      gameStateStore.logMessage(attemptDecision.reason || 'No active unresolved crises to resolve.');
      return false;
    }
    const target = attemptDecision.target;

    gameStateStore.logMessage(`${activeChar.name} attempts to resolve a ${target.type.toLowerCase()} crisis step...`);
    phaseStateMachine.transitionTo('CRISIS_TEST');

    const { survivalDeck, roDeck } = getDecksFromState();
    const result = await runCrisisTest(activeChar, roDeck, ui);
    saveDecksToState(survivalDeck, roDeck);
    await ui.showTestResult(result.details);

    this.crisisTestCountPerRoom.set(currentRoom.id, count + 1);

    if (result.outcome === 'SUCCESS') {
      gameStateStore.updateState((s) => {
        const currentTarget = target.type === 'MAJOR' ? s.majorCrisisState : s.minorCrisisState;
        const crisisCard = target.type === 'MAJOR' ? s.majorCrisisCard : s.minorCrisisCard;
        if (!currentTarget) return;

        if (target.isFinalCardTest && crisisCard) {
          recordFinalCrisisResolution(currentTarget, currentRoom.id);
          resolveCrisisCard(currentTarget, crisisCard, survivalDeck);
          gameStateStore.logMessage(`${target.type === 'MAJOR' ? 'Major' : 'Minor'} Crisis resolved completely!`);
          if (target.type === 'MAJOR') {
            endGame(true, 'The Major Crisis has been resolved. You survived!');
          }
          return;
        }

        onCrisisTestSuccess(currentTarget);
        recordSuccessfulCrisisStep(currentTarget, currentRoom.id);
        gameStateStore.logMessage(
          `Success! Removed 1 Joker from ${target.type === 'MAJOR' ? 'Major' : 'Minor'} Crisis. Remaining: ${currentTarget.jokersRemaining}`
        );
      });
      saveDecksToState(survivalDeck, roDeck);
    } else if (result.outcome === 'BUST') {
      gameStateStore.updateState((s) => {
        const currentTarget = target.type === 'MAJOR' ? s.majorCrisisState : s.minorCrisisState;
        if (currentTarget && currentTarget.jokersRemaining > 0) {
          onCrisisTestBust(currentTarget, survivalDeck);
          gameStateStore.logMessage(`Bust! ${target.type === 'MAJOR' ? 'Major' : 'Minor'} Crisis Joker shuffled back into the Survival Deck.`);
        }
      });
      this.crisisTestCountPerRoom.set(currentRoom.id, 3);
      saveDecksToState(survivalDeck, roDeck);
    } else {
      gameStateStore.logMessage('Crisis resolution attempt failed.');
      const newObstacleCard = roDeck.draw();
      const newObstacleCardCode = getCardCode(newObstacleCard);
      const roomCardCode = getRoomCardCode(currentRoom) || currentRoom.cardCode || newObstacleCardCode;
      currentRoom.obstacleCardCode = newObstacleCardCode;
      currentRoom.roomObstacleDraw = createRoomObstacleDrawState(roomCardCode, newObstacleCardCode);
      currentRoom.isObstacleCleared = false;
      currentRoom.obstacleState = 'unresolved';
      saveDecksToState(survivalDeck, roDeck);
      gameStateStore.logMessage(`A new obstacle appears in this room: ${newObstacleCardCode}.`);
      phaseStateMachine.transitionTo('OBSTACLE');
      return false;
    }

    phaseStateMachine.transitionTo('EXPLORING');
    this.advanceTurn();
    return true;
  }
}

export const turnSequencer = new TurnSequencer();
