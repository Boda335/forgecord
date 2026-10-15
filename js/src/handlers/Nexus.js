const i18nManager = require('@base/i18n.js');
// src/handlers/Nexus.js
// NEXUS is the concrete client class. baseClient (BaseNexus) now owns
// start(), getFooter(), embed() and Checker() - kept here previously as
// duplicated overrides that could silently drift out of sync with the base
// implementation. Nexus.js keeps only what's genuinely bot-specific: the
// interactive help menu.
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const BaseNexus = require('../Base/baseClient');

class NEXUS extends BaseNexus {
  async handleHelpSystem(interaction, message) {
    const send = interaction?.deferred ? interaction.followUp.bind(interaction) : interaction.reply.bind(interaction);

    const user = interaction?.user || interaction?.member?.user || message?.author;
    const i18n = await i18nManager.getForUser(user.id);
    const commands = this.commands;
    const categories = this.mcategories;

    const emoji = {
      premium: '👑',
      admin: '🛠️',
      misc: '🔰',
      Settings: '⚙️',
    };
    const defaultEmoji = '';

    const allcommands = this.commands.size;
    const allguilds = this.guilds.cache.size;
    const botuptime = `<t:${Math.floor(Date.now() / 1000 - this.uptime / 1000)}:R>`;

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('category_select')
      .setPlaceholder(i18n.t('help.selectCategory'))
      .addOptions(
        categories
          .filter(cat => cat !== 'dev')
          .map(cat => ({
            label: `${emoji[cat] || defaultEmoji} ${cat}`,
            value: cat,
            description: i18n.t('help.viewCategory', { category: cat }),
          })),
        {
          label: 'Home',
          emoji: '🏠',
          value: 'home',
          description: i18n.t('help.home'),
        }
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const help_embed = new EmbedBuilder()
      .setColor(this.config.embed.color)
      .setAuthor({
        name: this.user.tag,
        iconURL: this.user.displayAvatarURL({ dynamic: true }),
      })
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .setDescription(i18n.t('help.description'))
      .addFields([
        {
          name: i18n.t('help.stats'),
          value: i18n.t('help.statsValue', { commands: allcommands, guilds: allguilds, uptime: botuptime, ping: this.ws.ping }),
        },
      ])
      .setFooter(this.getFooter(user));

    const main_msg = await send({
      embeds: [help_embed],
      components: [row],
      ephemeral: true,
    });

    const filter = async i => {
      if (i.user.id === user.id) return true;
      await i.deferReply().catch(() => {});
      i.followUp({
        content: i18n.t('help.notYourInteraction'),
        ephemeral: true,
      }).catch(() => {});
      return false;
    };

    const collector = main_msg.createMessageComponentCollector({
      filter,
      time: 60000,
    });

    collector.on('collect', async i => {
      if (i.isStringSelectMenu()) {
        await i.deferUpdate().catch(() => {});
        const directory = i.values[0];

        if (directory === 'home') {
          main_msg.edit({ embeds: [help_embed] }).catch(() => {});
        } else {
          const categoryEmbed = new EmbedBuilder()
            .setColor(this.config.embed.color)
            .setTitle(`${emoji[directory] || defaultEmoji} ${directory} ${i18n.t('help.commands')} ${emoji[directory] || defaultEmoji}`)
            .setThumbnail(this.user.displayAvatarURL())
            .setFooter(this.getFooter(user));

          let categoryCommands = commands
            .filter(cmd => cmd.category === directory)
            .map(cmd => {
              const cmdEmoji = cmd.emoji || ':pushpin:';
              let lines = [`> ${cmdEmoji} \`${cmd.name}\` - ${i18n.t(`commands.${cmd.name}.description`) === `commands.${cmd.name}.description` ? cmd.description : i18n.t(`commands.${cmd.name}.description`)}`];

              if (cmd.command?.aliases?.length > 0) {
                lines.push(`> 🔁 ${i18n.t('help.aliases')}: \`${cmd.command.aliases.join('`, `')}\``);
              }

              if (cmd.options?.length > 0) {
                const opts = cmd.options.map(opt => `\`${opt.name}\``).join(', ');
                lines.push(`> ⚙️ ${i18n.t('help.options')}: ${opts}`);
              }

              return lines.join('\n');
            })
            .join('\n\n');

          if (!categoryCommands) {
            categoryCommands = i18n.t('help.noCommands');
          }

          categoryEmbed.setDescription(categoryCommands);

          main_msg.edit({ embeds: [categoryEmbed] }).catch(() => {});
        }
      }
    });

    collector.on('end', async () => {
      await main_msg.edit({ components: [] }).catch(() => {});
    });
  }
}

module.exports = NEXUS;


/**
 * @typedef {"MONGODB"|"Sqlite"|"JSON"|"MySQL"} DataBaseType
 */

/**
 * @typedef {object} DataBase Default DataBase configuration.
 * @property {DataBaseType} database_type
 * @property {import("good.db/dist/Types").goodDBOptions} [options]
 * @property {import("good.db/dist/Types").MongoDBDriverOptions} [MongoDB]
 * @property {import("mysql2").PoolOptions} [MySQL]
 * 
 */

/**
 * @property {DataBase} database
 * 
 * @property {import("discord.js").ClientOptions} [CustomClientOptions={}]
 * 
 */