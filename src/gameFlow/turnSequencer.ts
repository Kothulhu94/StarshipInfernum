import { gameStateStore } from './gameStateStore';
import { phaseStateMachine } from './phaseStateMachine';
import { gameEventBus } from './gameEventBus';
import { saveLoadManager } from './saveLoadManager';
import { getCardCode, dispatchObstacle } from '@encounterSystem/obstacleDispatcher';
import { runCrisisTest } from '@encounterSystem/crisisTestRunner';
import { runDisasterTest } from '@crisisSystem/disasterResolver';
import { runSimpleTest } from '@encounterSystem/simpleTestRunner';
import { onCrisisTestSuccess, onCrisisTestBust, resolveCrisisCard } from '@crisisSystem/jokerEventHandler';
import { RoomNode, DoorDirection } from '@mapGenerator/mapLayoutTypes';
import { ShipLayoutBuilder } from '@mapGenerator/shipLayoutBuilder';
import { Deck } from '@cardEngine/deckManager';
import { Card } from '@cardEngine/cardDefinitions';
import { TestUI, TestResult } from '@encounterSystem/encounterTypes';
import { Character } from '@characterSystem/characterTypes';

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
   * Helper to instantiate Deck classes from the current state arrays.
   */
  private getDecksFromState(): { survivalDeck: Deck; roDeck: Deck } {
    const state = gameStateStore.getState();
    const survivalDeck = new Deck(true);
    (survivalDeck as any).cards = state.survivalDeckCards;

    const roDeck = new Deck(false);
    (roDeck as any).cards = state.roDeckCards;

    return { survivalDeck, roDeck };
  }

  /**
   * Helper to write Deck states back to the game state store.
   */
  private saveDecksToState(survivalDeck: Deck, roDeck: Deck): void {
    gameStateStore.updateState((state) => {
      state.survivalDeckCards = (survivalDeck as any).cards;
      state.roDeckCards = (roDeck as any).cards;
    });
  }

  private getDisplayResult(
    testResult: TestResult | Map<string, TestResult>,
    preferredCharacterId?: string
  ): TestResult {
    if (!(testResult instanceof Map)) {
      return testResult;
    }

    const preferred = preferredCharacterId ? testResult.get(preferredCharacterId) : undefined;
    if (preferred) {
      return preferred;
    }

    return Array.from(testResult.values())[0] || {
      outcome: 'PUSH',
      finalPlayerTotal: 0,
      finalDealerTotal: 0,
      traitsExhausted: [],
    };
  }

  /**
   * Intercepts deck drawing to catch empty decks (reshuffles) and Joker draws.
   */
  private instrumentDecks(survivalDeck: Deck, roDeck: Deck): { jokerDrawnThisStep: boolean } {
    const trigger = { jokerDrawnThisStep: false };
    const originalSurvivalDraw = survivalDeck.draw;

    survivalDeck.draw = () => {
      if (survivalDeck.getRemainingCount() === 0) {
        this.handleSurvivalDeckReshuffle(survivalDeck);
      }
      const card = originalSurvivalDraw.call(survivalDeck);
      if (card && card.isJoker) {
        trigger.jokerDrawnThisStep = true;
        gameStateStore.updateState((state) => {
          if (!state.drawnJokers.some((c) => c.suit === card.suit && c.rank === card.rank)) {
            state.drawnJokers.push(card);
          }
        });
      }
      return card;
    };

    return trigger;
  }

  /**
   * Processes a Survival Deck reshuffle, updating clock tokens and shuffles Jokers back in.
   */
  private handleSurvivalDeckReshuffle(survivalDeck: Deck): void {
    gameStateStore.updateState((state) => {
      if (state.crisisClockTokensRemaining > 0) {
        state.crisisClockTokensRemaining--;
        gameStateStore.logMessage(
          `Survival Deck reshuffled! Removed 1 token from Crisis Clock. Remaining tokens: ${state.crisisClockTokensRemaining}`
        );
        gameEventBus.emit('clock_ticked', {
          remaining: state.crisisClockTokensRemaining,
          total: state.crisisClockTokensTotal,
        });

        if (state.crisisClockTokensRemaining === 0) {
          gameStateStore.logMessage('Crisis Clock empty. Time expired!');
          this.endGame(false, 'Crisis Clock tokens exhausted. The ship was lost.');
          return;
        }
      }

      // Return drawn Jokers back into the deck face up
      if (state.drawnJokers.length > 0) {
        const deckCards = (survivalDeck as any).cards as Card[];
        for (const joker of state.drawnJokers) {
          deckCards.push({ ...joker, faceUp: true });
        }
        state.drawnJokers = [];
        survivalDeck.shuffle();
      }
    });
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
      this.endGame(false, 'All crew members have perished.');
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

    const currentRoomId = state.activeRoomId;
    if (!currentRoomId || !graph.areConnected(currentRoomId, toRoomId)) {
      gameStateStore.logMessage(`Rooms are not directly connected.`);
      return;
    }

    const targetRoom = graph.getRoom(toRoomId);
    if (!targetRoom) return;

    gameStateStore.updateState((s) => {
      s.activeRoomId = toRoomId;
      s.currentDeck = targetRoom.z;
    });

    gameStateStore.logMessage(`${activeChar.name} moved to the ${targetRoom.name}.`);
    
    // Autosave immediately upon room entry
    saveLoadManager.saveGame('autosave');

    // Check if the target room has an unresolved obstacle
    const hasObstacle = targetRoom.cardCode && !targetRoom.isDiscovered; // wait, if not discovered, obstacle is active
    if (hasObstacle) {
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

    const { survivalDeck, roDeck } = this.getDecksFromState();

    // Draw card to determine room & obstacle
    const drawnCard = roDeck.draw();
    const drawnCardCode = getCardCode(drawnCard);

    // Grow map graph
    const layoutBuilder = new ShipLayoutBuilder();
    const newRoom = layoutBuilder.discoverRoom(graph, state.activeRoomId, doorDirection, drawnCardCode);

    if (!newRoom) {
      gameStateStore.logMessage(`Could not grow room in direction: ${doorDirection} (blocked or out of bounds).`);
      this.saveDecksToState(survivalDeck, roDeck);
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
    this.saveDecksToState(survivalDeck, roDeck);

    // Check for crisis card match: does drawnCardCode match previous drawn card rank/suit?
    let matchTriggered = false;
    if (this.lastDrawnROCardCode) {
      const currentRank = drawnCard.rank;
      const currentSuit = drawnCard.suit;
      const prevRank = this.lastDrawnROCardCode[0];
      const prevSuit = this.lastDrawnROCardCode[1]; // approximate check
      if (currentRank === prevRank || currentSuit[0] === prevSuit) {
        matchTriggered = true;
      }
    }
    this.lastDrawnROCardCode = drawnCardCode;

    // Trigger narrative router
    gameEventBus.emit('narrative_triggered', {
      type: 'ROOM_ENTERED',
      context: {
        scenarioName: state.scenario?.name || '',
        characterName: activeChar.name,
        characterTraits: activeChar.traits.map((t) => t.name),
        roomName: newRoom.name,
        obstacleName: newRoom.name,
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
      const { survivalDeck, roDeck } = this.getDecksFromState();
      
      // Simple test with +1 tension card count (simulated via 1 starting tension in SimpleTest)
      const result = await runSimpleTest(activeChar, roDeck, ui);
      this.saveDecksToState(survivalDeck, roDeck);
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
    if (!currentRoom || !currentRoom.cardCode) {
      phaseStateMachine.transitionTo('EXPLORING');
      return;
    }

    const { survivalDeck, roDeck } = this.getDecksFromState();
    const trigger = this.instrumentDecks(survivalDeck, roDeck);

    // Card drawn from RO deck representing the room's card code
    const rank = currentRoom.cardCode.substring(0, currentRoom.cardCode.length - 1) as any;
    const suitLetter = currentRoom.cardCode.charAt(currentRoom.cardCode.length - 1);
    let suit = 'SPADES';
    if (suitLetter === 'H') suit = 'HEARTS';
    if (suitLetter === 'D') suit = 'DIAMONDS';
    if (suitLetter === 'C') suit = 'CLUBS';

    const obstacleCard: Card = {
      suit: suit as any,
      rank,
      faceUp: true,
    };

    const otherPlayers = state.characters.filter((c) => c.id !== activeChar.id);
    const deadPCs = state.characters.filter((c) => c.isDead);

    gameStateStore.logMessage(`Encountering obstacle: ${currentRoom.name} (${currentRoom.cardCode})`);
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

    this.saveDecksToState(survivalDeck, roDeck);
    await ui.showTestResult(this.getDisplayResult(testResult, activeChar.id));

    // Check if test resulted in win or bust
    let isBust = false;
    let isWin = false;

    if (testResult instanceof Map) {
      // Group Test results
      isWin = Array.from(testResult.values()).some((r) => r.outcome === 'WIN');
      isBust = Array.from(testResult.values()).some((r) => r.outcome === 'BUST');
    } else {
      isWin = testResult.outcome === 'WIN';
      isBust = testResult.outcome === 'BUST';
    }

    // Mark room as completely discovered/cleared
    gameStateStore.updateState(() => {
      currentRoom.isDiscovered = true;
    });

    gameStateStore.logMessage(isWin ? `Obstacle successfully cleared.` : `Failed to clear obstacle.`);

    // If Joker was drawn, resolve the Disaster immediately
    if (trigger.jokerDrawnThisStep) {
      gameStateStore.logMessage('A Joker was drawn! Triggering a crisis Disaster...');
      phaseStateMachine.transitionTo('DISASTER');

      const disasterPlayers = state.characters.filter((c) => !c.isDead);
      const disasterDead = state.characters.filter((c) => c.isDead);

      const dRes = await runDisasterTest(disasterPlayers, disasterDead, roDeck, ui);
      gameStateStore.logMessage(dRes.resolved ? 'Disaster averted!' : 'Disaster ended in failure.');
      this.saveDecksToState(survivalDeck, roDeck);
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
      this.endGame(false, 'The entire crew has perished.');
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

    // Check if active crisis resolution room matches current room name
    const matchesMajor = state.majorCrisisState && !state.majorCrisisState.isResolved;
    const matchesMinor = state.minorCrisisState && !state.minorCrisisState.isResolved;

    if (!matchesMajor && !matchesMinor) {
      gameStateStore.logMessage('No active unresolved crises to resolve.');
      return false;
    }

    gameStateStore.logMessage(`${activeChar.name} attempts to resolve a crisis step...`);
    phaseStateMachine.transitionTo('CRISIS_TEST');

    const { survivalDeck, roDeck } = this.getDecksFromState();
    const result = await runCrisisTest(activeChar, roDeck, ui);
    this.saveDecksToState(survivalDeck, roDeck);
    await ui.showTestResult(result.details);

    this.crisisTestCountPerRoom.set(currentRoom.id, count + 1);

    if (result.outcome === 'SUCCESS') {
      gameStateStore.updateState((s) => {
        // Resolve step for either major or minor
        if (s.majorCrisisState && s.majorCrisisState.jokersRemaining > 0) {
          onCrisisTestSuccess(s.majorCrisisState);
          gameStateStore.logMessage(`Success! Removed 1 Joker from Major Crisis. Remaining: ${s.majorCrisisState.jokersRemaining}`);
          
          if (s.majorCrisisState.jokersRemaining === 0 && s.majorCrisisCard) {
            // Final crisis card resolution
            resolveCrisisCard(s.majorCrisisState, s.majorCrisisCard, survivalDeck);
            gameStateStore.logMessage(`Major Crisis resolved completely!`);
            this.endGame(true, 'The Major Crisis has been resolved. You survived!');
            return;
          }
        } else if (s.minorCrisisState && s.minorCrisisState.jokersRemaining > 0) {
          onCrisisTestSuccess(s.minorCrisisState);
          gameStateStore.logMessage(`Success! Removed 1 Joker from Minor Crisis. Remaining: ${s.minorCrisisState.jokersRemaining}`);
          
          if (s.minorCrisisState.jokersRemaining === 0 && s.minorCrisisCard) {
            resolveCrisisCard(s.minorCrisisState, s.minorCrisisCard, survivalDeck);
            gameStateStore.logMessage(`Minor Crisis resolved!`);
          }
        }
      });
    } else if (result.outcome === 'BUST') {
      gameStateStore.updateState((s) => {
        if (s.majorCrisisState && s.majorCrisisState.jokersRemaining > 0) {
          onCrisisTestBust(s.majorCrisisState, survivalDeck);
          gameStateStore.logMessage(`Bust! Major Crisis Joker shuffled back into the Survival Deck.`);
        } else if (s.minorCrisisState && s.minorCrisisState.jokersRemaining > 0) {
          onCrisisTestBust(s.minorCrisisState, survivalDeck);
          gameStateStore.logMessage(`Bust! Minor Crisis Joker shuffled back into the Survival Deck.`);
        }
      });
      this.saveDecksToState(survivalDeck, roDeck);
    } else {
      gameStateStore.logMessage('Crisis resolution attempt failed.');
      // Draw new obstacle on fail
      phaseStateMachine.transitionTo('OBSTACLE');
      return false;
    }

    phaseStateMachine.transitionTo('EXPLORING');
    this.advanceTurn();
    return true;
  }

  /**
   * Helper to flag game over.
   */
  private endGame(win: boolean, details: string): void {
    phaseStateMachine.transitionTo('GAME_OVER');
    gameStateStore.logMessage(`GAME OVER: ${win ? 'VICTORY' : 'DEFEAT'} - ${details}`);
    gameEventBus.emit('game_over', { win, details });
  }
}

export const turnSequencer = new TurnSequencer();
