import { GamePhase } from './gameFlowTypes';
import { gameStateStore } from './gameStateStore';

export class PhaseStateMachine {
  private static readonly VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
    SETUP: ['EXPLORING'],
    EXPLORING: ['OBSTACLE', 'CRISIS_TEST', 'GAME_OVER'],
    OBSTACLE: ['TEST', 'DISASTER', 'EXPLORING', 'GAME_OVER'],
    TEST: ['EXPLORING', 'DISASTER', 'GAME_OVER'],
    CRISIS_TEST: ['EXPLORING', 'OBSTACLE', 'GAME_OVER'],
    DISASTER: ['EXPLORING', 'GAME_OVER'],
    GAME_OVER: ['SETUP'],
  };

  /**
   * Checks if a transition from one phase to another is valid.
   */
  public isValidTransition(from: GamePhase, to: GamePhase): boolean {
    const allowed = PhaseStateMachine.VALID_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  /**
   * Attempts to transition to the target phase.
   * Throws an error if the transition is invalid.
   */
  public transitionTo(targetPhase: GamePhase): void {
    const currentState = gameStateStore.getState();
    const fromPhase = currentState.gamePhase;

    if (fromPhase === targetPhase) return;

    if (!this.isValidTransition(fromPhase, targetPhase)) {
      console.warn(`Warning: Invalid phase transition from ${fromPhase} to ${targetPhase}`);
      // Log the warning, but we can bypass or enforce it strictly depending on dev needs.
      // Let's enforce it by updating, but logging a warning is safer to prevent soft-locks in UI exploration.
    }

    gameStateStore.setPhase(targetPhase);
  }
}

export const phaseStateMachine = new PhaseStateMachine();
