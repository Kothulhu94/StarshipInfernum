import { MajorCrisisType, MinorCrisisType } from '@crisisSystem/crisisTypes';
import { MAJOR_CRISIS_REGISTRY } from '@crisisSystem/majorCrisisRegistry';
import { MINOR_CRISIS_REGISTRY } from '@crisisSystem/minorCrisisRegistry';

export function showCrisisDescriptionModal(crisisId: string, type: 'MAJOR' | 'MINOR'): Promise<void> {
  const modal = document.getElementById('crisis-description-modal') as HTMLDialogElement | null;
  const titleEl = document.getElementById('crisis-modal-title');
  const badgeEl = document.getElementById('crisis-modal-badge');
  const descEl = document.getElementById('crisis-modal-desc');
  const roomsEl = document.getElementById('crisis-modal-rooms');
  const effectEl = document.getElementById('crisis-modal-effect');
  const closeBtn = document.getElementById('btn-crisis-close') as HTMLButtonElement | null;

  if (!modal) {
    return Promise.resolve();
  }

  let name = '';
  let description = '';
  let resolutionRooms: string[] = [];
  let effect = '';

  if (type === 'MAJOR') {
    const crisis = MAJOR_CRISIS_REGISTRY[crisisId as MajorCrisisType];
    if (crisis) {
      name = crisis.name;
      description = crisis.description;
      resolutionRooms = crisis.resolutionRooms;
      effect = crisis.disasterEffect;
      if (badgeEl) {
        badgeEl.textContent = 'MAJOR CRISIS';
        badgeEl.style.color = 'var(--color-damage-red)';
        badgeEl.style.background = 'hsla(0, 85%, 60%, 0.15)';
        badgeEl.style.border = '1px solid var(--color-damage-red-dim)';
      }
    }
  } else {
    const crisis = MINOR_CRISIS_REGISTRY[crisisId as MinorCrisisType];
    if (crisis) {
      name = crisis.name;
      description = crisis.description;
      resolutionRooms = crisis.resolutionRooms;
      effect = crisis.rulesModifier;
      if (badgeEl) {
        badgeEl.textContent = 'MINOR CRISIS';
        badgeEl.style.color = 'var(--color-alert-amber)';
        badgeEl.style.background = 'var(--color-alert-amber-dim)';
        badgeEl.style.border = '1px solid var(--color-alert-amber-dim)';
      }
    }
  }

  if (titleEl) titleEl.textContent = name;
  if (descEl) descEl.textContent = description;
  if (roomsEl) roomsEl.textContent = resolutionRooms.join(', ');
  if (effectEl) effectEl.textContent = effect;

  modal.showModal();

  return new Promise<void>((resolve) => {
    const cleanup = () => {
      modal.close();
      if (closeBtn) {
        closeBtn.replaceWith(closeBtn.cloneNode(true));
      }
    };

    const getCloseBtn = () => document.getElementById('btn-crisis-close');

    getCloseBtn()?.addEventListener('click', () => {
      cleanup();
      resolve();
    }, { once: true });

    modal.addEventListener('cancel', (e) => {
      e.preventDefault(); 
      cleanup();
      resolve();
    }, { once: true });
  });
}
