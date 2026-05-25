import { showScreen } from '../starshipInfernum';
import { refreshScenarioContinueButtons } from './scenarioSelectionPanel';

export function initTitleScreenPanel(): void {
  const startBtn = document.getElementById('btn-start');
  const settingsBtn = document.getElementById('btn-model-settings');
  const settingsModal = document.getElementById('settings-modal') as HTMLDialogElement | null;

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      refreshScenarioContinueButtons();
      showScreen('scenario-selection-screen');
    });
  }

  if (settingsBtn && settingsModal) {
    settingsBtn.addEventListener('click', () => {
      settingsModal.showModal();
    });
  }
}
