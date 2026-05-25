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

      cardEl.className = 'simple-card-value';
      cardEl.style.backgroundColor = 'var(--color-ghost-violet-dim)';
      cardEl.style.color = card.isJoker ? 'var(--color-alert-amber)' : '#ffffff';
      cardEl.style.textShadow = '0 1px 3px rgba(0,0,0,0.8)';
      cardEl.style.setProperty('--card-color', 'var(--color-ghost-violet)');
      
      const getNumericRank = (rank: string) => {
        if (rank === 'A') return '1';
        if (rank === 'J') return '11';
        if (rank === 'Q') return '12';
        if (rank === 'K') return '13';
        return rank;
      };
      
      cardEl.textContent = card.isJoker ? 'JK' : getNumericRank(String(card.rank));

      cardEl.addEventListener('click', () => {
        cardsContainer.querySelectorAll('.simple-card-value').forEach((c) => {
          c.classList.remove('simple-card-value--selected');
        });
        cardEl.classList.add('simple-card-value--selected');
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
