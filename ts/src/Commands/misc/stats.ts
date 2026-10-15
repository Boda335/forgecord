import { EmbedBuilder, version as djsVersion, ApplicationCommandType } from 'discord.js';
import type { Guild, User } from 'discord.js';
import * as si from 'systeminformation';
import formatBytes from '../../functions/formatBytes';
import type { CommandData } from '../../Base/baseCommand';
import type { NexusClient } from '../../types/client';
import i18nManager from '../../Base/i18n';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../../../package.json');

const command: CommandData = {
  name: 'botinfo',
  description: 'Shows bot statistics',
  cooldown: 10,
  category: 'misc',
  botPermissions: ['SendMessages'],
  userPermissions: ['SendMessages'],
  type: ApplicationCommandType.ChatInput,
  options: [],
  command: {
    enabled: true,
    aliases: ['stats', 'statistics', 'info'],
    minArgsCount: 0,
  },
  slashCommand: {
    enabled: true,
  },

  async msgExecute(client, message) {
    const i18n = await i18nManager.getForUser(message.author.id);
    await getBotStats(client, message.guild!, message.author, i18n, async embed => {
      await message.reply({ embeds: [embed] });
    });
  },

  async interactionExecute(client, interaction) {
    await interaction.deferReply({ ephemeral: true });
    const i18n = await i18nManager.getForUser(interaction.user.id);
    await getBotStats(client, interaction.guild!, interaction.user, i18n, async embed => {
      await interaction.editReply({ embeds: [embed] });
    });
  },
};

export default command;

async function getBotStats(
  client: NexusClient,
  guild: Guild,
  user: User,
  i18n: ReturnType<typeof i18nManager.get>,
  sendEmbed: (embed: EmbedBuilder) => Promise<unknown>
) {
  try {
    const memory = await si.mem();
    const cpu = await si.cpu();
    const cpuUsage = (await si.currentLoad()).currentLoad;
    const osInfo = await si.osInfo();

    const embed = new EmbedBuilder()
      .setColor(client.config.embed.color || '#00FF99')
      .setTitle(i18n.t('stats.title'))
      .setThumbnail(client.user!.displayAvatarURL({ size: 1024 }))
      .addFields(
        { name: i18n.t('stats.memory'), value: `\`${formatBytes(memory.used)}\` / \`${formatBytes(memory.total)}\``, inline: true },
        { name: i18n.t('stats.uptime'), value: `<t:${Math.floor(Date.now() / 1000 - (client.uptime || 0) / 1000)}:R>`, inline: true },
        { name: i18n.t('stats.version'), value: `\`${pkg.version}\``, inline: true },
        { name: i18n.t('stats.servers'), value: `\`${client.guilds.cache.size}\``, inline: true },
        {
          name: i18n.t('stats.users'),
          value: `\`${client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0).toLocaleString()}\``,
          inline: true,
        },
        { name: i18n.t('stats.channels'), value: `\`${client.channels.cache.size}\``, inline: true },
        { name: i18n.t('stats.discordjs'), value: `v${djsVersion}`, inline: true },
        { name: i18n.t('stats.node'), value: process.version, inline: true },
        { name: i18n.t('stats.ping'), value: `${client.ws.ping}ms`, inline: true },
        { name: i18n.t('stats.cpuUsage'), value: `${Math.floor(cpuUsage)}%`, inline: true },
        { name: i18n.t('stats.arch'), value: osInfo.arch, inline: true },
        { name: i18n.t('stats.platform'), value: osInfo.platform, inline: true },
        { name: i18n.t('stats.cpu'), value: `\`\`\`ansi\n\u001b[2;33m${cpu.brand}\u001b[0m\n\`\`\`` },
        { name: i18n.t('stats.requestedBy'), value: `**${user.displayName}**`, inline: false }
      )
      .setFooter({ text: i18n.t('stats.footer', { bot: client.user!.username }), iconURL: client.user!.displayAvatarURL() })
      .setTimestamp();

    return sendEmbed(embed);
  } catch (err) {
    client.errorHandler.report(`Failed to build botinfo embed: ${(err as Error).message}`, { kind: 'command', name: 'botinfo' });
    const errorEmbed = new EmbedBuilder().setColor('Red').setDescription(i18n.t('stats.unavailable'));
    return sendEmbed(errorEmbed);
  }
}
