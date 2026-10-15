'use strict';
const BaseLoader = require('../core/BaseLoader');
const { ValidationError } = require('../core/errors');
const { EVENTS_DIR } = require('../core/paths');

class EventsLoader extends BaseLoader {
  constructor(client) {
    super(client, {
      name: 'Events',
      dir: EVENTS_DIR,
      tableHeadings: ['File', 'Target', 'Status'],
    });
  }

  validate(event, filePath) {
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

    const target = event.target === 'client' ? this.client : this.client[event.target];
    if (!target || typeof target.on !== 'function') {
      throw new ValidationError(`Event target "${event.target}" not found or not an EventEmitter`, { filePath });
    }
  }

  onLoad(event) {
    const target = event.target === 'client' ? this.client : this.client[event.target];
    const listener = (...args) =>
      this.client.errorHandler.safeExecute(() => event.execute(this.client, ...args), {
        kind: 'event',
        name: event.name,
      });

    if (event.once) target.once(event.name, listener);
    else target.on(event.name, listener);

    if (!Array.isArray(this.client._forgecordEventListeners)) this.client._forgecordEventListeners = [];
    this.client._forgecordEventListeners.push({ target, name: event.name, listener });

    return [event.target];
  }

  async load() {
    // Hot-reload: remove only listeners owned by Forgecord. Never call
    // removeAllListeners() on Discord.js emitters because that can remove
    // internal listeners and break the client after a refresh.
    for (const entry of this.client._forgecordEventListeners || []) {
      entry.target?.removeListener?.(entry.name, entry.listener);
    }
    this.client._forgecordEventListeners = [];
    return super.load();
  }
}

/**
 * @param {import('./Nexus')} client
 */
module.exports = client => new EventsLoader(client).load();
