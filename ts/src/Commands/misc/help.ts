import { ApplicationCommandType } from 'discord.js';
import type { CommandData } from '../../Base/baseCommand';
import type { NEXUS } from '../../handlers/Nexus';

const command: CommandData = {
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
    await (client as unknown as NEXUS).handleHelpSystem(undefined, message);
  },

  async interactionExecute(client, interaction) {
    await (client as unknown as NEXUS).handleHelpSystem(interaction);
  },
};

export default command;
