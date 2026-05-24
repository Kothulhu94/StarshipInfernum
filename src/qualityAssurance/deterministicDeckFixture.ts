import { Card } from '@cardEngine/cardDefinitions';
import { Deck } from '@cardEngine/deckManager';

export function cloneCard(card: Card): Card {
  return { ...card };
}

export function createDeterministicDeck(topDraws: Card[], isSurvivalDeck = false): Deck {
  const deck = new Deck(isSurvivalDeck);
  const deckInternals = deck as unknown as { cards: Card[] };
  deckInternals.cards = topDraws.map(cloneCard).reverse();
  return deck;
}

export function getDeterministicDeckCards(deck: Deck): Card[] {
  return (deck as unknown as { cards: Card[] }).cards;
}
