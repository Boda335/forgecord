import { describe, it, expect, vi } from 'vitest';
import { Collection } from 'discord.js';
import cooldown from '../src/functions/cooldown';
import type { NexusClient } from '../src/Base/baseClient';
import type { CommandData } from '../src/Base/baseCommand';

function makeClient(): NexusClient {
  return { cooldowns: new Collection() } as unknown as NexusClient;
}

function makeCommand(overrides: Partial<CommandData> = {}): CommandData {
  return { name: 'ping', cooldown: 5, ...overrides } as CommandData;
}

describe('cooldown()', () => {
  it('returns false the first time a user runs a command', () => {
    const client = makeClient();
    const result = cooldown(client, { member: { id: 'user-1' } }, makeCommand());
    expect(result).toBe(false);
  });

  it('returns the remaining seconds on a second call within the cooldown window', () => {
    const client = makeClient();
    const cmd = makeCommand({ cooldown: 10 });
    const source = { member: { id: 'user-1' } };

    cooldown(client, source, cmd);
    const result = cooldown(client, source, cmd);

    expect(typeof result).toBe('number');
    expect(result as number).toBeGreaterThan(0);
    expect(result as number).toBeLessThanOrEqual(10);
  });

  it('tracks separate users independently', () => {
    const client = makeClient();
    const cmd = makeCommand({ cooldown: 10 });

    expect(cooldown(client, { member: { id: 'user-1' } }, cmd)).toBe(false);
    expect(cooldown(client, { member: { id: 'user-2' } }, cmd)).toBe(false);
  });

  it('resolves the user id from member.user.id for API-shaped interaction members', () => {
    const client = makeClient();
    const cmd = makeCommand({ cooldown: 10 });
    const source = { member: { user: { id: 'user-3' } } };

    expect(cooldown(client, source, cmd)).toBe(false);
    const second = cooldown(client, source, cmd);
    expect(second).not.toBe(false);
  });

  it('allows the command again once the cooldown has expired', () => {
    vi.useFakeTimers();
    const client = makeClient();
    const cmd = makeCommand({ cooldown: 5 });
    const source = { member: { id: 'user-1' } };

    cooldown(client, source, cmd);
    vi.advanceTimersByTime(5001);

    expect(cooldown(client, source, cmd)).toBe(false);
    vi.useRealTimers();
  });
});
