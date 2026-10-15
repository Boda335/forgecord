const { CommandLoader } = require('../src/handlers/CommandLoader');
const { ValidationError } = require('../src/core/errors');

function makeLoader() {
  // validate() never touches the client, so a minimal stub is enough.
  return new CommandLoader({});
}

describe('CommandLoader.validate()', () => {
  it('accepts a well-formed command', () => {
    const loader = makeLoader();
    expect(() => loader.validate({ name: 'ping', interactionExecute: async () => {} }, 'ping.js')).not.toThrow();
  });

  it('rejects a command with no name', () => {
    const loader = makeLoader();
    expect(() => loader.validate({ interactionExecute: async () => {} }, 'bad.js')).toThrow(ValidationError);
  });

  it('rejects a command with neither interactionExecute nor msgExecute', () => {
    const loader = makeLoader();
    expect(() => loader.validate({ name: 'ping' }, 'bad.js')).toThrow(ValidationError);
  });

  it('rejects a command whose aliases are not an array', () => {
    const loader = makeLoader();
    const cmd = { name: 'ping', msgExecute: async () => {}, command: { aliases: 'p' } };
    expect(() => loader.validate(cmd, 'bad.js')).toThrow(ValidationError);
  });

  it('accepts a command defined with only msgExecute', () => {
    const loader = makeLoader();
    expect(() => loader.validate({ name: 'ping', msgExecute: async () => {} }, 'ping.js')).not.toThrow();
  });
});
