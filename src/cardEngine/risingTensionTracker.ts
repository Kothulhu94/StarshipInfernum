/**
 * risingTensionTracker.ts
 *
 * Tracks the "Rising Tension" level for player characters during Survival Tests.
 * Fails in a Survival Test hand increase the tension level for the next hand,
 * which increases the number of starting cards dealt to the player.
 */

export class RisingTensionTracker {
  private playerTension: Map<string, number> = new Map();

  /**
   * Gets the current tension level for a character.
   */
  public getTension(characterId: string): number {
    return this.playerTension.get(characterId) || 0;
  }

  /**
   * Increases the tension level for a character by 1.
   */
  public incrementTension(characterId: string): void {
    const current = this.getTension(characterId);
    this.playerTension.set(characterId, current + 1);
  }

  /**
   * Resets the tension level for a character to 0.
   */
  public resetTension(characterId: string): void {
    this.playerTension.delete(characterId);
  }

  /**
   * Calculates the number of starting cards a player should receive
   * based on their current tension level.
   * Standard starting cards is 2. Each level of tension adds 1 card.
   */
  public getStartingCardCount(characterId: string): number {
    return 2 + this.getTension(characterId);
  }
}
