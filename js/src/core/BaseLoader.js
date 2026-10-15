'use strict';
const { Logger } = require('./logger');
const fs = require('fs/promises');
const path = require('path');
const AsciiTable = require('ascii-table');
const chalk = require('chalk').default;
const { LoaderError, ValidationError } = require('./errors');

/**
 * Shared behaviour for every loader in the framework (commands, events,
 * components, functions). Concrete loaders only implement `validate()` and
 * `onLoad()` — everything else (recursive scan, parallel require, hot-reload
 * bookkeeping, table/summary printing, error isolation) lives here once.
 *
 * Why this exists: the old CommandLoader/EventsLoader/ComponentsLoader/
 * FunctionsLoader each re-implemented directory walking with sync fs calls,
 * had no shared validation, and a bug fixed in one had to be fixed three more
 * times in the others. This collapses all four into ~20 lines of subclass code.
 */
class BaseLoader {
  /**
   * @param {import('../Base/baseClient')} client
   * @param {Object} opts
   * @param {string} opts.name - human label used in logs/tables, e.g. "Commands"
   * @param {string} opts.dir - absolute directory to scan
   * @param {string} [opts.tableHeadings] - AsciiTable column headings
   */
  constructor(client, { name, dir, tableHeadings }) {
    this.client = client;
    this.name = name;
    this.dir = dir;
    this.tableHeadings = tableHeadings || ['File', 'Status'];
  }

  /** Override: throw ValidationError if `mod` is malformed. Return void if valid. */
  // eslint-disable-next-line no-unused-vars
  validate(mod, filePath) {}

  /** Override: register a validated module on the client. */
  // eslint-disable-next-line no-unused-vars
  onLoad(mod, filePath) {}

  /** Override: return true to skip a directory entry entirely (e.g. non-.js files). */
  shouldInclude(filePath) {
    return filePath.endsWith('.js');
  }

  async _walk(dir, results = []) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (err) {
      throw new LoaderError(`Cannot read directory: ${dir}`, { cause: err.message });
    }

    await Promise.all(
      entries.map(async entry => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await this._walk(fullPath, results);
        } else if (this.shouldInclude(fullPath)) {
          results.push(fullPath);
        }
      })
    );
    return results;
  }

  _clearCache(filePath) {
    const resolved = require.resolve(filePath);
    delete require.cache[resolved];
  }

  /**
   * Loads every matching file under `dir` in parallel. A single bad file
   * (syntax error, failed validation, throwing top-level code) is isolated
   * and reported — it never aborts the rest of the batch.
   * @returns {Promise<{loaded: number, failed: number, results: Array}>}
   */
  async load() {
    const files = await this._walk(this.dir);
    const table = new AsciiTable(this.name);
    table.setHeading(...this.tableHeadings);
    table.setBorder('║', '═', '✥', '🌟');

    const outcomes = await Promise.allSettled(
      files.map(async filePath => {
        this._clearCache(filePath);
        const mod = require(filePath);
        this.validate(mod, filePath);
        const wasAlreadyLoaded = this.client.statuses.has(filePath);
        this.client.statuses.set(filePath, true);
        const row = this.onLoad(mod, filePath) || [];
        return {
          filePath,
          status: wasAlreadyLoaded ? 'Reloaded' : 'Loaded',
          row,
        };
      })
    );

    let loaded = 0;
    let failed = 0;
    const results = [];

    for (let i = 0; i < outcomes.length; i++) {
      const outcome = outcomes[i];
      const filePath = files[i];

      if (outcome.status === 'fulfilled') {
        loaded++;
        table.addRow(path.basename(filePath), ...outcome.value.row, outcome.value.status);
        results.push(outcome.value);
      } else {
        failed++;
        const err = outcome.reason;
        const isKnown = err instanceof ValidationError || err instanceof LoaderError;
        table.addRow(path.basename(filePath), ...Array(this.tableHeadings.length - 2).fill(chalk.red('❌')), chalk.red('❌'));
        Logger.error(`Failed to load ${filePath}: ${isKnown ? err.message : err.stack || err.message}`);
      }
    }

    const summary = failed === 0 ? 'Loaded' : `Loaded (${failed} failed)`;
    (loaded > 0 ? Logger.info : Logger.warn)(`${loaded} ${this.name} ${summary}`);
    this.client.hooks?.emit('loaderComplete', { name: this.name, loaded, failed });

    return { loaded, failed, results };
  }
}

module.exports = BaseLoader;
