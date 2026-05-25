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
import { initNPCTurnController } from '@gameFlow/npcTurnController';
import { ShipMapScene } from './mapRenderer/shipMapScene';
import '@userInterface/tooltipManager';
import { showObstacleDescriptionModal } from './userInterface/obstacleDescriptionModal';
import { getHydratedObstacle } from './encounterSystem/obstacleRegistry';
import { getObstacleCardCode, hasBlockingObstacle } from './mapGenerator/roomObstacleState';

/* ─── Constants ───────────────────────────────────────── */

const PHASER_CONTAINER_ID = 'phaser-container';

let phaserGame: Phaser.Game | null = null;
let updatePanelLayout: (() => void) | null = null;

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
    if (updatePanelLayout) {
      updatePanelLayout();
    }
    if (!phaserGame) {
      phaserGame = createPhaserGame();
      
      // Wire up ShipMapScene click events back to game engine once ready
      phaserGame.events.once('ready', () => {
        const scene = phaserGame?.scene.getScene('ShipMapScene') as ShipMapScene;
        if (scene) {
          scene.onRoomClicked = (roomId) => {
            turnSequencer.moveActiveCharacter(roomId);
          };
          scene.onDoorClicked = (_roomId, direction) => {
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
      if (hasBlockingObstacle(room)) {
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

function refreshMapLayout(): void {
  window.setTimeout(() => {
    phaserGame?.scale.refresh();
  }, 50);
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

/* ─── Adjustable Game Panels ──────────────────────────── */

type AdjustablePanel = 'narrative' | 'status' | 'crew';

interface PanelLayoutSettings {
  narrativeWidth: number;
  statusWidth: number;
  crewHeight: number;
  narrativeCollapsed: boolean;
  statusCollapsed: boolean;
  crewCollapsed: boolean;
}

const PANEL_LAYOUT_STORAGE_KEY = 'starshipInfernum.panelLayout';
const PANEL_LAYOUT_DEFAULTS: PanelLayoutSettings = {
  narrativeWidth: 320,
  statusWidth: 300,
  crewHeight: 170,
  narrativeCollapsed: false,
  statusCollapsed: false,
  crewCollapsed: false,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function loadPanelLayoutSettings(): PanelLayoutSettings {
  try {
    const stored = window.localStorage.getItem(PANEL_LAYOUT_STORAGE_KEY);
    if (!stored) return { ...PANEL_LAYOUT_DEFAULTS };
    return { ...PANEL_LAYOUT_DEFAULTS, ...JSON.parse(stored) };
  } catch {
    return { ...PANEL_LAYOUT_DEFAULTS };
  }
}

function savePanelLayoutSettings(settings: PanelLayoutSettings): void {
  window.localStorage.setItem(PANEL_LAYOUT_STORAGE_KEY, JSON.stringify(settings));
}

function initAdjustableGamePanels(): void {
  const layout = document.querySelector<HTMLElement>('.game-layout');
  if (!layout) return;

  const settings = loadPanelLayoutSettings();

  const applyLayout = () => {
    const rect = layout.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const minMapWidth = Math.min(520, Math.max(260, rect.width * 0.48));
    const maxSidePanelTotal = Math.max(0, rect.width - minMapWidth);
    let effectiveNarrativeWidth = settings.narrativeCollapsed ? 0 : settings.narrativeWidth;
    let effectiveStatusWidth = settings.statusCollapsed ? 0 : settings.statusWidth;
    const effectiveSidePanelTotal = effectiveNarrativeWidth + effectiveStatusWidth;

    if (effectiveSidePanelTotal > maxSidePanelTotal && effectiveSidePanelTotal > 0) {
      const scale = maxSidePanelTotal / effectiveSidePanelTotal;
      effectiveNarrativeWidth = Math.floor(effectiveNarrativeWidth * scale);
      effectiveStatusWidth = Math.floor(effectiveStatusWidth * scale);
    }

    const minMapHeight = Math.min(360, Math.max(260, rect.height * 0.55));
    const maxCrewHeight = Math.max(0, rect.height - minMapHeight);
    const effectiveCrewHeight = settings.crewCollapsed ? 0 : Math.min(settings.crewHeight, maxCrewHeight);

    layout.style.setProperty(
      '--narrative-panel-width-current',
      `${effectiveNarrativeWidth}px`
    );
    layout.style.setProperty(
      '--status-panel-width-current',
      `${effectiveStatusWidth}px`
    );
    layout.style.setProperty(
      '--crew-panel-height-current',
      `${effectiveCrewHeight}px`
    );
    layout.classList.toggle('is-narrative-collapsed', settings.narrativeCollapsed);
    layout.classList.toggle('is-status-collapsed', settings.statusCollapsed);
    layout.classList.toggle('is-crew-collapsed', settings.crewCollapsed);
    refreshMapLayout();
  };

  const persistAndApply = () => {
    savePanelLayoutSettings(settings);
    applyLayout();
  };

  const setCollapsed = (panel: AdjustablePanel, collapsed: boolean) => {
    if (panel === 'narrative') settings.narrativeCollapsed = collapsed;
    if (panel === 'status') settings.statusCollapsed = collapsed;
    if (panel === 'crew') settings.crewCollapsed = collapsed;
    persistAndApply();
  };

  document.getElementById('btn-toggle-narrative')?.addEventListener('click', () => setCollapsed('narrative', true));
  document.getElementById('btn-toggle-status')?.addEventListener('click', () => setCollapsed('status', true));
  document.getElementById('btn-toggle-crew')?.addEventListener('click', () => setCollapsed('crew', true));
  document.getElementById('btn-restore-narrative')?.addEventListener('click', () => setCollapsed('narrative', false));
  document.getElementById('btn-restore-status')?.addEventListener('click', () => setCollapsed('status', false));
  document.getElementById('btn-restore-crew')?.addEventListener('click', () => setCollapsed('crew', false));

  const startResize = (event: PointerEvent, panel: AdjustablePanel) => {
    event.preventDefault();
    const handle = event.currentTarget as HTMLElement;
    handle.setPointerCapture(event.pointerId);
    layout.classList.toggle('is-resizing-vertical', panel === 'crew');
    layout.classList.toggle('is-resizing', panel !== 'crew');

    const move = (moveEvent: PointerEvent) => {
      const rect = layout.getBoundingClientRect();
      const visibleStatus = settings.statusCollapsed ? 0 : settings.statusWidth;
      const visibleNarrative = settings.narrativeCollapsed ? 0 : settings.narrativeWidth;
      const minMapWidth = Math.min(420, rect.width * 0.48);
      const minMapHeight = Math.min(320, rect.height * 0.5);

      if (panel === 'narrative') {
        const maxWidth = Math.max(180, rect.width - visibleStatus - minMapWidth);
        settings.narrativeWidth = clamp(moveEvent.clientX - rect.left, 180, maxWidth);
        settings.narrativeCollapsed = false;
      }

      if (panel === 'status') {
        const maxWidth = Math.max(180, rect.width - visibleNarrative - minMapWidth);
        settings.statusWidth = clamp(rect.right - moveEvent.clientX, 180, maxWidth);
        settings.statusCollapsed = false;
      }

      if (panel === 'crew') {
        const maxHeight = Math.max(88, rect.height - minMapHeight);
        settings.crewHeight = clamp(rect.bottom - moveEvent.clientY, 88, maxHeight);
        settings.crewCollapsed = false;
      }

      applyLayout();
    };

    const stop = (stopEvent: PointerEvent) => {
      handle.releasePointerCapture(stopEvent.pointerId);
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', stop);
      handle.removeEventListener('pointercancel', stop);
      layout.classList.remove('is-resizing', 'is-resizing-vertical');
      savePanelLayoutSettings(settings);
      refreshMapLayout();
    };

    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
  };

  document.getElementById('resize-narrative')?.addEventListener('pointerdown', (event) => startResize(event, 'narrative'));
  document.getElementById('resize-status')?.addEventListener('pointerdown', (event) => startResize(event, 'status'));
  document.getElementById('resize-crew')?.addEventListener('pointerdown', (event) => startResize(event, 'crew'));

  window.addEventListener('resize', () => {
    applyLayout();
    refreshMapLayout();
  });
  updatePanelLayout = applyLayout;
  applyLayout();
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
  initAdjustableGamePanels();
  initNPCTurnController();

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
      const state = gameStateStore.getState();
      const graph = gameStateStore.getMapGraph();
      const currentRoom = state.activeRoomId ? graph.getRoom(state.activeRoomId) : null;
      const obstacleCardCode = currentRoom ? getObstacleCardCode(currentRoom) : undefined;
      const obstacle = obstacleCardCode ? getHydratedObstacle(obstacleCardCode, state.scenario) : null;

      if (obstacle && obstacle.type !== 'SAFETY') {
        showObstacleDescriptionModal(obstacle).then(() => {
          turnSequencer.resolveObstacle(cardTableOverlay);
        });
      } else {
        setTimeout(() => {
          turnSequencer.resolveObstacle(cardTableOverlay);
        }, 500);
      }
    }
  });

  console.log('%c⚙ Starship Infernum booted', 'color: #4db8b8; font-weight: bold;');
}

/* ─── Initialize ──────────────────────────────────────── */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

export { SCREEN_IDS };
export type { ScreenId };
