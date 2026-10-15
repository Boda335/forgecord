import { describe, it, expect } from 'vitest';
import { CommandLoader } from '../src/handlers/CommandLoader';
import { ValidationError } from '../src/core/errors';
import type { NexusClient } from '../src/Base/baseClient';
import type { CommandData } from '../src/Base/baseCommand';

function makeLoader(): CommandLoader {
  // validate() never touches the client, so an empty stub is enough.
  return new CommandLoader({} as NexusClient);
}

describe('CommandLoader.validate()', () => {
  it('accepts a well-formed command', () => {
    const loader = makeLoader();
    const cmd = { name: 'ping', interactionExecute: async () => {} } as CommandData;
    expect(() => loader.validate(cmd, 'ping.ts')).not.toThrow();
  });

  it('rejects a command with no name', () => {
    const loader = makeLoader();
    const cmd = { interactionExecute: async () => {} } as CommandData;
    expect(() => loader.validate(cmd, 'bad.ts')).toThrow(ValidationError);
  });

  it('rejects a command with neither interactionExecute nor msgExecute', () => {
    const loader = makeLoader();
    const cmd = { name: 'ping' } as CommandData;
    expect(() => loader.validate(cmd, 'bad.ts')).toThrow(ValidationError);
  });

  it('rejects a command whose aliases are not an array', () => {
    const loader = makeLoader();
    const cmd = { name: 'ping', msgExecute: async () => {}, command: { enabled: true, aliases: 'p' as any } } as CommandData;
    expect(() => loader.validate(cmd, 'bad.ts')).toThrow(ValidationError);
  });
});
