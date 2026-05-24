import { gameEventBus } from '@gameFlow/gameEventBus';
import { GameState } from '@gameFlow/gameFlowTypes';

export function initCrisisClockDisplay(): void {
  // Listen for clock updates
  gameEventBus.on('state_updated', (state: GameState) => {
    updateCrisisDisplay(state);
  });
}

function updateCrisisDisplay(state: GameState): void {
  const clockContainer = document.getElementById('clock-tokens');
  const reelCounter = document.getElementById('reel-counter');
  
  const majorName = document.getElementById('major-crisis-name');
  const majorJokers = document.getElementById('major-crisis-jokers');
  const majorSlot = document.getElementById('major-crisis-slot');

  const minorName = document.getElementById('minor-crisis-name');
  const minorJokers = document.getElementById('minor-crisis-jokers');
  const minorSlot = document.getElementById('minor-crisis-slot');

  if (clockContainer) {
    clockContainer.innerHTML = '';
    const total = state.crisisClockTokensTotal;
    const remaining = state.crisisClockTokensRemaining;

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
    if (majorJokers) {
      majorJokers.textContent = state.majorCrisisState.isResolved
        ? 'Resolved'
        : `Jokers: ${state.majorCrisisState.jokersRemaining}`;
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
    if (minorJokers) {
      minorJokers.textContent = state.minorCrisisState.isResolved
        ? 'Resolved'
        : `Jokers: ${state.minorCrisisState.jokersRemaining}`;
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
