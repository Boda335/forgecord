const reloadAll = require('../../handlers/reloadAll');
const { ApplicationCommandType, ApplicationCommandOptionType, MessageFlags } = require('discord.js');
const { Logger } = require('../../core/logger');
const i18nManager = require('@base/i18n.js');
const ms = require('ms');
/**
 * @type {import("@base/baseCommand")}
 */
module.exports = {
  name: 'refrish',
  description: 'Reload commands, events, and components without restarting the bot',
  cooldown: ms('10s'),
  category: 'OWNER',
  botPermissions: ['ManageGuild', 'ViewAuditLog'],
  userPermissions: ['ManageChannels', 'ViewAuditLog'],
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'commands',
      description: 'the target member',
      type: ApplicationCommandOptionType.SubcommandGroup,
      options: [
        {
          name: 'all',
          description: 'refish commands',
          type: ApplicationCommandOptionType.Subcommand,
        },
      ],
    },
  ],
  command: {
    enabled: true,
    aliases: ['rl', 're'],
    minArgsCount: 0,
  },
  slashCommand: {
    enabled: true,
  },

  async msgExecute(client, message, args) {
    const i18n = await i18nManager.getForUser(message.author.id);
    try {
      const type = args[0] || 'all';
      const { commands, interactions, functions } = await reloadAll(client);
      switch (type) {
        case 'all':
          {
            const msgData = `\`\`\`
${i18n.t('reload.done', {
  commandsLoaded: commands.loaded,
  commandsFailed: commands.failed,
  componentsLoaded: interactions.loaded,
  componentsFailed: interactions.failed,
  functionsLoaded: functions.loaded,
  functionsFailed: functions.failed,
})}
\`\`\``;
            await message.reply({ content: msgData });
          }
          break;
      }
    } catch (error) {
      Logger.error(`Error in reload command: ${error.message}`);
      await message.reply({
        content: i18n.t('reload.error', { error: error.message }),
      });
    }
  },

  async interactionExecute(client, interaction) {
    const i18n = await i18nManager.getForUser(interaction.user.id);
    try {
      const type = interaction.options.getSubcommand();
      switch (type) {
        case 'all':
          {
            const { commands, interactions, functions } = await reloadAll(client);

            const msgData = `\`\`\`
${i18n.t('reload.done', {
  commandsLoaded: commands.loaded,
  commandsFailed: commands.failed,
  componentsLoaded: interactions.loaded,
  componentsFailed: interactions.failed,
  functionsLoaded: functions.loaded,
  functionsFailed: functions.failed,
})}
\`\`\``;
            await interaction.reply({ content: msgData });
          }
          break;
      }
    } catch (error) {
      Logger.error('Error in reload command:', error);
      await interaction.reply({
        content: i18n.t('reload.error', { error: error.message }),
        flags: MessageFlags.Ephemeral,
      });
    }
  },

  autocompleteExecute: (client, interaction) => {},
};
