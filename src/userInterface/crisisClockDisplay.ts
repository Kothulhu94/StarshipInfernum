import { gameEventBus } from '@gameFlow/gameEventBus';
import { GameState } from '@gameFlow/gameFlowTypes';
import { showCrisisDescriptionModal } from './crisisDescriptionModal';

// Keep track of the current state so click handlers can access it
let currentState: GameState | null = null;

export function initCrisisClockDisplay(): void {
  // Listen for clock updates
  gameEventBus.on('state_updated', (state: GameState) => {
    currentState = state;
    updateCrisisDisplay(state);
  });

  // Setup click listeners for crisis cards
  const majorSlot = document.getElementById('major-crisis-slot');
  const minorSlot = document.getElementById('minor-crisis-slot');

  if (majorSlot) {
    majorSlot.addEventListener('click', () => {
      if (currentState?.majorCrisisState) {
        showCrisisDescriptionModal(currentState.majorCrisisState.id, 'MAJOR');
      }
    });
  }

  if (minorSlot) {
    minorSlot.addEventListener('click', () => {
      if (currentState?.minorCrisisState) {
        showCrisisDescriptionModal(currentState.minorCrisisState.id, 'MINOR');
      }
    });
  }
}

function updateCrisisDisplay(state: GameState): void {
  const clockContainer = document.getElementById('clock-tokens');
  const reelCounter = document.getElementById('reel-counter');
  
  const majorName = document.getElementById('major-crisis-name');
  const majorSteps = document.getElementById('major-crisis-jokers');
  const majorSlot = document.getElementById('major-crisis-slot');

  const minorName = document.getElementById('minor-crisis-name');
  const minorSteps = document.getElementById('minor-crisis-jokers');
  const minorSlot = document.getElementById('minor-crisis-slot');

  if (clockContainer) {
    clockContainer.innerHTML = '';
    const total = state.crisisClockTokensTotal;
    const remaining = state.crisisClockTokensRemaining;

    const countdown = document.getElementById('crisis-clock-countdown');
    if (countdown) {
      countdown.textContent = `${remaining} / ${total} Tokens`;
    }
    
    const survivalCountdown = document.getElementById('survival-deck-countdown');
    if (survivalCountdown) {
      survivalCountdown.textContent = `${state.survivalDeckCards.length} cards`;
    }

    for (let i = 0; i < total; i++) {
      const token = document.createElement('div');
      const isSpent = i >= remaining;
      
      token.className = 'crisis-token';
      if (isSpent) {
        token.classList.add('crisis-token--spent');
      } else if (remaining === 1) {
        token.classList.add('crisis-token--low'); // Red alarm pulse on last token
      }
      
      clockContainer.appendChild(token);
    }
  }

  if (reelCounter) {
    const reel = state.crisisClockTokensTotal - state.crisisClockTokensRemaining + 1;
    reelCounter.textContent = `Reel ${reel}`;
  }

  // Update Major Crisis
  if (state.majorCrisisState) {
    if (majorName) {
      majorName.textContent = state.majorCrisisState.id.replace('_', ' ');
    }
    if (majorSteps) {
      majorSteps.textContent = state.majorCrisisState.isResolved
        ? 'Resolved'
        : `Steps to Resolve: ${state.majorCrisisState.jokersRemaining}`;
    }
    if (majorSlot) {
      if (state.majorCrisisState.isResolved) {
        majorSlot.classList.add('crisis-card--resolved');
      } else {
        majorSlot.classList.remove('crisis-card--resolved');
      }
    }
  }

  // Update Minor Crisis
  if (state.minorCrisisState) {
    if (minorName) {
      minorName.textContent = state.minorCrisisState.id.replace('_', ' ');
    }
    if (minorSteps) {
      minorSteps.textContent = state.minorCrisisState.isResolved
        ? 'Resolved'
        : `Steps to Resolve: ${state.minorCrisisState.jokersRemaining}`;
    }
    if (minorSlot) {
      if (state.minorCrisisState.isResolved) {
        minorSlot.classList.add('crisis-card--resolved');
      } else {
        minorSlot.classList.remove('crisis-card--resolved');
      }
    }
  }
}
