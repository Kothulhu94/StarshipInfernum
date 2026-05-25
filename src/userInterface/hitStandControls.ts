import { Character, Trait } from '@characterSystem/characterTypes';

/**
 * Dynamically prompts a player to select one of their unexhausted traits to modify their hand total.
 * Each trait row has a +/− toggle. When bustMitigation is true, all toggles default to −.
 * The returned trait has its modifier adjusted to the player's chosen sign.
 * Returns the selected Trait (with adjusted modifier), or null if canceled.
 */
export function promptTraitSelection(
  character: Character,
  options: { bustMitigation?: boolean } = {}
): Promise<Trait | null> {
  const available = character.traits.filter((t) => !t.exhausted && !t.busted);
  if (available.length === 0) return Promise.resolve(null);

  // Track sign choices per trait; bust-mitigation defaults all to '-'
  const signChoices: Record<string, '+' | '-'> = {};
  for (const t of available) {
    signChoices[t.name] = options.bustMitigation ? '-' : (t.modifier >= 0 ? '+' : '-');
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'modal';
  dialog.style.maxWidth = '380px';

  const renderRows = () => {
    const rowsContainer = dialog.querySelector('#trait-rows');
    if (!rowsContainer) return;
    rowsContainer.innerHTML = available.map((t) => {
      const sign = signChoices[t.name];
      const absVal = Math.abs(t.modifier);
      const displayMod = `${sign}${absVal}`;
      const signColor = sign === '+' ? 'var(--color-success-green)' : 'var(--color-damage-red)';
      const signBtnColor = sign === '+' ? 'var(--color-success-green)' : 'var(--color-damage-red)';
      return `
        <div style="display: flex; align-items: center; gap: var(--space-xs); margin-bottom: var(--space-xs);">
          <button
            class="settings-button btn-select-trait"
            data-name="${t.name}"
            style="flex: 1; text-align: left; display: flex; justify-content: space-between;"
          >
            <span>${t.name}</span>
            <span style="color: ${signColor}; font-family: var(--font-mono); font-weight: bold; margin-left: var(--space-sm);">
              ${displayMod}
            </span>
          </button>
          <button
            class="btn-toggle-sign"
            data-name="${t.name}"
            title="Toggle positive / negative"
            style="
              min-width: 36px; height: 36px; border-radius: 6px; border: 2px solid ${signBtnColor};
              background: transparent; color: ${signBtnColor}; font-size: 18px; font-weight: bold;
              cursor: pointer; display: flex; align-items: center; justify-content: center;
              flex-shrink: 0; transition: all 0.15s ease;
            "
          >${sign}</button>
        </div>
      `;
    }).join('');

    // Re-bind toggle buttons
    rowsContainer.querySelectorAll('.btn-toggle-sign').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const name = (e.currentTarget as HTMLElement).getAttribute('data-name')!;
        signChoices[name] = signChoices[name] === '+' ? '-' : '+';
        renderRows();
      });
    });

    // Re-bind select buttons
    rowsContainer.querySelectorAll('.btn-select-trait').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const name = (e.currentTarget as HTMLElement).getAttribute('data-name')!;
        const trait = available.find((t) => t.name === name) || null;
        if (trait) {
          const sign = signChoices[trait.name];
          trait.modifier = Math.abs(trait.modifier) * (sign === '+' ? 1 : -1);
        }
        cleanup();
        resolve(trait);
      });
    });
  };

  const title = options.bustMitigation
    ? '⚠️ Bust — Use Trait to Reduce Total'
    : 'Use Trait';
  const subtitle = options.bustMitigation
    ? '<p style="font-size: 11px; color: var(--color-damage-red); margin: -6px 0 var(--space-sm);">Signs default to − to lower your total. Toggle with the button to switch.</p>'
    : '<p style="font-size: 11px; color: var(--color-text-muted); margin: -6px 0 var(--space-sm);">Toggle +/− to choose how the trait affects your total.</p>';

  dialog.innerHTML = `
    <h3 class="modal__title" style="margin-bottom: var(--space-sm); font-size: var(--font-size-md);">${title}</h3>
    ${subtitle}
    <div id="trait-rows" style="display: flex; flex-direction: column;"></div>
    <button id="btn-cancel-trait" class="menu-button" style="margin-top: var(--space-sm); width: 100%;">Cancel</button>
  `;

  document.body.appendChild(dialog);
  dialog.showModal();

  let resolve!: (t: Trait | null) => void;
  const promise = new Promise<Trait | null>((res) => { resolve = res; });

  const cleanup = () => {
    dialog.close();
    dialog.remove();
  };

  renderRows();

  dialog.querySelector('#btn-cancel-trait')?.addEventListener('click', () => {
    cleanup();
    resolve(null);
  });

  dialog.addEventListener('cancel', () => {
    cleanup();
    resolve(null);
  });

  return promise;
}


/**
 * Prompts a player to select one of their non-busted traits to permanently bust (damage).
 * No cancel button is provided. Returns the selected Trait.
 */
export function promptBustedTraitSelection(character: Character): Promise<Trait | null> {
  const available = character.traits.filter((t) => !t.busted);
  if (available.length === 0) return Promise.resolve(null);
  if (available.length === 1) return Promise.resolve(available[0]);
  if (character.isAI) {
    return Promise.resolve(available[0]);
  }

  // Create temporary modal dialog
  const dialog = document.createElement('dialog');
  dialog.className = 'modal';
  dialog.style.maxWidth = '360px';

  const optionsHtml = available
    .map(
      (t) => `
    <button class="settings-button btn-select-busted-trait" data-name="${t.name}" style="width: 100%; text-align: left; display: flex; justify-content: space-between; margin-bottom: var(--space-xs);">
      <span>${t.name}</span>
      <span style="color: var(--color-damage-red); font-family: var(--font-mono); font-weight: bold;">
        ${t.modifier > 0 ? '+' : ''}${t.modifier}
      </span>
    </button>
  `
    )
    .join('');

  dialog.innerHTML = `
    <h3 class="modal__title" style="margin-bottom: var(--space-md); font-size: var(--font-size-md); color: var(--color-damage-red);">Select Trait to BUST (Lose permanently)</h3>
    <div style="display: flex; flex-direction: column;">
      ${optionsHtml}
    </div>
  `;

  document.body.appendChild(dialog);
  dialog.showModal();

  return new Promise((resolve) => {
    const cleanup = () => {
      dialog.close();
      dialog.remove();
    };

    dialog.querySelectorAll('.btn-select-busted-trait').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const name = (e.currentTarget as HTMLElement).getAttribute('data-name');
        const trait = available.find((t) => t.name === name) || null;
        cleanup();
        resolve(trait);
      });
    });

    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
    });
  });
}
