const { EmbedBuilder, version, ApplicationCommandType } = require('discord.js');
const formatBytes = require('../../functions/formatBytes');
const os = require('systeminformation');
const pkg = require('../../../package.json');
const NEXUS = require('../../handlers/Nexus.js');
const { Logger } = require('../../core/logger');
const ms = require('ms');
const i18nManager = require('@base/i18n.js');

/**
 * @type {import("../../Base/baseCommand")}
 */
module.exports = {
  name: 'botinfo',
  description: 'Shows bot statistics',
  cooldown: ms('1m'),
  category: 'misc',
  botPermissions: ['SendMessages'],
  userPermissions: ['SendMessages'],
  type: ApplicationCommandType.ChatInput,
  options: [],
  dmonly: false,
  userInstall: false,
  command: {
    enabled: true,
    aliases: ['stats', 'statistics', 'info'],
    minArgsCount: 0,
  },
  slashCommand: {
    enabled: true,
  },

  async msgExecute(client, message, args) {
    const i18n = await i18nManager.getForUser(message.author.id);
    await getBotStats(client, message.guild, message.author, i18n, async embed => {
      await message.reply({ embeds: [embed] });
    });
  },

  async interactionExecute(client, interaction) {
    await interaction.deferReply({ flags: require('discord.js').MessageFlags.Ephemeral });
    const i18n = await i18nManager.getForUser(interaction.user.id);
    await getBotStats(client, interaction.guild, interaction.user, i18n, async embed => {
      await interaction.editReply({ embeds: [embed] });
    });
  },

  //   async autocompleteExecute(client, interaction) {},
};
/**
 *
 * @param {NEXUS} client
 * @param {import("discord.js").Guild} guild
 * @param {import("discord.js").User} user
 * @param {Function} sendEmbed
 * @returns
 */

async function getBotStats(client, guild, user, i18n, sendEmbed) {
  try {
    let memory = await os.mem();
    let cpu = await os.cpu();
    let cpuUsage = await (await os.currentLoad()).currentLoad;
    let osInfo = await os.osInfo();

    let TotalRam = formatBytes(memory.total);
    let UsageRam = formatBytes(memory.used);

    const embed = new EmbedBuilder()
      .setColor(client.config.embed?.color || '#00FF99')
      .setTitle(i18n.t('stats.title'))
      .setThumbnail(client.user.displayAvatarURL({ size: 1024 }))
      .addFields(
        {
          name: i18n.t('stats.memory'),
          value: `\`${UsageRam}\` / \`${TotalRam}\``,
          inline: true,
        },
        {
          name: i18n.t('stats.uptime'),
          value: `<t:${Math.floor(Date.now() / 1000 - client.uptime / 1000)}:R>`,
          inline: true,
        },
        { name: i18n.t('stats.version'), value: `\`${pkg.version}\``, inline: true },
        {
          name: i18n.t('stats.servers'),
          value: `\`${client.guilds.cache.size}\``,
          inline: true,
        },
        {
          name: i18n.t('stats.users'),
          value: `\`${client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0).toLocaleString()}\``,
          inline: true,
        },
        {
          name: i18n.t('stats.channels'),
          value: `\`${client.channels.cache.size}\``,
          inline: true,
        },
        { name: i18n.t('stats.discordjs'), value: `v${version}`, inline: true },
        { name: i18n.t('stats.node'), value: process.version, inline: true },
        { name: i18n.t('stats.ping'), value: `${client.ws.ping}ms`, inline: true },
        {
          name: i18n.t('stats.cpuUsage'),
          value: `${Math.floor(cpuUsage)}%`,
          inline: true,
        },
        { name: i18n.t('stats.arch'), value: osInfo.arch, inline: true },
        { name: i18n.t('stats.platform'), value: osInfo.platform, inline: true },
        {
          name: i18n.t('stats.cpu'),
          value: `\`\`\`ansi
[2;33m${cpu.brand}[0m
\`\`\``,
        },

        {
          name: i18n.t('stats.requestedBy'),
          value: `**${user.displayName}**`,
          inline: false,
        }
      )
      .setFooter({
        text: i18n.t('stats.footer', { bot: client.user.username }),
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    return sendEmbed(embed);
  } catch (err) {
    Logger.error('An error occurred:', err);
    const errorEmbed = new EmbedBuilder().setColor('Red').setDescription(i18n.t('stats.unavailable'));
    return sendEmbed(errorEmbed);
  }
}
