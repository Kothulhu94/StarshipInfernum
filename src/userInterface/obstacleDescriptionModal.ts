import { ObstacleDefinition } from '../encounterSystem/encounterTypes';

/**
 * Displays a modal describing the current room's active obstacle.
 * Resolves the returned promise once the player acknowledges the pop-up.
 */
export function showObstacleDescriptionModal(obstacle: ObstacleDefinition): Promise<void> {
  const modal = document.getElementById('obstacle-description-modal') as HTMLDialogElement | null;
  const titleEl = document.getElementById('obstacle-modal-title');
  const badgeEl = document.getElementById('obstacle-modal-badge');
  const flavorEl = document.getElementById('obstacle-modal-flavor');
  const rulesEl = document.getElementById('obstacle-modal-rules-text');
  const encounterBtn = document.getElementById('btn-obstacle-encounter') as HTMLButtonElement | null;

  if (!modal) {
    return Promise.resolve();
  }

  if (titleEl) {
    titleEl.textContent = obstacle.name;
  }
  if (flavorEl) {
    flavorEl.textContent = obstacle.flavorText;
  }
  if (rulesEl) {
    rulesEl.textContent = obstacle.rulesText;
  }

  if (badgeEl) {
    badgeEl.textContent = `${obstacle.type} OBSTACLE`;
    
    // Customize badge style based on type
    badgeEl.className = 'card-table__badge'; // Reset classes
    badgeEl.style.border = '1px solid';
    
    if (obstacle.type === 'ADVERSARY') {
      badgeEl.style.color = 'var(--color-damage-red)';
      badgeEl.style.background = 'hsla(0, 85%, 60%, 0.15)';
      badgeEl.style.borderColor = 'var(--color-damage-red-dim)';
    } else if (obstacle.type === 'GROUP') {
      badgeEl.style.color = 'var(--color-console-cyan)';
      badgeEl.style.background = 'hsla(180, 70%, 50%, 0.15)';
      badgeEl.style.borderColor = 'var(--color-console-cyan-dim)';
    } else if (obstacle.type === 'PERSONAL') {
      badgeEl.style.color = 'var(--color-ghost-violet)';
      badgeEl.style.background = 'hsla(270, 60%, 65%, 0.15)';
      badgeEl.style.borderColor = 'hsla(270, 60%, 65%, 0.3)';
    } else {
      // PERSISTENT
      badgeEl.style.color = 'var(--color-alert-amber)';
      badgeEl.style.background = 'var(--color-alert-amber-dim)';
      badgeEl.style.borderColor = 'var(--color-alert-amber-dim)';
    }
  }

  modal.showModal();

  return new Promise<void>((resolve) => {
    const cleanup = () => {
      modal.close();
      if (encounterBtn) {
        // Clean up event listener by replacing the element
        encounterBtn.replaceWith(encounterBtn.cloneNode(true));
      }
    };

    // Re-query the button after potential clone in cleanup
    const getEncounterBtn = () => document.getElementById('btn-obstacle-encounter');

    getEncounterBtn()?.addEventListener('click', () => {
      cleanup();
      resolve();
    }, { once: true });

    modal.addEventListener('cancel', (e) => {
      e.preventDefault(); // Prevent closing via ESC to force button click (acknowledgement)
    });
  });
}
