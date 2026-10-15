import { ApplicationCommandType, ApplicationCommandOptionType } from 'discord.js';
import reloadAll from '../../handlers/reloadAll';
import type { CommandData } from '../../Base/baseCommand';
import i18nManager from '../../Base/i18n';
import { Logger } from '../../core/logger';

const command: CommandData = {
  name: 'refrish',
  description: 'Reload commands, events, and components without restarting the bot',
  cooldown: 10,
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
          description: 'refresh commands',
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
      if (type !== 'all') return;

      const { commands, interactions, functions } = await reloadAll(client);
      const msgData = `\`\`\`\n${i18n.t('reload.done', { commandsLoaded: commands.loaded, commandsFailed: commands.failed, interactionsLoaded: interactions.loaded, interactionsFailed: interactions.failed, functionsLoaded: functions.loaded, functionsFailed: functions.failed })}\n\`\`\``;
      await message.reply({ content: msgData });
    } catch (error) {
      const i18n = await i18nManager.getForUser(message.author.id);
      await message.reply({ content: i18n.t('reload.error', { error: (error as Error).message }) });
    }
  },

  async interactionExecute(client, interaction) {
    const i18n = await i18nManager.getForUser(interaction.user.id);
    try {
      const type = interaction.options.getSubcommand();
      if (type !== 'all') return;

      const { commands, interactions, functions } = await reloadAll(client);
      const msgData = `\`\`\`\n${i18n.t('reload.done', { commandsLoaded: commands.loaded, commandsFailed: commands.failed, interactionsLoaded: interactions.loaded, interactionsFailed: interactions.failed, functionsLoaded: functions.loaded, functionsFailed: functions.failed })}\n\`\`\``;
      await interaction.reply({ content: msgData });
    } catch (error) {
      Logger.error('Error in reload command:', error);
      await interaction.reply({ content: i18n.t('reload.error', { error: (error as Error).message }), ephemeral: true });
    }
  },
};

export default command;
