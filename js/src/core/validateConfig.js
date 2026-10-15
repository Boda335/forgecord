'use strict';
const { ConfigError } = require('./errors');

// Values config.js falls back to when the matching env var isn't set —
// treated the same as "missing" so a copy-pasted, never-edited .env fails
// loudly instead of discord.js rejecting the token after everything else
// has already loaded.
const PLACEHOLDERS = new Set(['BOT_TOKEN', 'CLIENT_ID', 'BOT_PREFIX']);

/**
 * Checks `config` for problems that would make the bot unable to start, and
 * throws a single ConfigError listing all of them if any are found.
 *
 * Deliberately runs BEFORE plugins/commands/events load and BEFORE
 * `client.login()` — a bad token used to only surface after the full
 * startup sequence (tables, plugin loading, ~seconds of work) via a fairly
 * generic discord.js auth error. Catching it here means the failure is
 * instant and points at exactly what's wrong.
 *
 * @param {Record<string, any>} config
 * @throws {ConfigError}
 */
function validateConfig(config) {
  const problems = [];

  if (!config.TOKEN || PLACEHOLDERS.has(config.TOKEN)) {
    problems.push('TOKEN is missing. Set TOKEN=<your bot token> in .env (create one at https://discord.com/developers/applications → your app → Bot → Reset Token).');
  }

  if (config.ID && !PLACEHOLDERS.has(config.ID) && !/^\d{15,25}$/.test(String(config.ID))) {
    problems.push(`ID ("${config.ID}") doesn't look like a Discord application/client ID (expected a 15-25 digit snowflake).`);
  }

  if (problems.length > 0) {
    throw new ConfigError(`Cannot start — invalid configuration:\n  - ${problems.join('\n  - ')}`);
  }
}

module.exports = validateConfig;
