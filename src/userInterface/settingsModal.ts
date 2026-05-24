import { verbosityController } from '@narrativeSystem/verbosityController';
import { koboldClient } from '@narrativeSystem/koboldCppClient';
import { saveLoadManager } from '@gameFlow/saveLoadManager';
import { showScreen } from '../starshipInfernum';
import { VerbosityLevel } from '@narrativeSystem/narrativeTypes';

export function initSettingsModal(): void {
  const modal = document.getElementById('settings-modal') as HTMLDialogElement | null;
  const verbositySelect = document.getElementById('setting-verbosity') as HTMLSelectElement | null;
  const llmEndpointInput = document.getElementById('setting-llm-endpoint') as HTMLInputElement | null;
  const testLlmBtn = document.getElementById('btn-test-llm');
  const llmStatus = document.getElementById('llm-status');

  // Load initial settings values
  if (verbositySelect) {
    verbositySelect.addEventListener('change', () => {
      const val = verbositySelect.value.toUpperCase().replace('-', '_') as VerbosityLevel;
      verbosityController.setLevel(val);
    });
  }

  if (llmEndpointInput) {
    llmEndpointInput.addEventListener('change', () => {
      koboldClient.setEndpoint(llmEndpointInput.value);
    });
  }

  const updateStatusText = (connected: boolean) => {
    if (llmStatus) {
      if (connected) {
        llmStatus.textContent = 'Connected';
        llmStatus.className = 'settings-field__status settings-field__status--connected';
      } else {
        llmStatus.textContent = 'Disconnected';
        llmStatus.className = 'settings-field__status settings-field__status--disconnected';
      }
    }
  };

  if (testLlmBtn) {
    testLlmBtn.addEventListener('click', async () => {
      const originalText = testLlmBtn.textContent;
      testLlmBtn.textContent = 'Testing...';
      const connected = await koboldClient.checkHealth();
      updateStatusText(connected);
      testLlmBtn.textContent = originalText;
    });
  }

  // Check health initially
  koboldClient.checkHealth().then(updateStatusText);

  // Wires up manual save and load slot buttons in Settings field
  const slots = ['1', '2', '3'];
  for (const slot of slots) {
    const saveBtn = document.getElementById(`btn-save-${slot}`); // wait, index.html uses btn-save-slot-1
    const loadBtn = document.getElementById(`btn-load-${slot}`); // wait, index.html uses btn-load-slot-1
    
    const actualSaveBtn = document.getElementById(`btn-save-slot-${slot}`);
    const actualLoadBtn = document.getElementById(`btn-load-slot-${slot}`);

    if (actualSaveBtn) {
      actualSaveBtn.addEventListener('click', () => {
        saveLoadManager.saveGame(`save-${slot}`);
        alert(`Game saved to Slot ${slot}.`);
        if (modal) modal.close();
      });
    }

    if (actualLoadBtn) {
      actualLoadBtn.addEventListener('click', () => {
        if (saveLoadManager.hasSave(`save-${slot}`)) {
          const loaded = saveLoadManager.loadGame(`save-${slot}`);
          if (loaded) {
            alert(`Game loaded from Slot ${slot}.`);
            showScreen('game-screen');
            if (modal) modal.close();
          } else {
            alert(`Failed to load Save Slot ${slot}.`);
          }
        } else {
          alert(`Save Slot ${slot} is empty.`);
        }
      });
    }
  }
}
export function getVolumeSettings(): { volume: number; mute: boolean } {
  const volEl = document.getElementById('setting-volume') as HTMLInputElement | null;
  const muteEl = document.getElementById('setting-mute') as HTMLInputElement | null;
  return {
    volume: volEl ? parseInt(volEl.value, 10) / 100 : 0.6,
    mute: muteEl ? muteEl.checked : false,
  };
}
