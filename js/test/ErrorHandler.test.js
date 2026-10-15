const ErrorHandler = require('../src/core/ErrorHandler');
const { ValidationError } = require('../src/core/errors');
const { Logger } = require('../src/core/logger');

function makeClient() {
  return {
    hooks: { emit: vi.fn() },
  };
}

beforeEach(() => {
  vi.spyOn(Logger, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ErrorHandler.safeExecute()', () => {
  it('returns the value on success and never reports', async () => {
    const client = makeClient();
    const handler = new ErrorHandler(client);
    const result = await handler.safeExecute(async () => 42, { kind: 'command', name: 'ping' });
    expect(result).toBe(42);
    expect(Logger.error).not.toHaveBeenCalled();
  });

  it('catches a thrown error, logs it, and returns undefined instead of throwing', async () => {
    const client = makeClient();
    const handler = new ErrorHandler(client);
    const result = await handler.safeExecute(
      async () => {
        throw new Error('boom');
      },
      { kind: 'command', name: 'ping' }
    );

    expect(result).toBeUndefined();
    expect(Logger.error).toHaveBeenCalledTimes(1);
    expect(client.hooks.emit).toHaveBeenCalledWith('commandError', expect.objectContaining({ context: { kind: 'command', name: 'ping' } }));
  });

  it('includes the stack trace for unknown errors but not for known ForgecordErrors', async () => {
    const client = makeClient();
    const handler = new ErrorHandler(client);

    await handler.safeExecute(
      async () => {
        throw new ValidationError('bad shape');
      },
      { kind: 'command', name: 'a' }
    );
    const knownCallMsg = Logger.error.mock.calls[0][0];
    expect(knownCallMsg).toContain('bad shape');

    Logger.error.mockClear();
    await handler.safeExecute(
      async () => {
        throw new Error('unexpected');
      },
      { kind: 'command', name: 'b' }
    );
    const unknownCallMsg = Logger.error.mock.calls[0][0];
    expect(unknownCallMsg).toContain('unexpected');
    expect(unknownCallMsg).toMatch(/at /); // stack trace present
  });
});

describe('ErrorHandler webhook batching', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    delete global.fetch;
  });

  it('does not call fetch when no webhookURL is configured', () => {
    const client = makeClient();
    const handler = new ErrorHandler(client, { webhookURL: null });
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
    expect(global.fetch).not.toHaveBeenCalled(); // not flushed yet

    await vi.advanceTimersByTimeAsync(5000);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.embeds[0].description).toContain('error one');
    expect(body.embeds[0].description).toContain('error three');
    expect(body.embeds[0].title).toContain('3 errors batched');
  });

  it('a failed webhook delivery never throws or breaks subsequent batches', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network down'));
    const client = makeClient();
    const handler = new ErrorHandler(client, { webhookURL: 'https://discord.com/api/webhooks/x/y', webhookIntervalMs: 1000 });

    handler.report('first batch error');
    await expect(vi.advanceTimersByTimeAsync(1000)).resolves.not.toThrow();
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
