/**
 * Minimal reactive event bus for the OPHELP DB layer.
 * Collections emit a 'db:change' event on every write so React context
 * can re-render subscribed components without polling.
 */

type DbListener = (entity: string) => void

class DbEventBus {
  private listeners: Set<DbListener> = new Set()

  emit(entity: string) {
    this.listeners.forEach(fn => fn(entity))
  }

  subscribe(fn: DbListener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
}

export const dbBus = new DbEventBus()
