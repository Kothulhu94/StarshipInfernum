import { showScreen } from '../starshipInfernum';
import { SCENARIO_REGISTRY } from '@scenarioData/scenarioRegistry';
import { ScenarioConfig } from '@scenarioData/scenarioTypes';
import { saveLoadManager } from '@gameFlow/saveLoadManager';
import { gameEventBus } from '@gameFlow/gameEventBus';

let selectedScenario: ScenarioConfig | null = null;

export function getSelectedScenario(): ScenarioConfig | null {
  return selectedScenario;
}

function setSelectedScenario(scenario: ScenarioConfig): void {
  document.querySelectorAll('.scenario-card').forEach((card) => {
    card.classList.remove('scenario-card--selected');
  });
  document.getElementById(`scenario-card-${scenario.id}`)?.classList.add('scenario-card--selected');
  selectedScenario = scenario;
}

function updateContinueButton(scenario: ScenarioConfig): void {
  const continueBtn = document.getElementById(`btn-continue-${scenario.id}`) as HTMLButtonElement | null;
  if (!continueBtn) return;

  const hasSave = saveLoadManager.hasScenarioAutosave(scenario.id);
  continueBtn.disabled = !hasSave;
  continueBtn.title = hasSave ? `Continue ${scenario.name}` : 'No saved campaign for this scenario';
}

export function refreshScenarioContinueButtons(): void {
  for (const scenario of SCENARIO_REGISTRY) {
    updateContinueButton(scenario);
  }
}

export function initScenarioSelectionPanel(onScenarioSelected: (scenario: ScenarioConfig) => void): void {
  const listContainer = document.getElementById('scenario-list');
  const backBtn = document.getElementById('btn-scenario-back');

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      showScreen('title-screen');
    });
  }

  if (!listContainer) return;

  listContainer.innerHTML = '';

  for (const scenario of SCENARIO_REGISTRY) {
    const card = document.createElement('div');
    card.className = 'scenario-card';
    card.id = `scenario-card-${scenario.id}`;

    card.innerHTML = `
      <div class="scenario-card__name">${scenario.name}</div>
      <div class="scenario-card__backstory">${scenario.backstory}</div>
      <div class="scenario-card__meta">
        <span>Year: ${scenario.year}</span>
        <span>Ship: ${scenario.shipName}</span>
      </div>
      <div class="scenario-card__actions">
        <button id="btn-new-${scenario.id}" type="button" class="menu-button menu-button--primary">New Game</button>
        <button id="btn-continue-${scenario.id}" type="button" class="menu-button">Continue</button>
      </div>
    `;

    card.querySelector(`#btn-new-${scenario.id}`)?.addEventListener('click', () => {
      setSelectedScenario(scenario);
      saveLoadManager.clearScenarioAutosave(scenario.id);
      refreshScenarioContinueButtons();
      onScenarioSelected(scenario);
      showScreen('character-creation-screen');
    });

    card.querySelector(`#btn-continue-${scenario.id}`)?.addEventListener('click', () => {
      setSelectedScenario(scenario);
      if (saveLoadManager.loadScenarioAutosave(scenario.id)) {
        showScreen('game-screen');
      } else {
        refreshScenarioContinueButtons();
      }
    });

    listContainer.appendChild(card);
    updateContinueButton(scenario);
  }

  gameEventBus.on('game_over', () => refreshScenarioContinueButtons());
}
