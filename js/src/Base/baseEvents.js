const baseClient = require('@base/baseClient');

/**
 * @template {keyof import('discord.js').ClientEvents} K
 * @typedef {Object} BaseEvent
 * @property {K} name - Event name
 * @property {string} target - Event target (e.g., 'client', 'distube', etc.)
 * @property {boolean} once - Whether the listener should be called only once
 * @property {(client: baseClient,...args: import('discord.js').ClientEvents[K]) => import('discord.js').Awaitable<void>} execute - listener Function
 */

/** @type {BaseEvent} */
module.exports = {
  name: '',
  target: '',
  once: false,
  async execute(client, ...args) {},
};
