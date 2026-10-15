
const { Collection } = require('discord.js');
const cooldown = require('../src/functions/cooldown');

function makeInteraction({
  cmdName = 'ping',
  cooldownMs = 5000,
  userId = 'user-1',
} = {}) {
  const client = { cooldowns: new Collection() };

  return {
    client,
    user: { id: userId },
    cmd: { name: cmdName, cooldown: cooldownMs },
  };
}

describe('cooldown()', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns false the first time a user runs a command', () => {
    const { client, user, cmd } = makeInteraction();

    expect(cooldown({ client, user }, cmd)).toBe(false);
  });

  it('returns the remaining seconds within the cooldown window', () => {
    const { client, user, cmd } = makeInteraction({ cooldownMs: 10000 });

    cooldown({ client, user }, cmd);

    const result = cooldown({ client, user }, cmd);

    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(10);
  });

  it('tracks separate users independently', () => {
    const { client, cmd } = makeInteraction({ cooldownMs: 10000 });

    expect(cooldown({ client, user: { id: 'user-1' } }, cmd)).toBe(false);
    expect(cooldown({ client, user: { id: 'user-2' } }, cmd)).toBe(false);
  });

  it('allows the command again once the cooldown has expired', () => {
    vi.useFakeTimers();

    const { client, user, cmd } = makeInteraction({ cooldownMs: 5000 });

    expect(cooldown({ client, user }, cmd)).toBe(false);

    vi.advanceTimersByTime(5001);

    expect(cooldown({ client, user }, cmd)).toBe(false);
  });

  it('returns undefined when called without an interaction or command', () => {
    expect(cooldown(null, { name: 'x', cooldown: 1000 })).toBeUndefined();
    expect(cooldown({ client: {}, user: { id: 'user-1' } }, null)).toBeUndefined();
  });
});
