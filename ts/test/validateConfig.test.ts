import { describe, it, expect } from 'vitest';
import { validateConfig } from '../src/core/validateConfig';
import { ConfigError } from '../src/core/errors';

describe('validateConfig()', () => {
  it('accepts a config with a real-looking token', () => {
    expect(() => validateConfig({ TOKEN: 'a.real.token', ID: '123456789012345678' })).not.toThrow();
  });

  it('rejects a missing token', () => {
    expect(() => validateConfig({ TOKEN: '', ID: 'CLIENT_ID' })).toThrow(ConfigError);
  });

  it('rejects the untouched placeholder token', () => {
    expect(() => validateConfig({ TOKEN: 'BOT_TOKEN', ID: 'CLIENT_ID' })).toThrow(ConfigError);
  });

  it('lists all problems in one error, not just the first', () => {
    try {
      validateConfig({ TOKEN: '', ID: 'not-a-snowflake' });
      throw new Error('expected validateConfig to throw');
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      expect((err as Error).message).toMatch(/TOKEN is missing/);
      expect((err as Error).message).toMatch(/doesn't look like a Discord/);
    }
  });

  it('does not flag ID when it is a plausible snowflake', () => {
    expect(() => validateConfig({ TOKEN: 'a.real.token', ID: '1344065394368839701' })).not.toThrow();
  });

  it('does not flag a missing/placeholder ID on its own (not required to start)', () => {
    expect(() => validateConfig({ TOKEN: 'a.real.token', ID: 'CLIENT_ID' })).not.toThrow();
  });
});
