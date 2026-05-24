/**
 * crisisClockManager.ts
 *
 * Manages the Crisis Clock tokens for Starship Infernum.
 * The clock ticks down (loses a token) every time the Survival Deck is reshuffled.
 * When the clock is empty and cannot be decremented further, time runs out and the game ends.
 */

export class CrisisClockManager {
  private tokensRemaining: number = 0;
  private tokensTotal: number = 0;

  constructor(numPlayers: number) {
    this.reset(numPlayers);
  }

  /**
   * Initializes or resets the clock.
   * Number of tokens starts equal to number of players (PCs),
   * but if there are only 2 players (PCs), it starts with 3 tokens.
   */
  public reset(numPlayers: number): void {
    const startTokens = numPlayers <= 2 ? 3 : numPlayers;
    this.tokensTotal = startTokens;
    this.tokensRemaining = startTokens;
  }

  /**
   * Decrements the clock by one token due to a Survival Deck reshuffle.
   * Returns true if a token was successfully removed.
   * Returns false if there are no tokens left to remove, signaling game over.
   */
  public tickReshuffle(): boolean {
    if (this.tokensRemaining <= 0) {
      return false; // Cannot remove another token — time expired!
    }
    this.tokensRemaining--;
    return true;
  }

  /**
   * Returns the current number of tokens remaining on the clock.
   */
  public getTokensRemaining(): number {
    return this.tokensRemaining;
  }

  /**
   * Returns the total/starting number of tokens for the clock.
   */
  public getTokensTotal(): number {
    return this.tokensTotal;
  }

  /**
   * Checks if time has completely expired.
   */
  public isTimeExpired(): boolean {
    return this.tokensRemaining <= 0;
  }

  /**
   * Adds a token back to the clock (e.g. from special scenario rewards).
   * Cannot exceed the starting total.
   */
  public addToken(): void {
    if (this.tokensRemaining < this.tokensTotal) {
      this.tokensRemaining++;
    }
  }
}
