'use strict';
const reloadCommands = require('./CommandLoader');
const reloadFunctions = require('./FunctionsLoader');
const reloadInteractions = require('./ComponentsLoader');

/**
 * Runs every loader in parallel (they're fully independent of each other)
 * instead of the previous sequential await-chain, and never throws — a
 * failure in one loader no longer prevents the others from finishing.
 * @param {import('./Nexus')} client
 */
async function reloadAll(client) {
  const [commands, functions, interactions] = await Promise.all([reloadCommands(client), reloadFunctions(client), reloadInteractions(client)]);

  return {
    commands: { loaded: commands.loaded, failed: commands.failed },
    functions: { loaded: functions.loaded, failed: functions.failed },
    interactions: { loaded: interactions.loaded, failed: interactions.failed },
  };
}

module.exports = reloadAll;
