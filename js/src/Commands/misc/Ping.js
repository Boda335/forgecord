const { ApplicationCommandType, MessageFlags } = require('discord.js');
const i18nManager = require('@base/i18n.js');
/**
 * @type {import("../../Base/baseCommand")}
 */
module.exports = {
  name: 'ping',
  description: 'Ping the bot and get the current latency',
  cooldown: 10,
  category: 'misc',
  botPermissions: ['SendMessages'],
  userPermissions: ['SendMessages'],
  options: [],
  type: ApplicationCommandType.ChatInput,
  command: {
    enabled: true,
    aliases: ['p', 'latency'],
    minArgsCount: 0,
  },
  slashCommand: {
    enabled: true,
  },

  async msgExecute(client, message) {
    const i18n = await i18nManager.getForUser(message.author.id);
    await message.reply({ content: i18n.t('ping.pong', { ping: client.ws.ping }) });
  },

  async interactionExecute(client, interaction) {
    const i18n = await i18nManager.getForUser(interaction.user.id);
    await interaction.reply({
      content: i18n.t('ping.pong', { ping: client.ws.ping }),
      flags: MessageFlags.Ephemeral,
    });
  },

  autocompleteExecute: (client, interaction) => {},
};
