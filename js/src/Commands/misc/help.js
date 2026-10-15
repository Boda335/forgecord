const { ApplicationCommandType } = require('discord.js');
const { Logger } = require('../../core/logger');
const i18nManager = require('@base/i18n.js');

/**
 * @type {import("../../Base/baseCommand")}
 */
module.exports = {
  name: 'help',
  description: 'Get help with the bot commands',
  cooldown: 10,
  category: 'misc',
  botPermissions: ['SendMessages'],
  userPermissions: ['SendMessages'],
  options: [],
  type: ApplicationCommandType.ChatInput,
  command: {
    enabled: true,
    aliases: ['helpme', 'commands', 'cmd'],
    minArgsCount: 0,
  },
  slashCommand: {
    enabled: true,
  },

  async msgExecute(client, message) {
    const i18n = await i18nManager.getForUser(message.author.id);
    try {
      client.handleHelpSystem(message);
    } catch (error) {
      Logger.error(`An error occurred while executing the help command: ${error.message}`);
      message.reply({
        content: i18n.t('help.error', { error: error.message }),
      });
    }
  },

  async interactionExecute(client, interaction) {
    const i18n = await i18nManager.getForUser(interaction.user.id);
    try {
      client.handleHelpSystem(interaction);
    } catch (error) {
      Logger.error(`An error occurred while executing the help command: ${error.message}`);
      interaction.reply({
        content: i18n.t('help.error', { error: error.message }),
        flags: require('discord.js').MessageFlags.Ephemeral,
      });
    }
  },

  async autocompleteExecute(client, interaction) {},
};
