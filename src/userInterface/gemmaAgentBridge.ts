type AgentCommand = {
  seq: number;
  action: 'CLICK' | 'CLICK_TARGET' | 'PRESS' | 'TYPE' | 'DEBUG';
  x?: number;
  y?: number;
  key?: string;
  text?: string;
  target?: string;
  button?: string;
  double?: boolean;
  captureWidth?: number;
  captureHeight?: number;
};

type PagePoint = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  source: 'raw' | 'capture-size-scaled' | 'device-pixel-scaled';
  target: Element | null;
};

function getBridgeUrl(): string {
  const params = new URLSearchParams(window.location.search);
  const rawPort = params.get('bridgePort') || '8765';
  const port = Number(rawPort);
  const safePort = Number.isInteger(port) && port > 0 && port <= 65535 ? port : 8765;
  return `http://127.0.0.1:${safePort}`;
}

const BRIDGE_URL = getBridgeUrl();
const POLL_INTERVAL_MS = 200;

let lastSeq = 0;
let pollTimer: number | null = null;

const CLICKABLE_SELECTOR =
  'button, [role="button"], a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function normalizeLabel(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function normalizeKey(key: string): string {
  const lower = key.toLowerCase();
  const aliases: Record<string, string> = {
    esc: 'Escape',
    escape: 'Escape',
    enter: 'Enter',
    space: ' ',
    tab: 'Tab',
    up: 'ArrowUp',
    down: 'ArrowDown',
    left: 'ArrowLeft',
    right: 'ArrowRight',
    backspace: 'Backspace',
    delete: 'Delete',
  };
  return aliases[lower] || (key.length === 1 ? key : key);
}

function isVisibleElement(element: Element): boolean {
  if (!(element instanceof HTMLElement)) return false;
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0 && rect.bottom >= 0 && rect.right >= 0 && rect.top <= window.innerHeight && rect.left <= window.innerWidth;
}

function isDisabledElement(element: HTMLElement): boolean {
  if (
    element instanceof HTMLButtonElement ||
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  ) {
    return element.disabled;
  }
  return element.getAttribute('aria-disabled') === 'true';
}

function findClickableElement(target: Element | null): HTMLElement | null {
  let current: Element | null = target;
  while (current) {
    if (current instanceof HTMLElement && current.matches(CLICKABLE_SELECTOR) && isVisibleElement(current)) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function describeElement(target: Element): string {
  if (target instanceof HTMLElement) {
    return target.id || target.getAttribute('aria-label') || target.textContent?.trim().replace(/\s+/g, ' ').slice(0, 40) || target.tagName;
  }
  return target.nodeName;
}

function getVisibleClickables(): HTMLElement[] {
  return Array.from(document.querySelectorAll<HTMLElement>(CLICKABLE_SELECTOR)).filter(isVisibleElement);
}

function getElementCenter(element: Element): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}

function findClickableByLabel(label: string): HTMLElement | null {
  const wanted = normalizeLabel(label);
  if (!wanted) return null;

  const candidates = getVisibleClickables().map((element) => {
    const elementLabel = describeElement(element);
    const normalized = normalizeLabel(elementLabel);
    let score = 0;
    if (normalized === wanted) score = 100;
    else if (normalized.includes(wanted)) score = 80;
    else if (wanted.includes(normalized) && normalized.length > 0) score = 60;
    return { element, score };
  });

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.score > 0 ? candidates[0].element : null;
}

function findNearestClickableElement(x: number, y: number, maxDistance = 48): HTMLElement | null {
  let nearest: { element: HTMLElement; distance: number } | null = null;
  for (const element of getVisibleClickables()) {
    const center = getElementCenter(element);
    const distance = Math.hypot(center.x - x, center.y - y);
    if (distance <= maxDistance && (!nearest || distance < nearest.distance)) {
      nearest = { element, distance };
    }
  }
  return nearest?.element || null;
}

function closeOpenDialog(): string | null {
  const openDialog = Array.from(document.querySelectorAll<HTMLDialogElement>('dialog')).find((dialog) => dialog.open);
  if (!openDialog) return null;
  const label = describeElement(openDialog);
  openDialog.close();
  return label;
}

function chooseNextSelectOption(select: HTMLSelectElement): string | null {
  const options = Array.from(select.options);
  const currentIndex = select.selectedIndex;
  const nextOption =
    options.find((option, index) => index > currentIndex && !option.disabled && Boolean(option.value)) ||
    options.find((option) => !option.disabled && Boolean(option.value));

  if (!nextOption) return null;

  select.value = nextOption.value;
  select.dispatchEvent(new Event('input', { bubbles: true }));
  select.dispatchEvent(new Event('change', { bubbles: true }));
  return nextOption.textContent?.trim() || nextOption.value;
}

function mapCapturePointToPagePoint(x: number, y: number, command: AgentCommand): PagePoint {
  const captureWidth = Number(command.captureWidth);
  const captureHeight = Number(command.captureHeight);
  if (Number.isFinite(captureWidth) && Number.isFinite(captureHeight) && captureWidth > 0 && captureHeight > 0) {
    const scaleX = window.innerWidth / captureWidth;
    const scaleY = window.innerHeight / captureHeight;
    const pageX = x * scaleX;
    const pageY = y * scaleY;
    return {
      x: pageX,
      y: pageY,
      scaleX,
      scaleY,
      source: 'capture-size-scaled',
      target: document.elementFromPoint(pageX, pageY),
    };
  }

  const scale = window.devicePixelRatio || 1;

  if (scale > 1) {
    const scaledX = x / scale;
    const scaledY = y / scale;
    const scaledTarget = document.elementFromPoint(scaledX, scaledY);
    return {
      x: scaledX,
      y: scaledY,
      scaleX: 1 / scale,
      scaleY: 1 / scale,
      source: 'device-pixel-scaled',
      target: scaledTarget,
    };
  }

  return { x, y, scaleX: 1, scaleY: 1, source: 'raw', target: document.elementFromPoint(x, y) };
}

function dispatchMouseSequence(target: Element, x: number, y: number, buttonName: string): void {
  const button = buttonName === 'right' ? 2 : 0;
  const common = {
    bubbles: true,
    cancelable: true,
    composed: true,
    clientX: x,
    clientY: y,
    button,
    buttons: button === 2 ? 2 : 1,
  };

  target.dispatchEvent(new PointerEvent('pointerover', { ...common, pointerId: 1, pointerType: 'mouse' }));
  target.dispatchEvent(new PointerEvent('pointerenter', { ...common, pointerId: 1, pointerType: 'mouse' }));
  target.dispatchEvent(new PointerEvent('pointermove', { ...common, pointerId: 1, pointerType: 'mouse' }));
  target.dispatchEvent(new MouseEvent('mouseover', common));
  target.dispatchEvent(new MouseEvent('mousemove', common));
  target.dispatchEvent(new PointerEvent('pointerdown', { ...common, pointerId: 1, pointerType: 'mouse' }));
  target.dispatchEvent(new MouseEvent('mousedown', common));

  if (target instanceof HTMLElement) {
    target.focus({ preventScroll: true });
  }

  target.dispatchEvent(new PointerEvent('pointerup', { ...common, pointerId: 1, pointerType: 'mouse', buttons: 0 }));
  target.dispatchEvent(new MouseEvent('mouseup', { ...common, buttons: 0 }));
  target.dispatchEvent(new MouseEvent('click', { ...common, detail: 1, buttons: 0 }));
}

function runClick(command: AgentCommand): string {
  const captureX = Number(command.x);
  const captureY = Number(command.y);
  if (!Number.isFinite(captureX) || !Number.isFinite(captureY)) {
    throw new Error('CLICK command requires finite x/y coordinates');
  }

  const pagePoint = mapCapturePointToPagePoint(captureX, captureY, command);
  const { x, y } = pagePoint;
  const target = pagePoint.target;
  if (!target) {
    throw new Error(`No page element at capture (${captureX}, ${captureY}) -> page (${Math.round(x)}, ${Math.round(y)})`);
  }

  const clickTarget: Element = findClickableElement(target) || findNearestClickableElement(x, y) || target;
  const clickX = x;
  const clickY = y;

  if (clickTarget instanceof HTMLSelectElement) {
    const selectedLabel = chooseNextSelectOption(clickTarget);
    if (selectedLabel) {
      const label = describeElement(clickTarget);
      const mappedFrom =
        pagePoint.source !== 'raw'
          ? ` from capture (${Math.round(captureX)}, ${Math.round(captureY)}), scale ${pagePoint.scaleX.toFixed(3)}x${pagePoint.scaleY.toFixed(3)}`
          : '';
      return `Selected ${selectedLabel} in ${label}${mappedFrom}`;
    }
  }

  dispatchMouseSequence(clickTarget, clickX, clickY, command.button || 'left');
  if (command.double) {
    dispatchMouseSequence(clickTarget, clickX, clickY, command.button || 'left');
  }

  const label = describeElement(clickTarget);
  const roundedX = Math.round(clickX);
  const roundedY = Math.round(clickY);
  const mappedFrom =
    pagePoint.source !== 'raw'
      ? ` from capture (${Math.round(captureX)}, ${Math.round(captureY)}), scale ${pagePoint.scaleX.toFixed(3)}x${pagePoint.scaleY.toFixed(3)}`
      : '';
  return `Clicked ${label} at page (${roundedX}, ${roundedY})${mappedFrom}`;
}

function runClickTarget(command: AgentCommand): string {
  const requestedTarget = String(command.target || command.text || '').trim();
  if (!requestedTarget) {
    throw new Error('CLICK_TARGET command requires a target label');
  }

  const clickTarget = findClickableByLabel(requestedTarget);
  if (!clickTarget) {
    throw new Error(`No visible clickable target matched '${requestedTarget}'`);
  }

  if (clickTarget instanceof HTMLSelectElement) {
    const selectedLabel = chooseNextSelectOption(clickTarget);
    if (selectedLabel) {
      return `Selected ${selectedLabel} in target ${describeElement(clickTarget)}`;
    }
  }

  const center = getElementCenter(clickTarget);
  dispatchMouseSequence(clickTarget, center.x, center.y, command.button || 'left');
  if (command.double) {
    dispatchMouseSequence(clickTarget, center.x, center.y, command.button || 'left');
  }

  return `Clicked target ${describeElement(clickTarget)} at page (${Math.round(center.x)}, ${Math.round(center.y)})`;
}

function runDebug(command: AgentCommand): string {
  const x = Number(command.x || 0);
  const y = Number(command.y || 0);
  const captureWidth = Number(command.captureWidth);
  const captureHeight = Number(command.captureHeight);
  const hasCaptureSize = Number.isFinite(captureWidth) && Number.isFinite(captureHeight) && captureWidth > 0 && captureHeight > 0;
  const pagePoint = mapCapturePointToPagePoint(x, y, command);
  const buttons = getVisibleClickables()
    .slice(0, 20)
    .map((element) => {
      const rect = element.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      return {
        label: describeElement(element),
        tag: element.tagName.toLowerCase(),
        disabled: isDisabledElement(element),
        left: Math.round(rect.left),
        top: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        cx: Math.round(cx),
        cy: Math.round(cy),
        captureCx: hasCaptureSize ? Math.round((cx / window.innerWidth) * captureWidth) : null,
        captureCy: hasCaptureSize ? Math.round((cy / window.innerHeight) * captureHeight) : null,
      };
    });
  const visibleScreens = Array.from(document.querySelectorAll<HTMLElement>('[id$="-screen"], .screen'))
    .filter(isVisibleElement)
    .map((element) => describeElement(element));

  return JSON.stringify({
    dpr: window.devicePixelRatio || 1,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    captureWidth: hasCaptureSize ? Math.round(captureWidth) : null,
    captureHeight: hasCaptureSize ? Math.round(captureHeight) : null,
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    capturePoint: { x, y },
    mappedPoint: {
      x: Math.round(pagePoint.x),
      y: Math.round(pagePoint.y),
      source: pagePoint.source,
      target: pagePoint.target ? describeElement(pagePoint.target) : null,
    },
    visibleScreens,
    buttons,
  });
}

function runPress(command: AgentCommand): string {
  const key = normalizeKey(String(command.key || ''));
  if (!key) {
    throw new Error('PRESS command requires a key');
  }

  if (key === 'Escape') {
    const closedDialog = closeOpenDialog();
    if (closedDialog) return `Closed ${closedDialog}`;
  }

  const target = document.activeElement || document.body;
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  target.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true }));
  return `Pressed ${key}`;
}

function runType(command: AgentCommand): string {
  const text = String(command.text || '');
  const target = document.activeElement;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    target.value = `${target.value.slice(0, start)}${text}${target.value.slice(end)}`;
    const cursor = start + text.length;
    target.setSelectionRange(cursor, cursor);
    target.dispatchEvent(new InputEvent('input', { data: text, inputType: 'insertText', bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));
    return `Typed into ${target.id || target.name || target.tagName}`;
  }

  for (const char of text) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true, cancelable: true }));
    document.dispatchEvent(new KeyboardEvent('keypress', { key: char, bubbles: true, cancelable: true }));
    document.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true, cancelable: true }));
  }
  return 'Typed through keyboard events';
}

function runCommand(command: AgentCommand): string {
  if (command.action === 'CLICK') return runClick(command);
  if (command.action === 'CLICK_TARGET') return runClickTarget(command);
  if (command.action === 'PRESS') return runPress(command);
  if (command.action === 'TYPE') return runType(command);
  if (command.action === 'DEBUG') return runDebug(command);
  throw new Error(`Unsupported action: ${command.action}`);
}

async function ack(command: AgentCommand, ok: boolean, message: string): Promise<void> {
  try {
    await fetch(`${BRIDGE_URL}/ack`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seq: command.seq, ok, message }),
    });
  } catch {
    // The dashboard may be stopped; polling will reconnect when it returns.
  }
}

async function pollBridge(): Promise<void> {
  try {
    const response = await fetch(`${BRIDGE_URL}/next?since=${lastSeq}`, { cache: 'no-store' });
    if (!response.ok) return;
    const data = await response.json();
    const serverSeq = Number(data.seq || 0);
    if (serverSeq < lastSeq) {
      lastSeq = 0;
      return;
    }
    const command = data.command as AgentCommand | null;
    if (!command || command.seq <= lastSeq) return;

    lastSeq = command.seq;
    try {
      const message = runCommand(command);
      await ack(command, true, message);
    } catch (error) {
      await ack(command, false, error instanceof Error ? error.message : String(error));
    }
  } catch {
    // Expected while the dashboard bridge is not running.
  }
}

export function initGemmaAgentBridge(): void {
  if (pollTimer !== null) return;
  (window as any).__gemma4GamerBridge = { connected: true };
  pollTimer = window.setInterval(() => {
    void pollBridge();
  }, POLL_INTERVAL_MS);
  void pollBridge();
}
