import { Card, Suit } from '@cardEngine/cardDefinitions';
import { Character, Trait } from '@characterSystem/characterTypes';
import { TestUI, TestResult } from '@encounterSystem/encounterTypes';
import { evaluateHand } from '@cardEngine/handEvaluator';
import { getNPCDecision } from '@gameFlow/npcDecisionEngine';
import { executeShapeshifterSwap, executeSmugglerSwap } from '@characterSystem/aptitudeExecutor';
import { getPlayerActionAvailability, PlayerAction, PlayerActionPromptContext } from '@characterSystem/playerActionModel';
import { showGhostFlashbackModal } from './ghostFlashbackModal';
import { gameStateStore } from '@gameFlow/gameStateStore';
import { gameEventBus } from '@gameFlow/gameEventBus';

import { promptTraitSelection, promptBustedTraitSelection } from './hitStandControls';

const PLAYER_CARD_COLORS = ['#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c', '#e84393', '#00cec9', '#fdcb6e'];

// Local cache of dealer hand for decision context
let currentDealerHand: Card[] = [];
let currentPlayerHands: Map<string, Card[]> = new Map();
let currentTension = 0;
let hasUsedShapeshifterSwap = false;
let hasUsedSmugglerSwap = false;

export class CardTableOverlay implements TestUI {
  private playerColorMap = new Map<string, string>();
  private availableColors = [...PLAYER_CARD_COLORS];

  constructor() {
    gameEventBus.on('game_reset', () => this.reset());
    gameEventBus.on('game_over', () => this.reset());
  }

  private replaceInteractiveButton(id: string): void {
    const button = document.getElementById(id);
    button?.replaceWith(button.cloneNode(true));
  }

  public reset(): void {
    currentDealerHand = [];
    currentPlayerHands = new Map();
    currentTension = 0;
    hasUsedShapeshifterSwap = false;
    hasUsedSmugglerSwap = false;
    this.playerColorMap.clear();
    this.availableColors = [...PLAYER_CARD_COLORS];

    document.getElementById('card-table-overlay')?.setAttribute('hidden', '');
    document.getElementById('card-table-result')?.setAttribute('hidden', '');
    document.getElementById('rising-tension-indicator')?.setAttribute('hidden', '');

    const controls = document.getElementById('card-table-controls');
    if (controls) controls.style.display = 'none';

    const textIds = ['dealer-total', 'card-table-result-text', 'tension-level'];
    for (const id of textIds) {
      const element = document.getElementById(id);
      if (element) element.textContent = '';
    }

    document.getElementById('dealer-hand')?.replaceChildren();
    document.getElementById('player-hands-container')?.replaceChildren();

    [
      'btn-hit',
      'btn-stand',
      'btn-use-trait',
      'btn-use-aptitude',
      'btn-shapeshifter-swap',
      'btn-smuggler-swap',
      'btn-weapon-redraw',
      'btn-card-table-continue',
    ].forEach((id) => this.replaceInteractiveButton(id));
  }

  private getPlayerColor(playerId: string, isPlayerOne: boolean): string {
    if (this.playerColorMap.has(playerId)) {
      return this.playerColorMap.get(playerId)!;
    }

    if (isPlayerOne) {
      const blue = '#3498db'; // blue
      this.playerColorMap.set(playerId, blue);
      return blue;
    }

    // Pick random color
    if (this.availableColors.length === 0) {
      return '#ffffff';
    }
    const index = Math.floor(Math.random() * this.availableColors.length);
    const color = this.availableColors.splice(index, 1)[0];
    this.playerColorMap.set(playerId, color);
    return color;
  }

  /**
   * Helper to create card DOM elements.
   */
  private createCardElement(card: Card, color: string): HTMLElement {
    const el = document.createElement('div');
    
    el.className = 'simple-card-value';
    
    el.style.backgroundColor = color;
    el.style.color = card.isJoker ? 'var(--color-alert-amber)' : '#ffffff';
    el.style.textShadow = '0 1px 3px rgba(0,0,0,0.8)';
    el.style.setProperty('--card-color', color);

    if (!card.faceUp) {
      el.classList.add('simple-card-value--face-down');
    }
    
    const getNumericRank = (rank: string) => {
      if (rank === 'A') return '1';
      if (rank === 'J') return '11';
      if (rank === 'Q') return '12';
      if (rank === 'K') return '13';
      return rank;
    };
    
    el.textContent = card.faceUp ? (card.isJoker ? 'JK' : getNumericRank(String(card.rank))) : '?';
    
    return el;
  }

  /**
   * Renders the cards for a hand into a container.
   */
  private renderHand(container: HTMLElement, cards: Card[], color: string): void {
    container.innerHTML = '';
    for (const card of cards) {
      container.appendChild(this.createCardElement(card, color));
    }
  }

  private getOrCreateActionButton(
    controls: HTMLElement,
    id: string,
    label: string,
    title: string,
    modifierClass: string
  ): HTMLButtonElement {
    const existing = document.getElementById(id) as HTMLButtonElement | null;
    if (existing) {
      existing.textContent = label;
      existing.title = title;
      return existing;
    }

    const button = document.createElement('button');
    button.id = id;
    button.className = `action-button ${modifierClass}`;
    button.title = title;
    button.textContent = label;
    controls.appendChild(button);
    return button;
  }

  /**
   * Renders the Blackjack table state.
   */
  public async showRound(
    playerHands: Map<string, Card[]>,
    dealerHand: Card[],
    tension: number
  ): Promise<void> {
    currentDealerHand = dealerHand;
    currentPlayerHands = playerHands;
    currentTension = tension;

    const overlay = document.getElementById('card-table-overlay');
    if (!overlay) return;

    overlay.removeAttribute('hidden');
    document.getElementById('card-table-result')?.setAttribute('hidden', '');

    // Render Dealer area
    const dealerHandEl = document.getElementById('dealer-hand');
    const dealerTotalEl = document.getElementById('dealer-total');
    if (dealerHandEl) {
      this.renderHand(dealerHandEl, dealerHand, '#e74c3c'); // Dealer is always red
    }
    if (dealerTotalEl) {
      const evalRes = evaluateHand(dealerHand);
      dealerTotalEl.textContent = dealerHand[0]?.faceUp
        ? `Total: ${evalRes.total}${evalRes.isBust ? ' (Bust!)' : ''}`
        : `Total: ?`;
    }

    // Render Tension level
    const tensionIndicator = document.getElementById('rising-tension-indicator');
    const tensionLevel = document.getElementById('tension-level');
    if (tensionIndicator && tensionLevel) {
      if (tension > 0) {
        tensionIndicator.removeAttribute('hidden');
        tensionLevel.textContent = String(tension);
      } else {
        tensionIndicator.setAttribute('hidden', '');
      }
    }

    // Render Players hands
    const playersContainer = document.getElementById('player-hands-container');
    if (playersContainer) {
      playersContainer.innerHTML = '';
      const state = gameStateStore.getState();

      for (const [pId, hand] of playerHands) {
        const player = state.characters.find((c) => c.id === pId);
        if (!player) continue;

        const slot = document.createElement('div');
        slot.className = 'card-table__player-slot';
        slot.id = `card-table-slot-${pId}`;

        const evalRes = evaluateHand(hand);

        slot.innerHTML = `
          <div class="card-table__player-name">${player.name}</div>
          <div class="card-table__hand card-hand-${pId}"></div>
          <span class="card-table__total">${evalRes.total}${evalRes.isBust ? ' (Bust!)' : ''}</span>
        `;

        playersContainer.appendChild(slot);
        const handEl = slot.querySelector(`.card-hand-${pId}`) as HTMLElement;
        if (handEl) {
          const isPlayerOne = (pId === state.characters[0].id);
          const color = this.getPlayerColor(pId, isPlayerOne);
          this.renderHand(handEl, hand, color);
        }
      }
    }

    // Subtle wait to let flip animations play out nicely
    await new Promise((r) => setTimeout(r, 450));
  }

  /**
   * Prompts action (Hit/Stand/Trait) from the active player.
   */
  public async promptPlayerAction(
    character: Character,
    hand: Card[],
    canUseTrait: boolean,
    context: PlayerActionPromptContext = {}
  ): Promise<PlayerAction> {
    const availability = getPlayerActionAvailability(character, hand, canUseTrait, {
      ...context,
      hasUsedShapeshifterSwap,
      hasUsedSmugglerSwap
    });

    // 1. Resolve for AI NPC
    if (character.isAI) {
      await new Promise((r) => setTimeout(r, 900)); // Natural AI thinking delay

      const decision = getNPCDecision(character, {
        playerHand: hand,
        dealerHand: currentDealerHand,
        canUseTrait: availability.canUseTrait,
        hasUsedShapeshifterSwap,
        hasUsedSmugglerSwap,
      });

      if (typeof decision === 'object' && decision.type === 'SHAPESHIFTER_SWAP') {
        executeShapeshifterSwap(hand, currentDealerHand);
        hasUsedShapeshifterSwap = true;
        gameStateStore.logMessage(`NPC heuristic: ${character.name} used Shapeshifter Swap with Dealer's card.`);
        await this.showRound(currentPlayerHands, currentDealerHand, currentTension);
        return this.promptPlayerAction(character, hand, canUseTrait, context);
      }

      if (typeof decision === 'object' && decision.type === 'SMUGGLER_SWAP') {
        executeSmugglerSwap(character, hand);
        hasUsedSmugglerSwap = true;
        gameStateStore.logMessage(`NPC heuristic: ${character.name} used Smuggler Swap with their pocket card.`);
        await this.showRound(currentPlayerHands, currentDealerHand, currentTension);
        return this.promptPlayerAction(character, hand, canUseTrait, context);
      }

      return decision;
    }

    // 2. Resolve for human player
    const controls = document.getElementById('card-table-controls');
    const hitBtn = document.getElementById('btn-hit') as HTMLButtonElement | null;
    const standBtn = document.getElementById('btn-stand') as HTMLButtonElement | null;
    const traitBtn = document.getElementById('btn-use-trait') as HTMLButtonElement | null;
    const shapeshifterBtn = controls
      ? this.getOrCreateActionButton(controls, 'btn-shapeshifter-swap', 'Shapeshift', 'Swap your last card with the Dealer face-up card', 'action-button--aptitude')
      : null;
    const smugglerBtn = controls
      ? this.getOrCreateActionButton(controls, 'btn-smuggler-swap', 'Pocket Card', 'Swap your last card with your Smuggler pocket card', 'action-button--aptitude')
      : null;
    const weaponBtn = controls
      ? this.getOrCreateActionButton(controls, 'btn-weapon-redraw', 'Weapon Redraw', 'Redraw your last combat card with a weapon', 'action-button--gear')
      : null;

    if (controls) controls.style.display = 'flex';
    if (traitBtn) traitBtn.disabled = !availability.canUseTrait;
    if (shapeshifterBtn) {
      shapeshifterBtn.hidden = !availability.canUseShapeshifterSwap;
      shapeshifterBtn.disabled = !availability.canUseShapeshifterSwap;
    }
    if (smugglerBtn) {
      smugglerBtn.hidden = !availability.canUseSmugglerSwap;
      smugglerBtn.disabled = !availability.canUseSmugglerSwap;
    }
    if (weaponBtn) {
      weaponBtn.hidden = !availability.canUseWeaponRedraw;
      weaponBtn.disabled = !availability.canUseWeaponRedraw;
    }

    return new Promise((resolve) => {
      const cleanUp = () => {
        if (hitBtn) hitBtn.replaceWith(hitBtn.cloneNode(true));
        if (standBtn) standBtn.replaceWith(standBtn.cloneNode(true));
        if (traitBtn) traitBtn.replaceWith(traitBtn.cloneNode(true));
        if (shapeshifterBtn) shapeshifterBtn.replaceWith(shapeshifterBtn.cloneNode(true));
        if (smugglerBtn) smugglerBtn.replaceWith(smugglerBtn.cloneNode(true));
        if (weaponBtn) weaponBtn.replaceWith(weaponBtn.cloneNode(true));
        if (controls) controls.style.display = 'none';
      };

      const bindHit = document.getElementById('btn-hit');
      const bindStand = document.getElementById('btn-stand');
      const bindTrait = document.getElementById('btn-use-trait');
      const bindShapeshifter = document.getElementById('btn-shapeshifter-swap');
      const bindSmuggler = document.getElementById('btn-smuggler-swap');
      const bindWeapon = document.getElementById('btn-weapon-redraw');

      bindHit?.addEventListener('click', () => {
        cleanUp();
        resolve('HIT');
      });

      bindStand?.addEventListener('click', () => {
        cleanUp();
        resolve('STAND');
      });

      bindTrait?.addEventListener('click', async () => {
        const trait = await promptTraitSelection(character, { bustMitigation: context.bustMitigation });
        if (trait) {
          cleanUp();
          resolve({ type: 'TRAIT', traitName: trait.name });
        }
      });

      bindShapeshifter?.addEventListener('click', async () => {
        executeShapeshifterSwap(hand, currentDealerHand);
        hasUsedShapeshifterSwap = true;
        gameStateStore.logMessage(`${character.name} used Shapeshifter Swap with Dealer's card.`);
        await this.showRound(currentPlayerHands, currentDealerHand, currentTension);
        cleanUp();
        resolve(this.promptPlayerAction(character, hand, canUseTrait, context));
      });

      bindSmuggler?.addEventListener('click', async () => {
        executeSmugglerSwap(character, hand);
        hasUsedSmugglerSwap = true;
        gameStateStore.logMessage(`${character.name} used Smuggler Swap with their pocket card.`);
        await this.showRound(currentPlayerHands, currentDealerHand, currentTension);
        cleanUp();
        resolve(this.promptPlayerAction(character, hand, canUseTrait, context));
      });

      bindWeapon?.addEventListener('click', () => {
        if (!availability.weaponForRedraw) return;
        cleanUp();
        resolve({ type: 'GEAR', gear: availability.weaponForRedraw, action: 'REDRAW_LAST_CARD' });
      });
    });
  }

  /**
   * Prompts memory swaps for dead character cards.
   */
  public async promptDeadPCFlashback(
    deadChar: Character,
    livingChar: Character,
    availableCards: Card[]
  ): Promise<{ cardToGive: Card; flashbackText: string } | null> {
    if (deadChar.isAI) {
      // AI instantly gives their card with a preset memory quip
      const quip = `${deadChar.name} remembers helping ${livingChar.name} seal a coolant line in the hangar.`;
      return { cardToGive: availableCards[0], flashbackText: quip };
    }

    // Prompt human via modal
    return await showGhostFlashbackModal(deadChar, livingChar, availableCards);
  }

  /**
   * Prompts the player to select a trait to permanently bust.
   */
  public async promptBustedTraitSelection(character: Character): Promise<Trait | null> {
    return await promptBustedTraitSelection(character);
  }

  /**
   * Closes the overlay.
   */
  public async showTestResult(result: TestResult, keepOverlayOpen: boolean = false): Promise<void> {
    gameStateStore.logMessage(`Test resolved. Player outcome: ${result.outcome}`);

    const overlay = document.getElementById('card-table-overlay');
    if (!overlay || overlay.hasAttribute('hidden')) {
      return;
    }

    const controls = document.getElementById('card-table-controls');
    const resultPanel = document.getElementById('card-table-result');
    const resultText = document.getElementById('card-table-result-text');
    const continueBtn = document.getElementById('btn-card-table-continue') as HTMLButtonElement | null;

    if (controls) controls.style.display = 'none';
    if (resultText) {
      const playerTotal = result.finalPlayerTotal > 0 ? `Crew ${result.finalPlayerTotal}` : 'Crew resolved';
      const dealerTotal = result.finalDealerTotal > 0 ? `Dealer ${result.finalDealerTotal}` : 'Dealer resolved';
      resultText.textContent = `${result.outcome} - ${playerTotal} / ${dealerTotal}`;
      resultText.style.color = result.outcome === 'WIN'
        ? 'var(--color-success-green)'
        : result.outcome === 'BUST' || result.outcome === 'LOSE'
          ? 'var(--color-damage-red)'
          : 'var(--color-alert-amber)';
    }
    if (resultPanel) resultPanel.removeAttribute('hidden');

    await new Promise<void>((resolve) => {
      if (!continueBtn) {
        window.setTimeout(resolve, 1200);
        return;
      }

      const freshContinueBtn = continueBtn.cloneNode(true) as HTMLButtonElement;
      continueBtn.replaceWith(freshContinueBtn);
      freshContinueBtn.addEventListener('click', () => resolve(), { once: true });
      freshContinueBtn.focus();
    });

    resultPanel?.setAttribute('hidden', '');
    
    if (!keepOverlayOpen) {
      overlay.setAttribute('hidden', '');
      
      // Reset round-specific swap states only when overlay is closed (round finished)
      hasUsedShapeshifterSwap = false;
      hasUsedSmugglerSwap = false;
    }
  }
}

export const cardTableOverlay = new CardTableOverlay();
