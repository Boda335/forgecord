const path = require('path');
const PluginManager = require('../src/core/PluginManager');
const { Logger } = require('../src/core/logger');

beforeEach(() => {
  vi.spyOn(Logger, 'info').mockImplementation(() => {});
  vi.spyOn(Logger, 'error').mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

function makeClient() {
  return { hooks: null };
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

    // plugins-bad has 2 files: one missing a name, one whose onLoad throws — neither should register.
    expect(result.loaded).toBe(0);
    expect(Logger.error).toHaveBeenCalled();
    const messages = Logger.error.mock.calls.map(call => call.join(' '));
    expect(messages.some(m => m.includes('missing a "name"'))).toBe(true);
    expect(messages.some(m => m.includes('setup failed'))).toBe(true);
  });

  it('rejects the second plugin when two files declare the same name', async () => {
    const client = makeClient();
    const manager = new PluginManager(client, path.join(__dirname, 'fixtures', 'plugins-dup'));
    const result = await manager.loadAll();

    expect(result.loaded).toBe(1);
    expect(manager.plugins.size).toBe(1);
  });
});
