import { gameStateStore } from './gameStateStore';
import { gameEventBus } from './gameEventBus';
import { Deck } from '@cardEngine/deckManager';
import { Card } from '@cardEngine/cardDefinitions';
import { endGame } from './gameOverHandler';

/**
 * Helper to instantiate Deck classes from the current state arrays.
 */
export function getDecksFromState(): { survivalDeck: Deck; roDeck: Deck } {
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
export function saveDecksToState(survivalDeck: Deck, roDeck: Deck): void {
  gameStateStore.updateState((state) => {
    state.survivalDeckCards = (survivalDeck as any).cards;
    state.roDeckCards = (roDeck as any).cards;
  });
}

/**
 * Intercepts deck drawing to catch empty decks (reshuffles) and Joker draws.
 */
export function instrumentDecks(
  survivalDeck: Deck
): { jokerDrawnThisStep: boolean } {
  const trigger = { jokerDrawnThisStep: false };
  const originalSurvivalDraw = survivalDeck.draw;

  survivalDeck.draw = () => {
    if (survivalDeck.getRemainingCount() === 0) {
      handleSurvivalDeckReshuffle(survivalDeck);
    }
    const card = originalSurvivalDraw.call(survivalDeck);
    if (card && card.isJoker) {
      trigger.jokerDrawnThisStep = true;
      gameStateStore.updateState((state) => {
        state.drawnJokers.push(card);
      });
    }
    return card;
  };

  return trigger;
}

/**
 * Processes a Survival Deck reshuffle, updating clock tokens and shuffles Jokers back in.
 */
export function handleSurvivalDeckReshuffle(survivalDeck: Deck): void {
  gameStateStore.updateState((state) => {
    if (state.crisisClockTokensRemaining <= 0) {
      gameStateStore.logMessage('Crisis Clock is empty and another Survival Deck reshuffle was required. Time expired!');
      endGame(false, 'Crisis Clock tokens exhausted. The ship was lost.');
      return;
    }

    state.crisisClockTokensRemaining--;
    gameStateStore.logMessage(
      `Survival Deck reshuffled! Removed 1 token from Crisis Clock. Remaining tokens: ${state.crisisClockTokensRemaining}`
    );
    gameEventBus.emit('clock_ticked', {
      remaining: state.crisisClockTokensRemaining,
      total: state.crisisClockTokensTotal,
    });

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
