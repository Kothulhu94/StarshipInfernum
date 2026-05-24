import { GameState, GamePhase } from './gameFlowTypes';
import { gameEventBus } from './gameEventBus';
import { Character } from '@characterSystem/characterTypes';
import { ScenarioConfig } from '@scenarioData/scenarioTypes';
import { Deck } from '@cardEngine/deckManager';
import { setupCrisesAndJokers } from '@crisisSystem/jokerEventHandler';
import { RoomNodeGraph } from '@mapGenerator/roomNodeGraph';
import { ShipLayoutBuilder } from '@mapGenerator/shipLayoutBuilder';
import { getCardCode } from '@encounterSystem/obstacleDispatcher';

export class GameStateStore {
  private state!: GameState;
  private mapGraph!: RoomNodeGraph;

  constructor() {
    this.resetToDefaults();
  }

  /**
   * Resets the store state to empty/default setup values.
   */
  private resetToDefaults(): void {
    this.mapGraph = new RoomNodeGraph();
    this.state = {
      gamePhase: 'SETUP',
      scenario: null,
      characters: [],
      activeCharacterId: null,
      majorCrisisState: null,
      minorCrisisState: null,
      majorCrisisCard: null,
      minorCrisisCard: null,
      crisisClockTokensRemaining: 0,
      crisisClockTokensTotal: 0,
      activeRoomId: null,
      currentDeck: 0,
      isFatalDisasters: true,
      historyLog: [],
      survivalDeckCards: [],
      roDeckCards: [],
      drawnJokers: [],
      adversaryInstances: [],
    };
  }

  /**
   * Returns the current read-only snapshot of the game state.
   */
  public getState(): GameState {
    return this.state;
  }

  /**
   * Returns the RoomNodeGraph instance.
   */
  public getMapGraph(): RoomNodeGraph {
    return this.mapGraph;
  }

  /**
   * Sets the active RoomNodeGraph instance (used during state loads).
   */
  public setMapGraph(graph: RoomNodeGraph): void {
    this.mapGraph = graph;
  }

  /**
   * Updates the game state using a mutating callback and broadcasts changes.
   */
  public updateState(updater: (state: GameState) => void): void {
    updater(this.state);
    gameEventBus.emit('state_updated', this.state);
  }

  /**
   * Transition to a new game phase, notifying listeners.
   */
  public setPhase(phase: GamePhase): void {
    if (this.state.gamePhase !== phase) {
      this.state.gamePhase = phase;
      this.logMessage(`Game phase changed to ${phase}`);
      gameEventBus.emit('phase_changed', phase);
      gameEventBus.emit('state_updated', this.state);
    }
  }

  /**
   * Append a log message to history and emit event.
   */
  public logMessage(message: string): void {
    this.state.historyLog.push(message);
    gameEventBus.emit('log_added', message);
  }

  /**
   * Initialize a brand new game using the given scenario and characters.
   */
  public initializeNewGame(scenario: ScenarioConfig, characters: Character[]): void {
    gameEventBus.emit('game_reset');
    this.resetToDefaults();

    this.state.scenario = scenario;
    this.state.characters = characters.map((c) => ({
      ...c,
      isDead: false,
      ghostCard: undefined,
    }));
    this.state.activeCharacterId = characters[0]?.id || null;

    // 1. Initialize decks
    const survivalDeck = new Deck(true);
    survivalDeck.shuffle();

    const roDeck = new Deck(false);
    roDeck.shuffle();

    // 2. Setup crises and Jokers
    const numPCs = this.state.characters.length;
    const { majorState, minorState, majorCard, minorCard } = setupCrisesAndJokers(
      scenario.majorCrisis,
      scenario.defaultMinorCrisis,
      numPCs,
      survivalDeck
    );

    this.state.majorCrisisState = majorState;
    this.state.minorCrisisState = minorState;
    this.state.majorCrisisCard = majorCard;
    this.state.minorCrisisCard = minorCard;

    // 3. Setup Crisis Clock
    // "starts equal to number of players (PCs), but if only 2 players, starts with 3 tokens"
    const startTokens = numPCs <= 2 ? 3 : numPCs;
    this.state.crisisClockTokensTotal = startTokens;
    this.state.crisisClockTokensRemaining = startTokens;

    // 4. Setup Map layout with a seed room (draw from RO deck to find seed room)
    const seedCard = roDeck.draw();
    const seedCardCode = getCardCode(seedCard);

    const layoutBuilder = new ShipLayoutBuilder();
    this.mapGraph = layoutBuilder.createInitialLayout(seedCardCode);

    // Get seed room ID
    const seedRoom = Array.from(this.mapGraph.rooms.values())[0];
    this.state.activeRoomId = seedRoom?.id || null;
    this.state.currentDeck = 0;

    // Save cards state into arrays
    this.state.survivalDeckCards = (survivalDeck as any).cards;
    this.state.roDeckCards = (roDeck as any).cards;
    this.state.drawnJokers = [];
    this.state.adversaryInstances = [];

    this.state.gamePhase = 'EXPLORING';
    
    this.logMessage(`Initialized scenario: "${scenario.name}" on ${scenario.shipName}.`);
    this.logMessage(`Seed room created: "${seedRoom?.name || 'Airlock'}".`);
    
    gameEventBus.emit('state_updated', this.state);
  }
}

export const gameStateStore = new GameStateStore();
