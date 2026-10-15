import { BaseLoader } from '../core/BaseLoader';
import { ValidationError } from '../core/errors';
import { EVENTS_DIR } from '../core/paths';
import type { NexusClient } from '../types/client';
import type { BaseEvent } from '../Base/baseEvents';

class EventsLoader extends BaseLoader<BaseEvent> {
  constructor(client: NexusClient) {
    super(client, {
      name: 'Events',
      dir: EVENTS_DIR,
      tableHeadings: ['File', 'Target', 'Status'],
    });
  }

  private resolveTarget(event: BaseEvent): any {
    return event.target === 'client' ? this.client : (this.client as any)[event.target];
  }

  validate(event: BaseEvent, filePath: string): void {
    if (!event || typeof event !== 'object') {
      throw new ValidationError('Event export must be an object', { filePath });
    }
    if (!event.name || typeof event.name !== 'string') {
      throw new ValidationError('Event is missing a valid "name" string', { filePath });
    }
    if (!event.target || typeof event.target !== 'string') {
      throw new ValidationError(`Event "${event.name}" is missing a "target" string`, { filePath });
    }
    if (typeof event.execute !== 'function') {
      throw new ValidationError(`Event "${event.name}" is missing an execute() function`, { filePath });
    }

    const target = this.resolveTarget(event);
    if (!target || typeof target.on !== 'function') {
      throw new ValidationError(`Event target "${event.target}" not found or not an EventEmitter`, { filePath });
    }
  }

  onLoad(event: BaseEvent): string[] {
    const target = this.resolveTarget(event);
    const listener = (...args: unknown[]) =>
      this.client.errorHandler.safeExecute(() => (event.execute as any)(this.client, ...args), {
        kind: 'event',
        name: event.name as string,
      });

    if (event.once) target.once(event.name, listener);
    else target.on(event.name, listener);

    if (!this.client._forgecordEventListeners) this.client._forgecordEventListeners = [];
    this.client._forgecordEventListeners.push({ target, name: event.name as string, listener });

    return [event.target];
  }

  async load() {
    for (const entry of this.client._forgecordEventListeners || []) {
      entry.target?.removeListener?.(entry.name, entry.listener);
    }
    this.client._forgecordEventListeners = [];
    return super.load();
  }
}

export default function loadEvents(client: NexusClient) {
  return new EventsLoader(client).load();
}
