/**
 * starshipInfernum.ts — Application Entry Point
 *
 * Boots the Phaser 3 game instance for the top-down ship map,
 * initializes the starfield canvas on the title screen,
 * and wires up screen navigation and settings panel controllers.
 */

import Phaser from 'phaser';

import { initTitleScreenPanel } from './userInterface/titleScreenPanel';
import { initScenarioSelectionPanel } from './userInterface/scenarioSelectionPanel';
import { initCharacterCreationPanel } from './userInterface/characterCreationPanel';
import { initCharacterSheetSidebar } from './userInterface/characterSheetSidebar';
import { initCrisisClockDisplay } from './userInterface/crisisClockDisplay';
import { initNarrativeLogPanel } from './userInterface/narrativeLogPanel';
import { initSettingsModal } from './userInterface/settingsModal';
import { initGameOverScreen } from './userInterface/gameOverScreen';
import { cardTableOverlay } from './userInterface/cardTableOverlay';
import { turnSequencer } from '@gameFlow/turnSequencer';
import { gameEventBus } from '@gameFlow/gameEventBus';
import { gameStateStore } from '@gameFlow/gameStateStore';
import { ShipMapScene } from './mapRenderer/shipMapScene';
import '@userInterface/tooltipManager';

/* ─── Constants ───────────────────────────────────────── */

const PHASER_CONTAINER_ID = 'phaser-container';

let phaserGame: Phaser.Game | null = null;

const SCREEN_IDS = {
  title: 'title-screen',
  scenarioSelection: 'scenario-selection-screen',
  characterCreation: 'character-creation-screen',
  game: 'game-screen',
  gameOver: 'gameover-screen',
} as const;

type ScreenId = (typeof SCREEN_IDS)[keyof typeof SCREEN_IDS];

/* ─── Screen Management ───────────────────────────────── */

export function showScreen(screenId: string): void {
  const allScreens = document.querySelectorAll<HTMLElement>('.screen');
  allScreens.forEach((screen) => {
    screen.classList.remove('screen--active');
  });

  const target = document.getElementById(screenId);
  if (target) {
    target.classList.add('screen--active');
  }

  // Initialize Phaser game when game screen becomes active for the first time
  if (screenId === SCREEN_IDS.game) {
    if (!phaserGame) {
      phaserGame = createPhaserGame();
      
      // Wire up ShipMapScene click events back to game engine once ready
      phaserGame.events.once('ready', () => {
        const scene = phaserGame?.scene.getScene('ShipMapScene') as ShipMapScene;
        if (scene) {
          scene.onRoomClicked = (roomId) => {
            turnSequencer.moveActiveCharacter(roomId);
          };
          scene.onDoorClicked = (roomId, direction) => {
            turnSequencer.exploreDoor(direction);
          };
        }
        
        // Push initial state update since game was already initialized
        const state = gameStateStore.getState();
        if (state.activeRoomId) {
          triggerPhaserStateUpdate(state);
        }
      });
    } else {
      setTimeout(() => {
        phaserGame?.scale.refresh();
      }, 50);
    }
  }
}

/* ─── Starfield Background (Title Screen) ─────────────── */

interface Star {
  x: number;
  y: number;
  radius: number;
  speed: number;
  opacity: number;
  twinklePhase: number;
}

function initStarfield(canvas: HTMLCanvasElement): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};

  let animationFrameId = 0;
  let stars: Star[] = [];

  function resizeCanvas(): void {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = createStars(280);
  }

  function createStars(count: number): Star[] {
    return Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.5 + 0.3,
      speed: Math.random() * 0.3 + 0.05,
      opacity: Math.random() * 0.6 + 0.4,
      twinklePhase: Math.random() * Math.PI * 2,
    }));
  }

  function drawFrame(timestamp: number): void {
    if (!ctx) return;

    ctx.fillStyle = 'hsl(220, 20%, 6%)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const timeSeconds = timestamp / 1000;

    for (const star of stars) {
      star.y += star.speed;
      if (star.y > canvas.height) {
        star.y = -2;
        star.x = Math.random() * canvas.width;
      }

      const twinkle =
        0.5 + 0.5 * Math.sin(timeSeconds * 2 + star.twinklePhase);
      const alpha = star.opacity * (0.6 + 0.4 * twinkle);

      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(210, 15%, 88%, ${alpha})`;
      ctx.fill();

      if (star.radius > 1.0) {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(200, 100%, 70%, ${alpha * 0.1})`;
        ctx.fill();
      }
    }

    animationFrameId = requestAnimationFrame(drawFrame);
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  animationFrameId = requestAnimationFrame(drawFrame);

  return () => {
    cancelAnimationFrame(animationFrameId);
    window.removeEventListener('resize', resizeCanvas);
  };
}

/* ─── Phaser Configuration ────────────────────────────── */

function createPhaserGame(): Phaser.Game {
  const container = document.getElementById(PHASER_CONTAINER_ID);
  if (!container) {
    throw new Error(`Phaser container #${PHASER_CONTAINER_ID} not found`);
  }

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: PHASER_CONTAINER_ID,
    backgroundColor: '#0c0e12',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [ShipMapScene],
    render: {
      antialias: true,
      pixelArt: false,
    },
  };

  return new Phaser.Game(config);
}

function triggerPhaserStateUpdate(state: any): void {
  if (!phaserGame) return;
  const scene = phaserGame.scene.getScene('ShipMapScene') as ShipMapScene;
  if (scene && state.activeRoomId) {
    const graph = gameStateStore.getMapGraph();
    
    // Map characters to activeRoomId
    const characterPositions = new Map<string, string>();
    for (const char of state.characters) {
      characterPositions.set(char.id, state.activeRoomId);
    }

    // Calculate which rooms have active obstacles
    const activeObstacleRoomIds = new Set<string>();
    for (const room of graph.rooms.values()) {
      if (room.cardCode && !room.isDiscovered) {
        activeObstacleRoomIds.add(room.id);
      }
    }

    scene.updateState(
      graph,
      characterPositions,
      state.characters,
      state.activeRoomId,
      state.activeCharacterId || '',
      activeObstacleRoomIds,
      state.currentDeck
    );
  }
}

/* ─── Action / Exploration Controls ───────────────────── */

function initExplorationControls(): void {
  const btnN = document.getElementById('btn-explore-n');
  const btnS = document.getElementById('btn-explore-s');
  const btnE = document.getElementById('btn-explore-e');
  const btnW = document.getElementById('btn-explore-w');
  const btnCrisis = document.getElementById('btn-attempt-crisis');
  const btnRest = document.getElementById('btn-safety-rest');

  btnN?.addEventListener('click', () => turnSequencer.exploreDoor('N'));
  btnS?.addEventListener('click', () => turnSequencer.exploreDoor('S'));
  btnE?.addEventListener('click', () => turnSequencer.exploreDoor('E'));
  btnW?.addEventListener('click', () => turnSequencer.exploreDoor('W'));

  btnCrisis?.addEventListener('click', () => turnSequencer.attemptCrisisStep(cardTableOverlay));
  btnRest?.addEventListener('click', () => turnSequencer.restInSafetyRoom(cardTableOverlay));
}

/* ─── Boot Sequence ───────────────────────────────────── */

function boot(): void {
  /* Starfield */
  const starfieldCanvas = document.getElementById('starfield-canvas') as HTMLCanvasElement | null;
  if (starfieldCanvas) {
    initStarfield(starfieldCanvas);
  }

  /* Wire up UI panels */
  initTitleScreenPanel();
  initScenarioSelectionPanel(() => {});
  initCharacterCreationPanel();
  initCharacterSheetSidebar();
  initCrisisClockDisplay();
  initNarrativeLogPanel();
  initSettingsModal();
  initGameOverScreen();

  // Wires state updates to ShipMapScene
  gameEventBus.on('state_updated', (state) => {
    triggerPhaserStateUpdate(state);
  });

  /* Exploration panels controls */
  initExplorationControls();

  /* Handle phase transitions side effects */
  gameEventBus.on('phase_changed', (phase) => {
    const explorePanel = document.getElementById('explore-controls');
    if (explorePanel) {
      explorePanel.style.display = phase === 'EXPLORING' ? 'flex' : 'none';
    }

    if (phase === 'OBSTACLE') {
      // Auto-trigger obstacle blackjack test resolution
      setTimeout(() => {
        turnSequencer.resolveObstacle(cardTableOverlay);
      }, 500);
    }
  });

  console.log(
    '%c⚙ Starship Infernum booted',
    'color: #4db8b8; font-weight: bold; font-size: 14px;'
  );
  console.log(
    '%c  Phase 11 UI Panels Integration Complete.',
    'color: #5a6377;'
  );
}

/* ─── Initialize ──────────────────────────────────────── */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

export { SCREEN_IDS };
export type { ScreenId };
