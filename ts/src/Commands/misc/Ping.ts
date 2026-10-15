import { ApplicationCommandType } from 'discord.js';
import type { CommandData } from '../../Base/baseCommand';
import i18nManager from '../../Base/i18n';

const command: CommandData = {
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
    await interaction.reply({ content: i18n.t('ping.pong', { ping: client.ws.ping }), ephemeral: true });
  },
};

export default command;
