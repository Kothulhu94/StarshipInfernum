import { phaseStateMachine } from './phaseStateMachine';
import { gameStateStore } from './gameStateStore';
import { gameEventBus } from './gameEventBus';

/**
 * Transitions the game phase to GAME_OVER and emits corresponding game over events.
 */
export function endGame(win: boolean, details: string): void {
  phaseStateMachine.transitionTo('GAME_OVER');
  gameStateStore.logMessage(`GAME OVER: ${win ? 'VICTORY' : 'DEFEAT'} - ${details}`);
  gameEventBus.emit('game_over', { win, details });
}
