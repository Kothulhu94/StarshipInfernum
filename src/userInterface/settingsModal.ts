import { verbosityController } from '@narrativeSystem/verbosityController';
import { koboldClient } from '@narrativeSystem/koboldCppClient';
import { saveLoadManager } from '@gameFlow/saveLoadManager';
import { showScreen } from '../starshipInfernum';
import { VerbosityLevel } from '@narrativeSystem/narrativeTypes';
import { invoke } from '@tauri-apps/api/core';

interface ModelInfo {
  name: string;
  display_name: string;
  exists: boolean;
  size_gb: number;
  description: string;
}

const MODEL_RECOMMENDATIONS: Record<string, string> = {
  'gemma4-e2b.gguf': 'E2B (2B 4-bit): ~1.5 GB. Recommended for 4GB - 6GB VRAM. Fastest dialogue.',
  'gemma4-e4b.gguf': 'E4B (4B 4-bit): ~3.0 GB. Recommended for 8GB VRAM. Best balance of speed & logic.',
  'gemma2-9b.gguf': 'Gemma 2 9B: ~5.5 GB. Recommended for 12GB+ VRAM. Excellent coherence and depth.'
};

async function safeInvoke<T>(cmd: string, args?: any): Promise<T | null> {
  try {
    if (typeof window !== 'undefined' && ((window as any).__tauri___currentWindow || (window as any).__TAURI_INTERNALS__)) {
      return await invoke<T>(cmd, args);
    }
  } catch (e) {
    console.warn(`Tauri command '${cmd}' not available in browser mode:`, e);
  }
  return null;
}

export function initSettingsModal(): void {
  const modal = document.getElementById('settings-modal') as HTMLDialogElement | null;
  const verbositySelect = document.getElementById('setting-verbosity') as HTMLSelectElement | null;
  
  const providerSelect = document.getElementById('setting-llm-provider') as HTMLSelectElement | null;
  const sidecarSection = document.getElementById('llm-sidecar-settings') as HTMLDivElement | null;
  const externalSection = document.getElementById('llm-external-settings') as HTMLDivElement | null;
  
  const modelSelect = document.getElementById('setting-llm-model') as HTMLSelectElement | null;
  const modelInfoDiv = document.getElementById('model-recommendation-info') as HTMLDivElement | null;
  const swapModelBtn = document.getElementById('btn-swap-model') as HTMLButtonElement | null;
  
  const llmEndpointInput = document.getElementById('setting-llm-endpoint') as HTMLInputElement | null;
  const testLlmBtn = document.getElementById('btn-test-llm') as HTMLButtonElement | null;
  const llmStatus = document.getElementById('llm-status');

  // Load initial settings values
  if (verbositySelect) {
    verbositySelect.addEventListener('change', () => {
      const val = verbositySelect.value.toUpperCase() as VerbosityLevel;
      verbosityController.setLevel(val);
    });
  }

  // Load provider preference
  const currentProvider = koboldClient.getProvider();
  if (providerSelect) {
    providerSelect.value = currentProvider;
    providerSelect.addEventListener('change', () => {
      const prov = providerSelect.value as 'sidecar' | 'external';
      koboldClient.setProvider(prov);
      updateProviderUiVisibility(prov);
      triggerHealthCheck();
    });
  }

  function updateProviderUiVisibility(prov: 'sidecar' | 'external') {
    if (sidecarSection && externalSection) {
      if (prov === 'sidecar') {
        sidecarSection.style.display = 'block';
        externalSection.style.display = 'none';
      } else {
        sidecarSection.style.display = 'none';
        externalSection.style.display = 'block';
      }
    }
  }
  updateProviderUiVisibility(currentProvider);

  // Load external endpoint preference
  if (llmEndpointInput) {
    llmEndpointInput.value = koboldClient.getEndpoint();
    llmEndpointInput.addEventListener('change', () => {
      const endpoint = llmEndpointInput.value.trim();
      koboldClient.setEndpoint(endpoint);
      triggerHealthCheck();
    });
  }

  // Health check state and logic
  const updateStatusText = (connected: boolean) => {
    if (llmStatus) {
      if (connected) {
        llmStatus.textContent = 'Connected (Online)';
        llmStatus.className = 'settings-field__status settings-field__status--connected';
      } else {
        llmStatus.textContent = 'Disconnected (Offline)';
        llmStatus.className = 'settings-field__status settings-field__status--disconnected';
      }
    }
  };

  const triggerHealthCheck = async () => {
    const connected = await koboldClient.checkHealth();
    updateStatusText(connected);
    return connected;
  };

  // Sidecar Model Management
  const loadAvailableModels = async () => {
    const models = await safeInvoke<ModelInfo[]>('get_available_models');
    const activeModelName = await safeInvoke<string>('get_current_model') || 'gemma4-e2b.gguf';

    if (modelSelect) {
      modelSelect.innerHTML = '';
      if (models && models.length > 0) {
        models.forEach((m) => {
          const opt = document.createElement('option');
          opt.value = m.name;
          const statusText = m.exists ? 'Downloaded' : 'Missing (Offline fallback)';
          opt.textContent = `${m.display_name} — ${statusText}`;
          opt.selected = m.name === activeModelName;
          modelSelect.appendChild(opt);
        });
      } else {
        const defaultModels = [
          { value: 'gemma4-e2b.gguf', label: 'Gemma E2B (2B 4-bit) — Simulation' },
          { value: 'gemma4-e4b.gguf', label: 'Gemma E4B (4B 4-bit) — Simulation' },
          { value: 'gemma2-9b.gguf', label: 'Gemma 2 9B (9B 4-bit) — Simulation' }
        ];
        defaultModels.forEach((dm) => {
          const opt = document.createElement('option');
          opt.value = dm.value;
          opt.textContent = dm.label;
          opt.selected = dm.value === activeModelName;
          modelSelect.appendChild(opt);
        });
      }
      updateRecommendationText();
    }
  };

  const updateRecommendationText = () => {
    if (modelSelect && modelInfoDiv) {
      const selected = modelSelect.value;
      const rec = MODEL_RECOMMENDATIONS[selected] || 'Select a model to view specs.';
      modelInfoDiv.textContent = rec;
    }
  };

  if (modelSelect) {
    modelSelect.addEventListener('change', updateRecommendationText);
  }

  if (swapModelBtn) {
    swapModelBtn.addEventListener('click', async () => {
      if (!modelSelect) return;
      const selectedModel = modelSelect.value;
      const originalText = swapModelBtn.textContent;
      
      swapModelBtn.disabled = true;
      swapModelBtn.textContent = 'Swapping Model...';
      
      if (llmStatus) {
        llmStatus.textContent = 'Rebooting Server...';
        llmStatus.className = 'settings-field__status settings-field__status--disconnected';
      }

      const result = await safeInvoke<string>('swap_model', { modelName: selectedModel });
      if (result) {
        window.localStorage.setItem('starshipInfernum.activeModel', selectedModel);
      }
      
      let connected = false;
      for (let i = 0; i < 4; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        connected = await triggerHealthCheck();
        if (connected) break;
      }

      swapModelBtn.disabled = false;
      swapModelBtn.textContent = originalText;

      if (connected) {
        alert(`Successfully loaded and swapped to ${selectedModel}!`);
      } else {
        alert(`Request sent to load ${selectedModel}, but server took too long to respond. It may still be loading weights.`);
      }
    });
  }

  // External connection test
  if (testLlmBtn) {
    testLlmBtn.addEventListener('click', async () => {
      const originalText = testLlmBtn.textContent;
      testLlmBtn.disabled = true;
      testLlmBtn.textContent = 'Testing...';
      const connected = await triggerHealthCheck();
      testLlmBtn.disabled = false;
      testLlmBtn.textContent = originalText;
      if (connected) {
        alert('Successfully connected to external KoboldCpp server!');
      } else {
        alert('Failed to connect to external KoboldCpp server. Check endpoint URL.');
      }
    });
  }

  // Trigger initial values
  loadAvailableModels().then(async () => {
    if (koboldClient.getProvider() === 'sidecar') {
      const storedModel = window.localStorage.getItem('starshipInfernum.activeModel');
      const activeModelName = await safeInvoke<string>('get_current_model');
      if (storedModel && activeModelName && storedModel !== activeModelName) {
        console.log(`Restoring active model: ${storedModel}`);
        if (llmStatus) {
          llmStatus.textContent = 'Loading Preferred Model...';
        }
        await safeInvoke<string>('swap_model', { modelName: storedModel });
        triggerHealthCheck();
      }
    }
  });
  triggerHealthCheck();

  // Wires up manual save and load slot buttons in Settings field
  const slots = ['1', '2', '3'];
  for (const slot of slots) {
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
