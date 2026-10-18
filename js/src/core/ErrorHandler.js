'use strict';
const { ForgecordError } = require('./errors');
const { Logger } = require('./logger');

/**
 * Everything error-related used to live scattered across bot.js
 * (process.on handlers) and duplicated try/catch blocks inside
 * interactionCreate.js / messageCreate.js. Centralizing it here means:
 *  - one place controls whether errors go to a file / webhook / both
 *  - webhook spam is rate-limited (the old code fired one HTTP request per
 *    error with no backoff, which itself can crash a bot during an incident)
 *  - `safeExecute` gives commands/components/functions a single consistent
 *    "catch, log, tell the user something went wrong" behaviour instead of
 *    every file reimplementing (or forgetting) its own try/catch.
 */
class ErrorHandler {
  /**
   * @param {import('../Base/baseClient')} client
   * @param {Object} opts
   * @param {boolean} [opts.fileLoggingEnabled]
   * @param {string} [opts.webhookURL]
   * @param {number} [opts.webhookIntervalMs] - minimum gap between webhook posts
   */
  constructor(client, { fileLoggingEnabled = false, webhookURL = null, webhookIntervalMs = 5000 } = {}) {
    this.client = client;
    this.fileLoggingEnabled = fileLoggingEnabled;
    this.webhookURL = webhookURL && webhookURL !== 'WEBHOOK_URL' ? webhookURL : null;
    this.webhookIntervalMs = webhookIntervalMs;
    this._webhookQueue = [];
    this._webhookTimer = null;
  }

  attachProcessHandlers() {
    process.on('unhandledRejection', (reason, promise) => {
      const msg = this._describeIntentIssue(reason) || `Unhandled Rejection: ${reason?.stack || reason}`;
      this.report(msg, { source: 'unhandledRejection' });
    });

    process.on('uncaughtException', err => {
      const msg = this._describeIntentIssue(err) || `Uncaught Exception:\n${err.stack || err.message}`;
      this.report(msg, { source: 'uncaughtException' });
    });

    process.on('uncaughtExceptionMonitor', err => {
      this.report(`Uncaught Exception (Monitor):\n${err.stack || err.message}`, { source: 'uncaughtExceptionMonitor' });
    });

    return this;
  }

  _describeIntentIssue(err) {
    if (err?.message?.includes('Used disallowed intents')) {
      return 'Used disallowed intents. Enable the required intents in the Discord Developer Portal.';
    }
    return null;
  }

  /**
   * Runs `fn`, catching and reporting any error instead of letting it bubble
   * up as an unhandled rejection. Use this to wrap command/component/event
   * execute() calls.
   * @template T
   * @param {() => Promise<T>} fn
   * @param {Object} context - e.g. { kind: 'command', name: 'ping', userId }
   * @returns {Promise<T|undefined>}
   */
  async safeExecute(fn, context = {}) {
    try {
      return await fn();
    } catch (err) {
      const known = err instanceof ForgecordError;
      const label = context.name ? `${context.kind || 'handler'} "${context.name}"` : context.kind || 'handler';
      this.report(`Error in ${label}: ${err.message}${known ? '' : `\n${err.stack}`}`, context);
      this.client.hooks?.emit('commandError', { error: err, context });
      const interaction = context.interaction;
      if (interaction && !interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({
            content: 'Something went wrong while processing your request. Please try again later.',
            flags: require('discord.js').MessageFlags.Ephemeral,
          });
        } catch (replyError) {
          Logger.warn('Could not send the interaction error response:', replyError.message);
        }
      }
      return undefined;
    }
  }

  /** Logs to console + file, and queues a (rate-limited) webhook post. Never throws. */
  report(message, context = {}) {
    Logger.error(message, context);
    if (this.webhookURL) this._queueWebhook(message);
  }

  _queueWebhook(message) {
    this._webhookQueue.push(message);
    if (this._webhookTimer) return;
    this._webhookTimer = setTimeout(() => this._flushWebhook(), this.webhookIntervalMs);
  }

  async _flushWebhook() {
    this._webhookTimer = null;
    const batch = this._webhookQueue.splice(0, this._webhookQueue.length);
    if (batch.length === 0) return;

    const description = batch.join('\n---\n').slice(0, 3900);
    try {
      await fetch(this.webhookURL, {
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
      // Don't recurse into report() here — that could loop if the webhook
      // itself is the thing failing.
      Logger.error('Failed to deliver error webhook:', err.message);
    }
  }
}

module.exports = ErrorHandler;
