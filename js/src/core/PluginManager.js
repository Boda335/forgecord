'use strict';
const { EventEmitter } = require('events');
const fs = require('fs/promises');
const { PluginError } = require('./errors');
const { Logger } = require('./logger');

/**
 * Very small plugin system.
 *
 * `client.hooks` is a plain EventEmitter that the loaders / event handlers
 * emit lifecycle events on (`loaderComplete`, `commandExecuted`,
 * `commandError`, `ready`, ...). A plugin just listens on `client.hooks` and
 * optionally does setup work in `onLoad(client)`.
 *
 * This is intentionally NOT a heavy DI container — Forgecord projects are
 * usually one bot, not a multi-service app, so a hook bus is enough to let
 * people bolt on things (analytics, custom moderation, a REST API, ...)
 * without forking core files.
 *
 * A plugin module looks like:
 *   module.exports = {
 *     name: 'my-plugin',
 *     async onLoad(client) {
 *       client.hooks.on('commandExecuted', ({ command, user }) => { ... });
 *     },
 *   };
 */
class PluginManager {
  /**
   * @param {import('../Base/baseClient')} client
   * @param {string} pluginsDir
   */
  constructor(client, pluginsDir) {
    this.client = client;
    this.pluginsDir = pluginsDir;
    this.hooks = new EventEmitter();
    this.hooks.setMaxListeners(0);
    this.plugins = new Map();
    client.hooks = this.hooks;
  }

  async loadAll() {
    let files;
    try {
      files = (await fs.readdir(this.pluginsDir)).filter(f => f.endsWith('.js'));
    } catch {
      // No plugins directory is a perfectly normal setup — nothing to do.
      return { loaded: 0 };
    }

    for (const file of files) {
      await this._loadOne(require('path').join(this.pluginsDir, file));
    }

    Logger.info(`${this.plugins.size} Plugins Loaded`);
    return { loaded: this.plugins.size };
  }

  async _loadOne(filePath) {
    try {
      delete require.cache[require.resolve(filePath)];
      const plugin = require(filePath);

      if (!plugin || typeof plugin.name !== 'string' || !plugin.name) {
        throw new PluginError(`Plugin at ${filePath} is missing a "name" string`, { filePath });
      }
      if (this.plugins.has(plugin.name)) {
        throw new PluginError(`Duplicate plugin name "${plugin.name}"`, { filePath });
      }
      if (plugin.onLoad && typeof plugin.onLoad !== 'function') {
        throw new PluginError(`Plugin "${plugin.name}" has a non-function onLoad`, { filePath });
      }

      if (plugin.onLoad) await plugin.onLoad(this.client);
      this.plugins.set(plugin.name, plugin);
    } catch (err) {
      Logger.error(`Failed to load plugin ${filePath}: ${err.message}`);
    }
  }
}

module.exports = PluginManager;
