import { showScreen } from '../starshipInfernum';
import { SCENARIO_REGISTRY } from '@scenarioData/scenarioRegistry';
import { ScenarioConfig } from '@scenarioData/scenarioTypes';

let selectedScenario: ScenarioConfig | null = null;

export function getSelectedScenario(): ScenarioConfig | null {
  return selectedScenario;
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
    `;

    card.addEventListener('click', () => {
      // Remove selected class from others
      document.querySelectorAll('.scenario-card').forEach((c) => {
        c.classList.remove('scenario-card--selected');
      });
      card.classList.add('scenario-card--selected');

      selectedScenario = scenario;
      onScenarioSelected(scenario);
      showScreen('character-creation-screen');
    });

    listContainer.appendChild(card);
  }
}
