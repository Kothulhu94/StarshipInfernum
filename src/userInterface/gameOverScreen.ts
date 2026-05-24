import { gameEventBus } from '@gameFlow/gameEventBus';
import { showScreen } from '../starshipInfernum';
import { gameStateStore } from '@gameFlow/gameStateStore';

export function initGameOverScreen(): void {
  const heading = document.getElementById('gameover-heading');
  const summary = document.getElementById('gameover-summary');
  const survivorsContainer = document.getElementById('gameover-survivors');

  const playAgainBtn = document.getElementById('btn-play-again');
  const returnTitleBtn = document.getElementById('btn-return-title');

  if (playAgainBtn) {
    playAgainBtn.addEventListener('click', () => {
      showScreen('scenario-selection-screen');
    });
  }

  if (returnTitleBtn) {
    returnTitleBtn.addEventListener('click', () => {
      showScreen('title-screen');
    });
  }

  // Listen to game_over event from turnSequencer
  gameEventBus.on('game_over', (data: { win: boolean; details: string }) => {
    showScreen('gameover-screen');

    if (heading) {
      heading.textContent = data.win ? 'MISSION VICTORY' : 'MISSION DEFEAT';
      heading.style.color = data.win ? 'var(--color-success-green)' : 'var(--color-damage-red)';
    }

    if (summary) {
      summary.textContent = data.details;
    }

    if (survivorsContainer) {
      survivorsContainer.innerHTML = '';
      const state = gameStateStore.getState();

      const survivors = state.characters.filter((c) => !c.isDead);
      if (survivors.length === 0) {
        survivorsContainer.innerHTML = `
          <p style="color: var(--color-text-muted); font-style: italic;">No crew members survived the void.</p>
        `;
        return;
      }

      for (const p of survivors) {
        const pEl = document.createElement('div');
        pEl.className = 'character-card';
        pEl.style.width = '160px';
        pEl.innerHTML = `
          <div class="character-card__name" style="color: var(--color-success-green);">${p.name}</div>
          <div class="character-card__concept">${p.concept}</div>
          <div style="font-size: var(--font-size-2xs); color: var(--color-text-secondary); margin-top: var(--space-2xs);">
            Aptitude: ${p.aptitude}
          </div>
        `;
        survivorsContainer.appendChild(pEl);
      }
    }
  });
}
