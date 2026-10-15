import fs from 'fs/promises';
import path from 'path';
// @ts-ignore - ascii-table ships no types
import AsciiTable from 'ascii-table';
import chalk from 'chalk';
import { LoaderError, ValidationError } from './errors';
import { Logger } from './logger';
import type { NexusClient } from '../types/client';
import type { LoadResult, BaseLoaderOptions } from '../types/loader';
export type { LoadResult, BaseLoaderOptions } from '../types/loader';

/**
 * Shared behaviour for every loader in the framework (commands, events,
 * components, functions). Concrete loaders only implement `validate()` and
 * `onLoad()` — everything else (recursive scan, parallel require, hot-reload
 * bookkeeping, table/summary printing, error isolation) lives here once.
 */
export abstract class BaseLoader<T = unknown> {
  protected client: NexusClient;
  protected name: string;
  protected dir: string;
  protected tableHeadings: string[];

  constructor(client: NexusClient, opts: BaseLoaderOptions) {
    this.client = client;
    this.name = opts.name;
    this.dir = opts.dir;
    this.tableHeadings = opts.tableHeadings || ['File', 'Status'];
  }

  /** Throw ValidationError if `mod` is malformed. */
  abstract validate(mod: T, filePath: string): void;

  /** Register a validated module on the client. Return extra table columns. */
  abstract onLoad(mod: T, filePath: string): string[] | void;

  /** Return true to include this file in the scan. Handles both dev (.ts via tsx) and built (.js) runs. */
  shouldInclude(filePath: string): boolean {
    return (filePath.endsWith('.ts') || filePath.endsWith('.js')) && !filePath.endsWith('.d.ts');
  }

  private async walk(dir: string, results: string[] = []): Promise<string[]> {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (err) {
      throw new LoaderError(`Cannot read directory: ${dir}`, { cause: (err as Error).message });
    }

    await Promise.all(
      entries.map(async entry => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await this.walk(fullPath, results);
        } else if (this.shouldInclude(fullPath)) {
          results.push(fullPath);
        }
      })
    );
    return results;
  }

  private clearCache(filePath: string) {
    const resolved = require.resolve(filePath);
    delete require.cache[resolved];
  }

  /**
   * Loads every matching file under `dir` in parallel. A single bad file
   * (syntax error, failed validation, throwing top-level code) is isolated
   * and reported — it never aborts the rest of the batch.
   */
  async load(): Promise<LoadResult<T>> {
    const files = await this.walk(this.dir);
    const table = new AsciiTable(this.name);
    table.setHeading(...this.tableHeadings);
    table.setBorder('║', '═', '✥', '🌟');

    const outcomes = await Promise.allSettled(
      files.map(async filePath => {
        this.clearCache(filePath);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const required = require(filePath);
        const mod: T = required?.default ?? required;
        this.validate(mod, filePath);

        const wasAlreadyLoaded = this.client.statuses.has(filePath);
        this.client.statuses.set(filePath, true);
        const row = this.onLoad(mod, filePath) || [];
        return {
          filePath,
          status: (wasAlreadyLoaded ? 'Reloaded' : 'Loaded') as 'Loaded' | 'Reloaded',
          row,
        };
      })
    );

    let loaded = 0;
    let failed = 0;
    const results: LoadResult<T>['results'] = [];

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
        table.addRow(path.basename(filePath), ...Array(Math.max(this.tableHeadings.length - 2, 0)).fill(chalk.red('❌')), chalk.red('❌'));
        Logger.error(`Failed to load ${filePath}: ${isKnown ? err.message : err?.stack || err?.message || err}`);
      }
    }

    const summary = failed === 0 ? 'Loaded' : `Loaded (${failed} failed)`;
    (loaded > 0 ? Logger.info : Logger.warn)(`${loaded} ${this.name} ${summary}`);
    this.client.hooks.emit('loaderComplete', { name: this.name, loaded, failed });

    return { loaded, failed, results };
  }
}
