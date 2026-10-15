import path from 'path';
import { describe, it, expect, vi } from 'vitest';
import { PluginManager } from '../src/core/PluginManager';
import type { NexusClient } from '../src/Base/baseClient';

function makeClient() {
  return { logger: { info: vi.fn(), error: vi.fn() }, hooks: undefined } as unknown as NexusClient & { _trackerLoaded?: boolean };
}

describe('PluginManager', () => {
  it('returns { loaded: 0 } when the plugins directory does not exist', async () => {
    const client = makeClient();
    const manager = new PluginManager(client, path.join(__dirname, 'fixtures', 'does-not-exist'));
    const result = await manager.loadAll();
    expect(result).toEqual({ loaded: 0 });
  });

  it('loads a well-formed plugin and runs its onLoad with the client', async () => {
    const client = makeClient();
    const manager = new PluginManager(client, path.join(__dirname, 'fixtures', 'plugins-good'));
    const result = await manager.loadAll();

    expect(result.loaded).toBe(1);
    expect(client._trackerLoaded).toBe(true);
    expect(manager.plugins.has('tracker')).toBe(true);
  });

  it('sets client.hooks to a shared EventEmitter before loading', async () => {
    const client = makeClient();
    const manager = new PluginManager(client, path.join(__dirname, 'fixtures', 'plugins-good'));
    expect(client.hooks).toBe(manager.hooks);
    await manager.loadAll();
    expect(client.hooks).toBe(manager.hooks);
  });

  it('logs and skips a plugin with no name, without throwing', async () => {
    const client = makeClient();
    const manager = new PluginManager(client, path.join(__dirname, 'fixtures', 'plugins-bad'));
    const result = await manager.loadAll();

    expect(result.loaded).toBe(0);
    expect(client.logger.error).toHaveBeenCalled();
    const messages = (client.logger.error as any).mock.calls.map((call: any[]) => call.join(' '));
    expect(messages.some((m: string) => m.includes('missing a "name"'))).toBe(true);
    expect(messages.some((m: string) => m.includes('setup failed'))).toBe(true);
  });

  it('rejects the second plugin when two files declare the same name', async () => {
    const client = makeClient();
    const manager = new PluginManager(client, path.join(__dirname, 'fixtures', 'plugins-dup'));
    const result = await manager.loadAll();

    expect(result.loaded).toBe(1);
    expect(manager.plugins.size).toBe(1);
  });
});