type GameEventCallback = (data?: any) => void | Promise<void>;

export class GameEventBus {
  private listeners: Map<string, GameEventCallback[]> = new Map();

  /**
   * Register a callback listener for an event.
   */
  public on(event: string, callback: GameEventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  /**
   * Unregister a callback listener from an event.
   */
  public off(event: string, callback: GameEventCallback): void {
    const list = this.listeners.get(event);
    if (!list) return;
    this.listeners.set(
      event,
      list.filter((cb) => cb !== callback)
    );
  }

  /**
   * Emit an event, notifying all registered listeners.
   */
  public emit(event: string, data?: any): void {
    const list = this.listeners.get(event);
    if (!list) return;
    // Execute all callbacks
    for (const callback of list) {
      try {
        const result = callback(data);
        if (result instanceof Promise) {
          result.catch((err) => {
            console.error(`Error in async event listener for ${event}:`, err);
          });
        }
      } catch (err) {
        console.error(`Error in event listener for ${event}:`, err);
      }
    }
  }

  /**
   * Clears all listeners. Useful for test resets.
   */
  public clear(): void {
    this.listeners.clear();
  }
}

export const gameEventBus = new GameEventBus();
