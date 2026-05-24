import { showScreen } from '../starshipInfernum';
import { saveLoadManager } from '@gameFlow/saveLoadManager';

export function initTitleScreenPanel(): void {
  const newGameBtn = document.getElementById('btn-new-game');
  const continueBtn = document.getElementById('btn-continue') as HTMLButtonElement | null;
  const settingsBtn = document.getElementById('btn-settings');
  const settingsModal = document.getElementById('settings-modal') as HTMLDialogElement | null;

  if (newGameBtn) {
    newGameBtn.addEventListener('click', () => {
      showScreen('scenario-selection-screen');
    });
  }

  if (continueBtn) {
    // Enable button if autosave exists
    continueBtn.disabled = !saveLoadManager.hasSave('autosave');

    continueBtn.addEventListener('click', () => {
      const loaded = saveLoadManager.loadGame('autosave');
      if (loaded) {
        showScreen('game-screen');
      }
    });
  }

  if (settingsBtn && settingsModal) {
    settingsBtn.addEventListener('click', () => {
      settingsModal.showModal();
    });
  }
}
