import { Card, Suit } from '@cardEngine/cardDefinitions';
import { Character } from '@characterSystem/characterTypes';

export function showGhostFlashbackModal(
  deadChar: Character,
  livingChar: Character,
  availableCards: Card[]
): Promise<{ cardToGive: Card; flashbackText: string } | null> {
  const modal = document.getElementById('ghost-flashback-modal') as HTMLDialogElement | null;
  const promptEl = document.getElementById('ghost-prompt');
  const cardsContainer = document.getElementById('ghost-cards-container');
  const narrationInput = document.getElementById('ghost-narration-input') as HTMLTextAreaElement | null;
  const submitBtn = document.getElementById('btn-ghost-submit') as HTMLButtonElement | null;
  const skipBtn = document.getElementById('btn-ghost-skip');

  if (!modal) return Promise.resolve(null);

  if (promptEl) {
    promptEl.textContent = `${deadChar.name} (Ghost) approaches ${livingChar.name}. Reminisce on a shared memory to trade your card.`;
  }

  if (narrationInput) {
    narrationInput.value = '';
  }

  let selectedCard: Card | null = null;

  if (cardsContainer) {
    cardsContainer.innerHTML = '';
    for (const card of availableCards) {
      const cardEl = document.createElement('div');
      let suitSymbol = '♠';
      if (card.suit === Suit.HEARTS) suitSymbol = '♥';
      if (card.suit === Suit.DIAMONDS) suitSymbol = '♦';
      if (card.suit === Suit.CLUBS) suitSymbol = '♣';

      const isRed = card.suit === Suit.HEARTS || card.suit === Suit.DIAMONDS;

      cardEl.className = 'playing-card playing-card--face-up';
      cardEl.style.cursor = 'pointer';
      cardEl.innerHTML = `
        <div class="playing-card__inner">
          <div class="playing-card__front" style="transform: rotateY(180deg); color: ${isRed ? 'var(--color-damage-red)' : 'var(--color-text-primary)'};">
            <div class="playing-card__corner">
              <span class="playing-card__rank">${card.rank}</span>
              <span class="playing-card__suit">${suitSymbol}</span>
            </div>
            <div class="playing-card__center-suit">${suitSymbol}</div>
            <div class="playing-card__corner" style="transform: rotate(180deg);">
              <span class="playing-card__rank">${card.rank}</span>
              <span class="playing-card__suit">${suitSymbol}</span>
            </div>
          </div>
        </div>
      `;

      cardEl.addEventListener('click', () => {
        cardsContainer.querySelectorAll('.playing-card').forEach((c) => {
          c.classList.remove('playing-card--selected');
          (c as HTMLElement).style.boxShadow = '';
        });
        cardEl.classList.add('playing-card--selected');
        cardEl.style.boxShadow = '0 0 15px var(--color-ghost-violet)';
        selectedCard = card;
        if (submitBtn) {
          submitBtn.disabled = !narrationInput?.value.trim();
        }
      });

      cardsContainer.appendChild(cardEl);
    }
  }

  if (submitBtn) {
    submitBtn.disabled = true;
  }

  // Real-time narration input validation
  if (narrationInput && submitBtn) {
    narrationInput.addEventListener('input', () => {
      submitBtn.disabled = !selectedCard || !narrationInput.value.trim();
    });
  }

  modal.showModal();

  return new Promise((resolve) => {
    const cleanup = () => {
      modal.close();
      if (submitBtn) submitBtn.replaceWith(submitBtn.cloneNode(true));
      if (skipBtn) skipBtn.replaceWith(skipBtn.cloneNode(true));
    };

    const bindSubmit = document.getElementById('btn-ghost-submit');
    const bindSkip = document.getElementById('btn-ghost-skip');

    bindSubmit?.addEventListener('click', () => {
      if (selectedCard && narrationInput?.value.trim()) {
        const text = narrationInput.value.trim();
        cleanup();
        resolve({
          cardToGive: selectedCard,
          flashbackText: `[Memory Flashback] ${deadChar.name}: "${text}"`,
        });
      }
    });

    bindSkip?.addEventListener('click', () => {
      cleanup();
      resolve(null);
    });

    modal.addEventListener('cancel', () => {
      cleanup();
      resolve(null);
    });
  });
}
