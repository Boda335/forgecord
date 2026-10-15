import { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import type { ChatInputCommandInteraction, Message, User } from 'discord.js';
import i18nManager from '../Base/i18n';
import { BaseNexus } from '../Base/baseClient';

/**
 * NEXUS is the concrete client class. BaseNexus owns start(), getFooter(),
 * embed() and the update Checker(). This subclass keeps only what's
 * genuinely bot-specific: the interactive help menu.
 */
export class NEXUS extends BaseNexus {
  async handleHelpSystem(interaction?: ChatInputCommandInteraction, message?: Message): Promise<void> {
    const target = interaction || message;
    if (!target) return;
    const send = interaction?.deferred
      ? interaction.followUp.bind(interaction)
      : ('reply' in target ? target.reply.bind(target) : undefined);
    if (!send) return;

    const user = (interaction?.user || message?.author) as User;
    const i18n = await i18nManager.getForUser(user.id);
    const commands = this.commands;
    const categories = this.mcategories;

    const emoji: Record<string, string> = {
      premium: '👑',
      admin: '🛠️',
      misc: '🔰',
      Settings: '⚙️',
    };
    const defaultEmoji = '';

    const allcommands = this.commands.size;
    const allguilds = this.guilds.cache.size;
    const botuptime = `<t:${Math.floor(Date.now() / 1000 - (this.uptime || 0) / 1000)}:R>`;

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('category_select')
      .setPlaceholder(i18n.t('help.selectCategory'))
      .addOptions([
        ...categories
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
        },
      ]);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

    const helpEmbed = new EmbedBuilder()
      .setColor(this.config.embed.color)
      .setAuthor({
        name: this.user!.tag,
        iconURL: this.user!.displayAvatarURL(),
      })
      .setDescription(i18n.t('help.description'))
      .addFields([
        {
          name: i18n.t('help.stats'),
          value: i18n.t('help.statsValue', { commands: allcommands, guilds: allguilds, uptime: botuptime, ping: this.ws.ping }),
        },
      ])
      .setFooter(this.getFooter(user));

    const guildIcon = (interaction?.guild || message?.guild)?.iconURL();
    if (guildIcon) helpEmbed.setThumbnail(guildIcon);

    const mainMsg = await send({
      embeds: [helpEmbed],
      components: [row],
      ephemeral: true,
    });

    const collector = mainMsg!.createMessageComponentCollector({
      filter: async i => {
        if (i.user.id === user.id) return true;
        await i.deferReply().catch(() => {});
        i.followUp({ content: i18n.t('help.notYourInteraction'), ephemeral: true }).catch(() => {});
        return false;
      },
      time: 60000,
    });

    collector.on('collect', async i => {
      if (!i.isStringSelectMenu()) return;
      await i.deferUpdate().catch(() => {});
      const directory = i.values[0];

      if (directory === 'home') {
        mainMsg!.edit({ embeds: [helpEmbed] }).catch(() => {});
        return;
      }

      const categoryEmbed = new EmbedBuilder()
        .setColor(this.config.embed.color)
        .setTitle(`${emoji[directory] || defaultEmoji} ${directory} ${i18n.t('help.commands')} ${emoji[directory] || defaultEmoji}`)
        .setThumbnail(this.user!.displayAvatarURL())
        .setFooter(this.getFooter(user));

      const categoryCommands =
        commands
          .filter(cmd => cmd.category === directory)
          .map(cmd => {
            const cmdEmoji = cmd.emoji || ':pushpin:';
            const translated = i18n.t(`commands.${cmd.name}.description`);
            const lines = [`> ${cmdEmoji} \`${cmd.name}\` - ${translated === `commands.${cmd.name}.description` ? cmd.description : translated}`];

            if (cmd.command?.aliases?.length) {
              lines.push(`> 🔁 ${i18n.t('help.aliases')}: \`${cmd.command.aliases.join('`, `')}\``);
            }
            if (cmd.options?.length) {
              const opts = cmd.options.map(opt => `\`${opt.name}\``).join(', ');
              lines.push(`> ⚙️ ${i18n.t('help.options')}: ${opts}`);
            }
            return lines.join('\n');
          })
          .join('\n\n') || i18n.t('help.noCommands');

      categoryEmbed.setDescription(categoryCommands);
      mainMsg!.edit({ embeds: [categoryEmbed] }).catch(() => {});
    });

    collector.on('end', async () => {
      await mainMsg!.edit({ components: [] }).catch(() => {});
    });
  }
}

export default NEXUS;
