import { Character, Trait } from '@characterSystem/characterTypes';

/**
 * Dynamically prompts a player to select one of their unexhausted traits to modify their hand total.
 * Returns the selected Trait, or null if canceled.
 */
export function promptTraitSelection(character: Character): Promise<Trait | null> {
  const available = character.traits.filter((t) => !t.exhausted && !t.busted);
  if (available.length === 0) return Promise.resolve(null);

  // Create temporary modal dialog
  const dialog = document.createElement('dialog');
  dialog.className = 'modal';
  dialog.style.maxWidth = '360px';

  let optionsHtml = available
    .map(
      (t) => `
    <button class="settings-button btn-select-trait" data-name="${t.name}" style="width: 100%; text-align: left; display: flex; justify-content: space-between; margin-bottom: var(--space-xs);">
      <span>${t.name}</span>
      <span style="color: var(--color-alert-amber); font-family: var(--font-mono); font-weight: bold;">
        ${t.modifier > 0 ? '+' : ''}${t.modifier}
      </span>
    </button>
  `
    )
    .join('');

  dialog.innerHTML = `
    <h3 class="modal__title" style="margin-bottom: var(--space-md); font-size: var(--font-size-md);">Select Trait</h3>
    <div style="display: flex; flex-direction: column;">
      ${optionsHtml}
      <button id="btn-cancel-trait" class="menu-button" style="margin-top: var(--space-sm); width: 100%;">Cancel</button>
    </div>
  `;

  document.body.appendChild(dialog);
  dialog.showModal();

  return new Promise((resolve) => {
    const cleanup = () => {
      dialog.close();
      dialog.remove();
    };

    dialog.querySelectorAll('.btn-select-trait').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const name = (e.currentTarget as HTMLElement).getAttribute('data-name');
        const trait = available.find((t) => t.name === name) || null;
        cleanup();
        resolve(trait);
      });
    });

    const cancelBtn = dialog.querySelector('#btn-cancel-trait');
    cancelBtn?.addEventListener('click', () => {
      cleanup();
      resolve(null);
    });

    dialog.addEventListener('cancel', () => {
      cleanup();
      resolve(null);
    });
  });
}
