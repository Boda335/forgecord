import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import { PluginError } from './errors';
import { Logger } from './logger';
import type { NexusClient } from '../types/client';
import type { HookBus, ForgecordPlugin } from '../types/plugin';
export type { HookBus, ForgecordPlugin } from '../types/plugin';


/**
 * Very small plugin system. `client.hooks` is an EventEmitter that loaders /
 * event handlers emit lifecycle events on. A plugin just listens on
 * `client.hooks` and optionally does setup work in `onLoad(client)` — no
 * core files need to change to extend the bot.
 */
export class PluginManager {
  private client: NexusClient;
  private pluginsDir: string;
  hooks: HookBus;
  plugins = new Map<string, ForgecordPlugin>();

  constructor(client: NexusClient, pluginsDir: string) {
    this.client = client;
    this.pluginsDir = pluginsDir;
    this.hooks = new EventEmitter() as HookBus;
    this.hooks.setMaxListeners(0);
    client.hooks = this.hooks;
  }

  async loadAll(): Promise<{ loaded: number }> {
    let files: string[];
    try {
      files = (await fs.readdir(this.pluginsDir)).filter(f => f.endsWith('.ts') || f.endsWith('.js'));
    } catch {
      return { loaded: 0 };
    }

    for (const file of files) {
      await this.loadOne(path.join(this.pluginsDir, file));
    }

    this.client.logger.info(`${this.plugins.size} Plugins Loaded`);
    return { loaded: this.plugins.size };
  }

  private async loadOne(filePath: string) {
    try {
      delete require.cache[require.resolve(filePath)];
      const required = require(filePath);
      const plugin: ForgecordPlugin = required?.default ?? required;

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
      this.client.logger.error(`Failed to load plugin ${filePath}: ${(err as Error).message}`);
    }
  }
}
