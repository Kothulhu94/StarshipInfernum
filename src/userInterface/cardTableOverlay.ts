import { Card, Suit } from '@cardEngine/cardDefinitions';
import { Character, Trait } from '@characterSystem/characterTypes';
import { TestUI, TestResult } from '@encounterSystem/encounterTypes';
import { evaluateHand } from '@cardEngine/handEvaluator';
import { getNPCDecision } from '@gameFlow/npcDecisionEngine';
import { executeShapeshifterSwap, executeSmugglerSwap } from '@characterSystem/aptitudeExecutor';
import { showGhostFlashbackModal } from './ghostFlashbackModal';
import { gameStateStore } from '@gameFlow/gameStateStore';

import { promptTraitSelection, promptBustedTraitSelection } from './hitStandControls';

// Local cache of dealer hand for decision context
let currentDealerHand: Card[] = [];
let hasUsedShapeshifterSwap = false;
let hasUsedSmugglerSwap = false;

export class CardTableOverlay implements TestUI {
  /**
   * Translates a Card's Suit to symbol and color CSS class.
   */
  private getCardDetails(card: Card): { symbol: string; cssClass: string } {
    if (card.isJoker) {
      return { symbol: '🃏', cssClass: 'playing-card--joker' };
    }
    switch (card.suit) {
      case Suit.HEARTS: return { symbol: '♥', cssClass: 'playing-card--hearts' };
      case Suit.DIAMONDS: return { symbol: '♦', cssClass: 'playing-card--diamonds' };
      case Suit.CLUBS: return { symbol: '♣', cssClass: 'playing-card--clubs' };
      case Suit.SPADES:
      default:
        return { symbol: '♠', cssClass: 'playing-card--spades' };
    }
  }

  /**
   * Helper to create card DOM elements.
   */
  private createCardElement(card: Card): HTMLElement {
    const el = document.createElement('div');
    const { symbol, cssClass } = this.getCardDetails(card);
    
    el.className = `playing-card ${cssClass} ${card.faceUp ? 'playing-card--face-up' : ''}`;
    
    el.innerHTML = `
      <div class="playing-card__inner">
        <div class="playing-card__back"></div>
        <div class="playing-card__front">
          <div class="playing-card__corner">
            <span class="playing-card__rank">${card.isJoker ? 'JK' : card.rank}</span>
            <span class="playing-card__suit">${symbol}</span>
          </div>
          <div class="playing-card__center-suit">${symbol}</div>
          <div class="playing-card__corner" style="transform: rotate(180deg);">
            <span class="playing-card__rank">${card.isJoker ? 'JK' : card.rank}</span>
            <span class="playing-card__suit">${symbol}</span>
          </div>
        </div>
      </div>
    `;
    return el;
  }

  /**
   * Renders the cards for a hand into a container.
   */
  private renderHand(container: HTMLElement, cards: Card[]): void {
    container.innerHTML = '';
    for (const card of cards) {
      container.appendChild(this.createCardElement(card));
    }
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

    const overlay = document.getElementById('card-table-overlay');
    if (!overlay) return;

    overlay.removeAttribute('hidden');
    document.getElementById('card-table-result')?.setAttribute('hidden', '');

    // Render Dealer area
    const dealerHandEl = document.getElementById('dealer-hand');
    const dealerTotalEl = document.getElementById('dealer-total');
    if (dealerHandEl) {
      this.renderHand(dealerHandEl, dealerHand);
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
          this.renderHand(handEl, hand);
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
    canUseTrait: boolean
  ): Promise<'HIT' | 'STAND' | { type: 'TRAIT'; traitName: string }> {
    // 1. Resolve for AI NPC
    if (character.isAI) {
      await new Promise((r) => setTimeout(r, 900)); // Natural AI thinking delay

      const decision = getNPCDecision(character, {
        playerHand: hand,
        dealerHand: currentDealerHand,
        canUseTrait,
        hasUsedShapeshifterSwap,
        hasUsedSmugglerSwap,
      });

      if (typeof decision === 'object' && decision.type === 'SHAPESHIFTER_SWAP') {
        executeShapeshifterSwap(hand, currentDealerHand);
        hasUsedShapeshifterSwap = true;
        gameStateStore.logMessage(`${character.name} used Shapeshifter Swap with Dealer's card.`);
        // Re-render and prompt again
        const handsMap = new Map<string, Card[]>();
        handsMap.set(character.id, hand);
        await this.showRound(handsMap, currentDealerHand, 0);
        return this.promptPlayerAction(character, hand, canUseTrait);
      }

      if (typeof decision === 'object' && decision.type === 'SMUGGLER_SWAP') {
        executeSmugglerSwap(character, hand);
        hasUsedSmugglerSwap = true;
        gameStateStore.logMessage(`${character.name} used Smuggler Swap with their pocket card.`);
        const handsMap = new Map<string, Card[]>();
        handsMap.set(character.id, hand);
        await this.showRound(handsMap, currentDealerHand, 0);
        return this.promptPlayerAction(character, hand, canUseTrait);
      }

      return decision;
    }

    // 2. Resolve for human player
    const controls = document.getElementById('card-table-controls');
    const hitBtn = document.getElementById('btn-hit') as HTMLButtonElement | null;
    const standBtn = document.getElementById('btn-stand') as HTMLButtonElement | null;
    const traitBtn = document.getElementById('btn-use-trait') as HTMLButtonElement | null;

    if (controls) controls.style.display = 'flex';
    if (traitBtn) traitBtn.disabled = !canUseTrait;

    return new Promise((resolve) => {
      const cleanUp = () => {
        if (hitBtn) hitBtn.replaceWith(hitBtn.cloneNode(true));
        if (standBtn) standBtn.replaceWith(standBtn.cloneNode(true));
        if (traitBtn) traitBtn.replaceWith(traitBtn.cloneNode(true));
        if (controls) controls.style.display = 'none';
      };

      const bindHit = document.getElementById('btn-hit');
      const bindStand = document.getElementById('btn-stand');
      const bindTrait = document.getElementById('btn-use-trait');

      bindHit?.addEventListener('click', () => {
        cleanUp();
        resolve('HIT');
      });

      bindStand?.addEventListener('click', () => {
        cleanUp();
        resolve('STAND');
      });

      bindTrait?.addEventListener('click', async () => {
        const trait = await promptTraitSelection(character);
        if (trait) {
          cleanUp();
          resolve({ type: 'TRAIT', traitName: trait.name });
        }
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
