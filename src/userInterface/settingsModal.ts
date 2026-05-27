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

async function safeInvoke<T>(cmd: string, args?: any): Promise<T> {
  if (typeof window !== 'undefined' && ((window as any).__tauri___currentWindow || (window as any).__TAURI_INTERNALS__)) {
    return await invoke<T>(cmd, args);
  }
  throw new Error(`Browser simulation: Tauri command '${cmd}' is disabled.`);
}

export function initSettingsModal(): void {
  const modal = document.getElementById('settings-modal') as HTMLDialogElement | null;
  const closeSettingsBtn = document.getElementById('btn-close-settings') as HTMLButtonElement | null;
  const verbositySelect = document.getElementById('setting-verbosity') as HTMLSelectElement | null;
  
  const providerSelect = document.getElementById('setting-llm-provider') as HTMLSelectElement | null;
  const sidecarSection = document.getElementById('llm-sidecar-settings') as HTMLDivElement | null;
  const externalSection = document.getElementById('llm-external-settings') as HTMLDivElement | null;
  
  const modelSelect = document.getElementById('setting-llm-model') as HTMLSelectElement | null;
  const modelInfoDiv = document.getElementById('model-recommendation-info') as HTMLDivElement | null;
  const swapModelBtn = document.getElementById('btn-swap-model') as HTMLButtonElement | null;
  const toggleServerBtn = document.getElementById('btn-toggle-server') as HTMLButtonElement | null;
  
  const llmEndpointInput = document.getElementById('setting-llm-endpoint') as HTMLInputElement | null;
  const testLlmBtn = document.getElementById('btn-test-llm') as HTMLButtonElement | null;
  const llmStatus = document.getElementById('llm-status');

  const closeSettingsModal = () => {
    if (modal?.open) {
      modal.close();
    }
  };

  if (closeSettingsBtn) {
    closeSettingsBtn.addEventListener('click', closeSettingsModal);
  }

  if (modal) {
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modal.open) {
        event.preventDefault();
        closeSettingsModal();
      }
    }, true);

    modal.addEventListener('cancel', (event) => {
      event.preventDefault();
      closeSettingsModal();
    });

    modal.addEventListener('click', (event) => {
      if (event.target !== modal) return;
      const rect = modal.getBoundingClientRect();
      const clickedInsideDialog =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      if (!clickedInsideDialog) {
        closeSettingsModal();
      }
    });
  }

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
    updateServerBtnState();
  };

  const triggerHealthCheck = async () => {
    const connected = await koboldClient.checkHealth();
    updateStatusText(connected);
    return connected;
  };

  const updateServerBtnState = async () => {
    if (!toggleServerBtn) return;
    try {
      const isRunning = await safeInvoke<boolean>('is_server_running');
      if (isRunning) {
        toggleServerBtn.textContent = 'Stop Server';
        toggleServerBtn.style.borderColor = 'var(--color-damage-red)';
      } else {
        toggleServerBtn.textContent = 'Launch Server';
        toggleServerBtn.style.borderColor = '';
      }
    } catch {
      toggleServerBtn.textContent = 'Launch Server';
      toggleServerBtn.style.borderColor = '';
    }
  };

  // Sidecar Model Management
  const loadAvailableModels = async () => {
    if (modelSelect) {
      modelSelect.innerHTML = '';
      try {
        const models = await safeInvoke<ModelInfo[]>('get_available_models');
        const activeModelName = await safeInvoke<string>('get_current_model') || 'gemma4-e2b.gguf';

        const downloadedModels = models ? models.filter((m) => m.exists) : [];

        if (downloadedModels.length > 0) {
          downloadedModels.forEach((m) => {
            const opt = document.createElement('option');
            opt.value = m.name;
            opt.textContent = m.display_name;
            opt.selected = m.name === activeModelName;
            modelSelect.appendChild(opt);
          });
          
          modelSelect.disabled = false;
          if (swapModelBtn) swapModelBtn.disabled = false;
          if (toggleServerBtn) toggleServerBtn.disabled = false;
          updateRecommendationText();
        } else {
          // No models on disk
          const opt = document.createElement('option');
          opt.value = '';
          opt.textContent = 'No models detected';
          opt.disabled = true;
          opt.selected = true;
          modelSelect.appendChild(opt);

          modelSelect.disabled = true;
          if (swapModelBtn) swapModelBtn.disabled = true;
          if (toggleServerBtn) toggleServerBtn.disabled = true;

          if (modelInfoDiv) {
            modelInfoDiv.innerHTML = '<span style="color: var(--color-alert-amber);">No GGUF models detected in <code>src-tauri/models/</code>. Please place your Gemma files in the directory to enable local AI narration. Fallback narration will be used.</span>';
          }
        }
      } catch (e) {
        // Browser or fail fallback
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No models detected (Browser Mode)';
        opt.disabled = true;
        opt.selected = true;
        modelSelect.appendChild(opt);

        modelSelect.disabled = true;
        if (swapModelBtn) swapModelBtn.disabled = true;
        if (toggleServerBtn) toggleServerBtn.disabled = true;

        if (modelInfoDiv) {
          modelInfoDiv.innerHTML = '<span style="color: var(--color-alert-amber);">Running in browser mode. Sidecar LLM commands are unavailable. Narration fallback will be used.</span>';
        }
      }
    }
    updateServerBtnState();
  };

  const updateRecommendationText = () => {
    if (modelSelect && modelInfoDiv) {
      const selected = modelSelect.value;
      if (selected) {
        const rec = MODEL_RECOMMENDATIONS[selected] || 'Select a model to view specs.';
        modelInfoDiv.textContent = rec;
      }
    }
  };

  if (modelSelect) {
    modelSelect.addEventListener('change', updateRecommendationText);
  }

  if (swapModelBtn) {
    swapModelBtn.addEventListener('click', async () => {
      if (!modelSelect || !modelSelect.value) return;
      const selectedModel = modelSelect.value;
      const originalText = swapModelBtn.textContent;
      
      swapModelBtn.disabled = true;
      swapModelBtn.textContent = 'Swapping Model...';
      
      if (llmStatus) {
        llmStatus.textContent = 'Rebooting Server...';
        llmStatus.className = 'settings-field__status settings-field__status--disconnected';
      }

      try {
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

        if (connected) {
          alert(`Successfully loaded and swapped to ${selectedModel}!`);
        } else {
          alert(`Request sent to load ${selectedModel}, but server took too long to respond. It may still be loading weights.`);
        }
      } catch (err: any) {
        const errMsg = err.message || String(err);
        alert(`Failed to swap model:\n\n${errMsg}`);
        if (llmStatus) {
          llmStatus.textContent = 'Launch Failed';
          llmStatus.className = 'settings-field__status settings-field__status--disconnected';
        }
      } finally {
        swapModelBtn.disabled = false;
        swapModelBtn.textContent = originalText;
        updateServerBtnState();
      }
    });
  }

  if (toggleServerBtn) {
    toggleServerBtn.addEventListener('click', async () => {
      let isRunning = false;
      try {
        isRunning = await safeInvoke<boolean>('is_server_running');
      } catch {
        isRunning = false;
      }
      
      toggleServerBtn.disabled = true;
      
      try {
        if (isRunning) {
          toggleServerBtn.textContent = 'Stopping...';
          await safeInvoke<void>('stop_server');
          await triggerHealthCheck();
          alert('Server stopped successfully.');
        } else {
          if (!modelSelect || !modelSelect.value) return;
          const selectedModel = modelSelect.value;
          toggleServerBtn.textContent = 'Launching...';
          if (llmStatus) {
            llmStatus.textContent = 'Launching Server...';
            llmStatus.className = 'settings-field__status settings-field__status--disconnected';
          }
          await safeInvoke<string>('swap_model', { modelName: selectedModel });
          
          let connected = false;
          for (let i = 0; i < 4; i++) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            connected = await triggerHealthCheck();
            if (connected) break;
          }

          if (connected) {
            alert('Server launched successfully!');
          } else {
            alert('Server started, but took too long to report healthy. It might still be loading.');
          }
        }
      } catch (err: any) {
        const errMsg = err.message || String(err);
        alert(`Server operation failed:\n\n${errMsg}`);
        if (llmStatus) {
          llmStatus.textContent = 'Launch Failed';
          llmStatus.className = 'settings-field__status settings-field__status--disconnected';
        }
      } finally {
        toggleServerBtn.disabled = false;
        await updateServerBtnState();
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
      try {
        const activeModelName = await safeInvoke<string>('get_current_model');
        if (storedModel && activeModelName && storedModel !== activeModelName) {
          console.log(`Restoring active model: ${storedModel}`);
          if (llmStatus) {
            llmStatus.textContent = 'Loading Preferred Model...';
          }
          await safeInvoke<string>('swap_model', { modelName: storedModel });
          triggerHealthCheck();
        }
      } catch (e) {
        console.warn('Failed to restore active model:', e);
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
