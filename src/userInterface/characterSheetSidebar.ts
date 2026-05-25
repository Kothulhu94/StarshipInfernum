import { gameEventBus } from '@gameFlow/gameEventBus';
import { GameState } from '@gameFlow/gameFlowTypes';
import { escapeHtml, getAptitudeTooltipText, getTraitTooltipText } from '@characterSystem/traitRegistry';

export function initCharacterSheetSidebar(): void {
  // Listen to game state updates to refresh roster
  gameEventBus.on('state_updated', (state: GameState) => {
    renderCrewRoster(state);
  });
}

function renderCrewRoster(state: GameState): void {
  const rosterContainer = document.getElementById('crew-roster');
  if (!rosterContainer) return;

  rosterContainer.innerHTML = '';

  for (const char of state.characters) {
    const card = document.createElement('div');
    const isActive = char.id === state.activeCharacterId;
    
    card.className = `character-card 
      ${isActive ? 'character-card--active' : ''} 
      ${char.isDead ? 'character-card--dead' : ''}
    `;

    // Render Traits HTML
    const traitsHtml = char.traits
      .map((t) => {
        let statusClass = '';
        if (t.busted) statusClass = 'trait-item--busted';
        else if (t.exhausted) statusClass = 'trait-item--exhausted';

        const tooltip = getTraitTooltipText(t.name, t.modifier);

        return `
        <div class="trait-item ${statusClass}" data-tooltip="${escapeHtml(tooltip)}">
          <span class="trait-item__name">${t.name}</span>
          <span class="trait-item__val">±${Math.abs(t.modifier)}</span>
        </div>
      `;
      })
      .join('');

    // Ghost status vs gear status
    let metaHtml = '';
    const aptitudeTooltip = getAptitudeTooltipText(char.aptitude);

    if (char.isDead) {
      const pocketStr = char.ghostCard 
        ? `Held: ${char.ghostCard.rank}${char.ghostCard.suit[0]}` 
        : 'No card';
      metaHtml = `
        <div class="character-card__ghost-overlay">GHOST</div>
        <div class="character-card__meta">
          <span class="badge badge--aptitude" data-tooltip="${escapeHtml(aptitudeTooltip)}">${char.aptitude}</span>
          <span class="badge" style="color: var(--color-ghost-violet); background: rgba(147, 112, 219, 0.1); border: 1px solid var(--color-ghost-violet-dim);">${pocketStr}</span>
        </div>
      `;
    } else {
      const gearBadge = char.gear 
        ? `<span class="badge badge--gear">${char.gear.replace('_', ' ')}</span>`
        : '';
      metaHtml = `
        <div class="character-card__meta">
          <span class="badge badge--aptitude" data-tooltip="${escapeHtml(aptitudeTooltip)}">${char.aptitude}</span>
          ${gearBadge}
        </div>
      `;
    }

    card.innerHTML = `
      <div>
        <div class="character-card__name">${char.name} ${char.isAI ? '(AI)' : ''}</div>
        <div class="character-card__concept">${char.concept}</div>
      </div>
      <div class="character-card__traits">
        ${traitsHtml}
      </div>
      ${metaHtml}
    `;

    rosterContainer.appendChild(card);
  }
}
