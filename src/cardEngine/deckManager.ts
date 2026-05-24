import { Card, Suit, Rank } from './cardDefinitions';

export class Deck {
  private cards: Card[] = [];

  constructor(public isSurvivalDeck: boolean = false) {
    this.reset();
  }

  public reset(): void {
    this.cards = [];
    const suits = [Suit.HEARTS, Suit.SPADES, Suit.DIAMONDS, Suit.CLUBS];
    const ranks: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    for (const suit of suits) {
      for (const rank of ranks) {
        this.cards.push({ suit, rank, faceUp: false });
      }
    }
  }

  public shuffle(): void {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  public draw(): Card {
    const card = this.cards.pop();
    if (!card) {
      this.reset();
      this.shuffle();
      return this.cards.pop()!;
    }
    return card;
  }

  public getRemainingCount(): number {
    return this.cards.length;
  }

  /**
   * Removes all cards matching the given rank and suit from the deck.
   * Returns the removed card, or null if not found.
   */
  public removeCard(rank: Rank, suit: Suit): Card | null {
    const idx = this.cards.findIndex(c => c.rank === rank && c.suit === suit && !c.isJoker);
    if (idx !== -1) {
      return this.cards.splice(idx, 1)[0];
    }
    return null;
  }

  /**
   * Randomly inserts a Joker card into the deck.
   */
  public insertJoker(faceUp: boolean = true): void {
    const jokerCard: Card = {
      suit: Suit.SPADES, // Dummy suit
      rank: 'A', // Dummy rank
      faceUp,
      isJoker: true
    };
    const insertPos = Math.floor(Math.random() * (this.cards.length + 1));
    this.cards.splice(insertPos, 0, jokerCard);
  }

  /**
   * Removes all Jokers currently in the deck. Returns the count of removed Jokers.
   */
  public removeJokers(): number {
    const originalCount = this.cards.length;
    this.cards = this.cards.filter(c => !c.isJoker);
    return originalCount - this.cards.length;
  }
}
