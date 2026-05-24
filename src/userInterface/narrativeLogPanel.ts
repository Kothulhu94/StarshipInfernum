import { gameEventBus } from '@gameFlow/gameEventBus';
import { NarrativeEvent } from '@narrativeSystem/narrativeTypes';
import { narrativeRouter } from '@narrativeSystem/narrativeEventRouter';

type LogKind = 'all' | 'rules' | 'narration';

export function initNarrativeLogPanel(): void {
  const container = document.querySelector('.narrative-log__entries');
  const filter = document.getElementById('narrative-log-filter') as HTMLSelectElement | null;
  if (!container) return;

  if (filter) {
    filter.addEventListener('change', () => applyLogFilter(filter.value as LogKind));
  }

  // Listen to simple system log additions
  gameEventBus.on('log_added', (msg: string) => {
    printTypewriter(msg, getLogClass(msg), 'rules');
  });

  // Listen to rich narrative event triggers
  gameEventBus.on('narrative_triggered', async (event: NarrativeEvent) => {
    const text = await narrativeRouter.handleEvent(event);
    if (text) {
      printTypewriter(text, getNarrativeClass(event.type), 'narration');
    }
  });

  // Listen to game reset (clear entries)
  gameEventBus.on('game_reset', () => {
    container.innerHTML = '';
  });

  // Listen to history reload (clear and show loaded history immediately)
  gameEventBus.on('history_reloaded', (historyLog: string[]) => {
    container.innerHTML = '';
    const scrollWrapper = document.getElementById('narrative-log');
    for (const msg of historyLog) {
      const entry = document.createElement('div');
      entry.className = `narrative-entry ${getLogClass(msg)}`;
      entry.dataset.logKind = 'rules';
      entry.textContent = msg;
      container.appendChild(entry);
    }
    applyLogFilter(filter?.value as LogKind | undefined);
    if (scrollWrapper) {
      scrollWrapper.scrollTop = scrollWrapper.scrollHeight;
    }
  });
}

/**
 * Typewriter print effect for logs.
 */
function printTypewriter(text: string, cssClass: string, logKind: Exclude<LogKind, 'all'>): void {
  const container = document.querySelector('.narrative-log__entries');
  const scrollWrapper = document.getElementById('narrative-log');
  if (!container || !scrollWrapper) return;

  const entry = document.createElement('div');
  entry.className = `narrative-entry ${cssClass} typewriter-cursor`;
  entry.dataset.logKind = logKind;
  container.appendChild(entry);
  applyLogFilter((document.getElementById('narrative-log-filter') as HTMLSelectElement | null)?.value as LogKind | undefined);

  let i = 0;
  const speed = 15; // ms per char

  const interval = setInterval(() => {
    if (i < text.length) {
      entry.textContent += text.charAt(i);
      i++;
      scrollWrapper.scrollTop = scrollWrapper.scrollHeight;
    } else {
      clearInterval(interval);
      entry.classList.remove('typewriter-cursor');
    }
  }, speed);
}

function applyLogFilter(filterValue: LogKind = 'all'): void {
  const entries = document.querySelectorAll<HTMLElement>('.narrative-log__entries .narrative-entry');
  entries.forEach((entry) => {
    const kind = entry.dataset.logKind || 'rules';
    entry.hidden = filterValue !== 'all' && kind !== filterValue;
  });
}

/**
 * Guess the log color style class based on keywords.
 */
function getLogClass(msg: string): string {
  const low = msg.toLowerCase();
  if (low.includes('bust') || low.includes('damage') || low.includes('perished') || low.includes('dead') || low.includes('fail')) {
    return 'narrative-entry--red';
  }
  if (low.includes('win') || low.includes('success') || low.includes('recovered') || low.includes('rested') || low.includes('healed')) {
    return 'narrative-entry--green';
  }
  if (low.includes('tension') || low.includes('joker') || low.includes('disaster') || low.includes('warning')) {
    return 'narrative-entry--amber';
  }
  if (low.includes('initialized') || low.includes('phase changed') || low.includes('autosaved') || low.includes('loaded')) {
    return 'narrative-entry--system';
  }
  return 'narrative-entry--cyan';
}

/**
 * Map NarrativeEventTypes to color coding classes.
 */
function getNarrativeClass(type: string): string {
  switch (type) {
    case 'TEST_BUST':
    case 'CHARACTER_DEATH':
      return 'narrative-entry--red';
    case 'TEST_SUCCESS':
    case 'CRISIS_RESOLVED':
      return 'narrative-entry--green';
    case 'RISING_TENSION':
    case 'CRISIS_TRIGGERED':
      return 'narrative-entry--amber';
    case 'GHOST_FLASHBACK':
      return 'narrative-entry--ghost';
    case 'ROOM_ENTERED':
    case 'OBSTACLE_REVEALED':
    case 'ADVERSARY_ENCOUNTER':
    case 'ADVERSARY_DEFEATED':
    default:
      return 'narrative-entry--cyan';
  }
}
