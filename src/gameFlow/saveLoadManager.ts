import { gameStateStore } from './gameStateStore';
import { RoomNodeGraph } from '@mapGenerator/roomNodeGraph';
import { getScenarioById } from '@scenarioData/scenarioRegistry';
import { SerializableGameState, GameState } from './gameFlowTypes';
import { gameEventBus } from './gameEventBus';
import { normalizeRoomObstacleState } from '@mapGenerator/roomObstacleState';

const SAVE_KEY_PREFIX = 'starship-infernum-';
const AUTOSAVE_SLOT = 'autosave';

export class SaveLoadManager {
  /**
   * Helper to build the key for a slot.
   */
  private getSlotKey(slot: string): string {
    return `${SAVE_KEY_PREFIX}${slot}`;
  }

  private getScenarioAutosaveSlot(scenarioId: string): string {
    return `${AUTOSAVE_SLOT}-${scenarioId}`;
  }

  private getActiveAutosaveSlot(): string | null {
    const scenarioId = gameStateStore.getState().scenario?.id;
    return scenarioId ? this.getScenarioAutosaveSlot(scenarioId) : null;
  }

  /**
   * Checks if a save file exists in the specified slot.
   */
  public hasSave(slot: string): boolean {
    const resolvedSlot = slot === AUTOSAVE_SLOT ? this.getActiveAutosaveSlot() : slot;
    return resolvedSlot ? localStorage.getItem(this.getSlotKey(resolvedSlot)) !== null : false;
  }

  public hasScenarioAutosave(scenarioId: string): boolean {
    const raw = localStorage.getItem(this.getSlotKey(this.getScenarioAutosaveSlot(scenarioId)));
    if (!raw) return false;

    try {
      const parsed: SerializableGameState = JSON.parse(raw);
      return parsed.scenarioId === scenarioId && parsed.gamePhase !== 'GAME_OVER';
    } catch {
      return false;
    }
  }

  /**
   * Serializes the current game state and writes it to localStorage.
   */
  public saveGame(slot: string): void {
    const state = gameStateStore.getState();
    const mapGraph = gameStateStore.getMapGraph();

    if (!state.scenario) {
      console.warn('Cannot save: No active scenario found.');
      return;
    }

    const roomsArray = Array.from(mapGraph.rooms.values());
    const corridorsArray = Array.from(mapGraph.corridors.values());

    const serialized: SerializableGameState = {
      gamePhase: state.gamePhase,
      scenarioId: state.scenario.id,
      characters: state.characters,
      activeCharacterId: state.activeCharacterId,
      majorCrisisState: state.majorCrisisState,
      minorCrisisState: state.minorCrisisState,
      majorCrisisCard: state.majorCrisisCard,
      minorCrisisCard: state.minorCrisisCard,
      crisisClockTokensRemaining: state.crisisClockTokensRemaining,
      crisisClockTokensTotal: state.crisisClockTokensTotal,
      activeRoomId: state.activeRoomId,
      currentDeck: state.currentDeck,
      isFatalDisasters: state.isFatalDisasters,
      historyLog: state.historyLog,
      survivalDeckCards: state.survivalDeckCards,
      roDeckCards: state.roDeckCards,
      drawnJokers: state.drawnJokers,
      adversaryInstances: state.adversaryInstances,
      mapGraphSerialized: {
        rooms: roomsArray,
        corridors: corridorsArray,
      },
    };

    const resolvedSlot = slot === AUTOSAVE_SLOT ? this.getScenarioAutosaveSlot(state.scenario.id) : slot;
    localStorage.setItem(this.getSlotKey(resolvedSlot), JSON.stringify(serialized));
    gameStateStore.logMessage(`Game autosaved/saved to slot "${slot}".`);
  }

  /**
   * Retrieves and deserializes the game state from the specified slot.
   * Returns true if successful, false otherwise.
   */
  public loadGame(slot: string): boolean {
    const resolvedSlot = slot === AUTOSAVE_SLOT ? this.getActiveAutosaveSlot() : slot;
    if (!resolvedSlot) {
      console.warn(`No active scenario available for slot: ${slot}`);
      return false;
    }

    const raw = localStorage.getItem(this.getSlotKey(resolvedSlot));
    if (!raw) {
      console.warn(`No saved game found in slot: ${slot}`);
      return false;
    }

    try {
      const parsed: SerializableGameState = JSON.parse(raw);
      const scenario = getScenarioById(parsed.scenarioId || '');
      if (!scenario) {
        throw new Error(`Scenario not found: ${parsed.scenarioId}`);
      }

      // Reconstruct RoomNodeGraph
      const newGraph = new RoomNodeGraph();
      for (const room of parsed.mapGraphSerialized.rooms) {
        newGraph.addRoom(normalizeRoomObstacleState(room));
      }
      for (const corridor of parsed.mapGraphSerialized.corridors) {
        newGraph.addCorridor(corridor);
      }

      // Update GameStateStore
      gameStateStore.setMapGraph(newGraph);
      gameEventBus.emit('game_reset');
      gameStateStore.updateState((state: GameState) => {
        state.gamePhase = parsed.gamePhase;
        state.scenario = scenario;
        state.characters = parsed.characters;
        state.activeCharacterId = parsed.activeCharacterId;
        state.majorCrisisState = parsed.majorCrisisState;
        state.minorCrisisState = parsed.minorCrisisState;
        state.majorCrisisCard = parsed.majorCrisisCard;
        state.minorCrisisCard = parsed.minorCrisisCard;
        state.crisisClockTokensRemaining = parsed.crisisClockTokensRemaining;
        state.crisisClockTokensTotal = parsed.crisisClockTokensTotal;
        state.activeRoomId = parsed.activeRoomId;
        state.currentDeck = parsed.currentDeck;
        state.isFatalDisasters = parsed.isFatalDisasters;
        state.historyLog = parsed.historyLog;
        state.survivalDeckCards = parsed.survivalDeckCards;
        state.roDeckCards = parsed.roDeckCards;
        state.drawnJokers = parsed.drawnJokers || [];
        state.adversaryInstances = parsed.adversaryInstances || [];
      });

      gameEventBus.emit('history_reloaded', parsed.historyLog);
      gameStateStore.logMessage(`Successfully loaded game session from slot "${slot}".`);
      return true;
    } catch (err) {
      console.error(`Failed to load saved game from slot "${slot}":`, err);
      return false;
    }
  }

  public loadScenarioAutosave(scenarioId: string): boolean {
    if (!this.hasScenarioAutosave(scenarioId)) return false;
    return this.loadGame(this.getScenarioAutosaveSlot(scenarioId));
  }

  /**
   * Delete the save data in the specified slot.
   */
  public clearSave(slot: string): void {
    const resolvedSlot = slot === AUTOSAVE_SLOT ? this.getActiveAutosaveSlot() : slot;
    if (resolvedSlot) {
      localStorage.removeItem(this.getSlotKey(resolvedSlot));
    }
  }

  public clearScenarioAutosave(scenarioId: string): void {
    localStorage.removeItem(this.getSlotKey(this.getScenarioAutosaveSlot(scenarioId)));
  }

  public clearCurrentScenarioAutosave(): void {
    const autosaveSlot = this.getActiveAutosaveSlot();
    if (autosaveSlot) {
      localStorage.removeItem(this.getSlotKey(autosaveSlot));
    }
  }
}

export const saveLoadManager = new SaveLoadManager();
