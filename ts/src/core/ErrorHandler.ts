import { ForgecordError } from './errors';
import { Logger } from './logger';
import type { NexusClient } from '../types/client';
import type { ErrorHandlerOptions, SafeExecuteContext } from '../types/error-handler';
export type { ErrorHandlerOptions, SafeExecuteContext } from '../types/error-handler';

/**
 * Centralized error handling: process-level handlers (previously scattered
 * `process.on(...)` calls in bot.js), rate-limited/batched webhook reporting,
 * and `safeExecute()` — a single consistent "catch, log, tell the user
 * something went wrong" wrapper for command/component/event execution
 * instead of every file reimplementing (or forgetting) its own try/catch.
 */
export class ErrorHandler {
  private client: NexusClient;
  private webhookURL: string | null;
  private webhookIntervalMs: number;
  private webhookQueue: string[] = [];
  private webhookTimer: NodeJS.Timeout | null = null;

  constructor(client: NexusClient, opts: ErrorHandlerOptions = {}) {
    this.client = client;
    this.webhookURL = opts.webhookURL && opts.webhookURL !== 'WEBHOOK_URL' ? opts.webhookURL : null;
    this.webhookIntervalMs = opts.webhookIntervalMs ?? 5000;
  }

  attachProcessHandlers(): this {
    process.on('unhandledRejection', (reason: any) => {
      const msg = this.describeIntentIssue(reason) || `Unhandled Rejection: ${reason?.stack || reason}`;
      this.report(msg, { source: 'unhandledRejection' });
    });

    process.on('uncaughtException', (err: Error) => {
      const msg = this.describeIntentIssue(err) || `Uncaught Exception:\n${err.stack || err.message}`;
      this.report(msg, { source: 'uncaughtException' });
    });

    process.on('uncaughtExceptionMonitor', (err: Error) => {
      this.report(`Uncaught Exception (Monitor):\n${err.stack || err.message}`, { source: 'uncaughtExceptionMonitor' });
    });

    return this;
  }

  private describeIntentIssue(err: any): string | null {
    if (err?.message?.includes('Used disallowed intents')) {
      return 'Used disallowed intents. Enable the required intents in the Discord Developer Portal.';
    }
    return null;
  }

  /**
   * Runs `fn`, catching and reporting any error instead of letting it bubble
   * up as an unhandled rejection. Use this to wrap command/component/event
   * execute() calls.
   */
  async safeExecute<T>(fn: () => Promise<T> | T, context: SafeExecuteContext = {}): Promise<T | undefined> {
    try {
      return await fn();
    } catch (err) {
      const error = err as Error;
      const known = error instanceof ForgecordError;
      const label = context.name ? `${context.kind || 'handler'} "${context.name}"` : context.kind || 'handler';
      this.report(`Error in ${label}: ${error.message}${known ? '' : `\n${error.stack}`}`, context);
      this.client.hooks.emit('commandError', { error, context });
      return undefined;
    }
  }

  /** Logs to console + file, and queues a (rate-limited) webhook post. Never throws. */
  report(message: string, context: Record<string, unknown> = {}) {
    this.client.logger.error(message);
    void this.client.logger.logToFile(`${new Date().toISOString()} ${JSON.stringify(context)}\n${message}`);
    if (this.webhookURL) this.queueWebhook(message);
  }

  private queueWebhook(message: string) {
    this.webhookQueue.push(message);
    if (this.webhookTimer) return;
    this.webhookTimer = setTimeout(() => this.flushWebhook(), this.webhookIntervalMs);
  }

  private async flushWebhook() {
    this.webhookTimer = null;
    const batch = this.webhookQueue.splice(0, this.webhookQueue.length);
    if (batch.length === 0) return;

    const description = batch.join('\n---\n').slice(0, 3900);
    try {
      await fetch(this.webhookURL as string, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [
            {
              title: `Error Notification${batch.length > 1 ? ` (${batch.length} errors batched)` : ''}`,
              description: '```' + description + '```',
              color: 0xff0000,
              timestamp: new Date().toISOString(),
              footer: { text: 'Forgecord Error Logger' },
            },
          ],
        }),
      });
    } catch (err) {
      Logger.error('Failed to deliver error webhook:', (err as Error).message);
    }
  }
}
