'use strict';
const BaseLoader = require('../core/BaseLoader');
const { ValidationError } = require('../core/errors');
const { COMMANDS_DIR } = require('../core/paths');
const path = require('path');

class CommandLoader extends BaseLoader {
  constructor(client) {
    super(client, {
      name: 'Commands',
      dir: COMMANDS_DIR,
      tableHeadings: ['Command File', 'Category', 'isPrefix', 'isSlash', 'Status'],
    });
  }

  validate(command, filePath) {
    if (!command || typeof command !== 'object') {
      throw new ValidationError('Command export must be an object', { filePath });
    }
    if (!command.name || typeof command.name !== 'string') {
      throw new ValidationError('Command is missing a valid "name" string', { filePath });
    }
    if (typeof command.interactionExecute !== 'function' && typeof command.msgExecute !== 'function') {
      throw new ValidationError(`Command "${command.name}" must define at least one of interactionExecute()/msgExecute()`, { filePath });
    }
    if (command.command?.aliases && !Array.isArray(command.command.aliases)) {
      throw new ValidationError(`Command "${command.name}" aliases must be an array`, { filePath });
    }
  }

  onLoad(command, filePath) {
    this.client.commands.set(command.name, command);

    if (Array.isArray(command.command?.aliases)) {
      for (const alias of command.command.aliases) this.client.aliases.set(alias, command.name);
    }

    const category = filePath.split(path.sep).slice(-2, -1)[0];
    const isPrefix = command.command?.enabled ? '✅' : '❌';
    const isSlash = command.slashCommand?.enabled ? '✅' : '❌';

    return [category, isPrefix, isSlash];
  }

  async load() {
    this.client.commands.clear();
    this.client.aliases.clear();
    return super.load();
  }
}

/**
 * @param {import('./Nexus')} client
 */
const load = client => new CommandLoader(client).load();
load.CommandLoader = CommandLoader;
module.exports = load;
