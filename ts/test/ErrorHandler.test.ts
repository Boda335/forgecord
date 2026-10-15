import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorHandler } from '../src/core/ErrorHandler';
import { ValidationError } from '../src/core/errors';
import type { NexusClient } from '../src/Base/baseClient';

function makeClient() {
  return {
    logger: { error: vi.fn(), logToFile: vi.fn().mockResolvedValue(null) },
    hooks: { emit: vi.fn() },
  } as unknown as NexusClient;
}

describe('ErrorHandler.safeExecute()', () => {
  it('returns the value on success and never reports', async () => {
    const client = makeClient();
    const handler = new ErrorHandler(client);
    const result = await handler.safeExecute(async () => 42, { kind: 'command', name: 'ping' });
    expect(result).toBe(42);
    expect(client.logger.error).not.toHaveBeenCalled();
  });

  it('catches a thrown error, logs it, and returns undefined instead of throwing', async () => {
    const client = makeClient();
    const handler = new ErrorHandler(client);
    const result = await handler.safeExecute(async () => {
      throw new Error('boom');
    }, { kind: 'command', name: 'ping' });

    expect(result).toBeUndefined();
    expect(client.logger.error).toHaveBeenCalledTimes(1);
    expect(client.hooks.emit).toHaveBeenCalledWith('commandError', expect.objectContaining({ context: { kind: 'command', name: 'ping' } }));
  });

  it('includes the stack trace for unknown errors but not for known ForgecordErrors', async () => {
    const client = makeClient();
    const handler = new ErrorHandler(client);

    await handler.safeExecute(async () => {
      throw new ValidationError('bad shape');
    }, { kind: 'command', name: 'a' });
    const knownCallMsg = (client.logger.error as any).mock.calls[0][0] as string;
    expect(knownCallMsg).toContain('bad shape');

    (client.logger.error as any).mockClear();
    await handler.safeExecute(async () => {
      throw new Error('unexpected');
    }, { kind: 'command', name: 'b' });
    const unknownCallMsg = (client.logger.error as any).mock.calls[0][0] as string;
    expect(unknownCallMsg).toContain('unexpected');
    expect(unknownCallMsg).toMatch(/at /);
  });
});

describe('ErrorHandler webhook batching', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (global as any).fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (global as any).fetch;
  });

  it('does not call fetch when no webhookURL is configured', () => {
    const client = makeClient();
    const handler = new ErrorHandler(client, {});
    handler.report('oops');
    vi.advanceTimersByTime(10000);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('treats the untouched WEBHOOK_URL placeholder as "not configured"', () => {
    const client = makeClient();
    const handler = new ErrorHandler(client, { webhookURL: 'WEBHOOK_URL' });
    handler.report('oops');
    vi.advanceTimersByTime(10000);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('batches multiple errors reported within the interval into a single request', async () => {
    const client = makeClient();
    const handler = new ErrorHandler(client, { webhookURL: 'https://discord.com/api/webhooks/x/y', webhookIntervalMs: 5000 });

    handler.report('error one');
    handler.report('error two');
    handler.report('error three');
    expect(global.fetch).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(5000);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse((global.fetch as any).mock.calls[0][1].body);
    expect(body.embeds[0].description).toContain('error one');
    expect(body.embeds[0].description).toContain('error three');
    expect(body.embeds[0].title).toContain('3 errors batched');
  });

  it('a failed webhook delivery never throws or breaks subsequent batches', async () => {
    (global as any).fetch = vi.fn().mockRejectedValue(new Error('network down'));
    const client = makeClient();
    const handler = new ErrorHandler(client, { webhookURL: 'https://discord.com/api/webhooks/x/y', webhookIntervalMs: 1000 });

    handler.report('first batch error');
    await expect(vi.advanceTimersByTimeAsync(1000)).resolves.not.toThrow();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});