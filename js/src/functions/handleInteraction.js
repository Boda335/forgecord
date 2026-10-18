'use strict';
const { Logger } = require('../core/logger');

/**
 * Looks up the matching component handler in `client.ComponentsAction`
 * (populated once at startup/hot-reload by ComponentsLoader) instead of
 * re-scanning and re-`require()`-ing every file in ComponentsAction on every
 * single button click, which is what the previous version did. That was a
 * real perf hit under any real traffic (disk I/O + module resolution on the
 * hot path) and is now O(1) Collection lookups.
 *
 * @param {import('../handlers/Nexus.js')} client
 * @param {import('discord.js').Interaction} interaction
 * @param {string[]} parts
 */
async function handleInteraction(client, interaction, parts) {
  if (!interaction.customId) {
    Logger.warn('Interaction has no customId.');
    return;
  }

  const segments = parts || interaction.customId.split('_');

  const handler = client.ComponentsAction.get(interaction.customId) || client.ComponentsAction.find(h => h.customId && h.customId === interaction.customId) || null;

  if (!handler || handler.enabled === false) return;

  if (handler.userPermissions?.length && (!interaction.inGuild() || !interaction.memberPermissions?.has(handler.userPermissions))) {
    return interaction.reply({
      content: `🚫 You need \`${handler.userPermissions.join(', ')}\` to use this interaction.`,
      ephemeral: true,
    });
  }

  if (handler.botPermissions?.length && (!interaction.guild || !interaction.guild.members.me?.permissions.has(handler.botPermissions))) {
    return interaction.reply({
      content: `🤖 I need \`${handler.botPermissions.join(', ')}\` to perform this action.`,
      ephemeral: true,
    });
  }

  await client.errorHandler.safeExecute(() => handler.action(client, interaction, segments), {
    kind: 'component',
    name: handler.name,
    interaction,
  });
}

module.exports = handleInteraction;
