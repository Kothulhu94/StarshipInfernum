import { gameStateStore } from './gameStateStore';
import { RoomNodeGraph } from '@mapGenerator/roomNodeGraph';
import { getScenarioById } from '@scenarioData/scenarioRegistry';
import { SerializableGameState, GameState } from './gameFlowTypes';
import { gameEventBus } from './gameEventBus';

const SAVE_KEY_PREFIX = 'starship-infernum-';

export class SaveLoadManager {
  /**
   * Helper to build the key for a slot.
   */
  private getSlotKey(slot: string): string {
    return `${SAVE_KEY_PREFIX}${slot}`;
  }

  /**
   * Checks if a save file exists in the specified slot.
   */
  public hasSave(slot: string): boolean {
    return localStorage.getItem(this.getSlotKey(slot)) !== null;
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
      mapGraphSerialized: {
        rooms: roomsArray,
        corridors: corridorsArray,
      },
    };

    localStorage.setItem(this.getSlotKey(slot), JSON.stringify(serialized));
    gameStateStore.logMessage(`Game autosaved/saved to slot "${slot}".`);
  }

  /**
   * Retrieves and deserializes the game state from the specified slot.
   * Returns true if successful, false otherwise.
   */
  public loadGame(slot: string): boolean {
    const raw = localStorage.getItem(this.getSlotKey(slot));
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
        newGraph.addRoom(room);
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
      });

      gameEventBus.emit('history_reloaded', parsed.historyLog);
      gameStateStore.logMessage(`Successfully loaded game session from slot "${slot}".`);
      return true;
    } catch (err) {
      console.error(`Failed to load saved game from slot "${slot}":`, err);
      return false;
    }
  }

  /**
   * Delete the save data in the specified slot.
   */
  public clearSave(slot: string): void {
    localStorage.removeItem(this.getSlotKey(slot));
  }
}

export const saveLoadManager = new SaveLoadManager();
