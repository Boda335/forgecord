import { ActionRowBuilder, StringSelectMenuBuilder, ApplicationCommandType } from 'discord.js';
import type { CommandData } from '../../Base/baseCommand';
import i18nManager from '../../Base/i18n';

function languageOptions() {
  return i18nManager.getAvailableLanguages().map(item => ({
    label: `${item.flag || ''} ${item.name}`.trim(), value: item.lang, description: item.short,
  }));
}

const command: CommandData = {
  name: 'lang', description: 'Change your preferred language', cooldown: 3, category: 'misc',
  botPermissions: ['SendMessages'], userPermissions: ['SendMessages'], options: [], type: ApplicationCommandType.ChatInput,
  command: { enabled: true, aliases: ['language'], minArgsCount: 0 }, slashCommand: { enabled: true, ephemeral: true },

  async msgExecute(client, message, args) {
    const current = await i18nManager.getForUser(message.author.id);
    const requested = String(args?.[0] || '').toLowerCase();
    if (!requested) {
      const menu = new StringSelectMenuBuilder().setCustomId(`lang_select:${message.author.id}`).setPlaceholder(current.t('lang.choose')).addOptions(languageOptions());
      await message.reply({ content: current.t('lang.description'), components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu)] });
      return;
    }
    const info = i18nManager.getAvailableLanguages().find(x => x.lang === requested);
    if (!info) { await message.reply({ content: current.t('lang.invalid', { languages: i18nManager.getAvailableLanguages().map(x => `${x.flag} ${x.short}`).join(', ') }) }); return; }
    await i18nManager.setUserLanguage(message.author.id, requested);
    await message.reply({ content: i18nManager.get(requested).t('lang.changed', { language: `${info.flag} ${info.name}` }) });
  },

  async interactionExecute(client, interaction) {
    const current = await i18nManager.getForUser(interaction.user.id);
    const menu = new StringSelectMenuBuilder().setCustomId(`lang_select:${interaction.user.id}`).setPlaceholder(current.t('lang.choose')).addOptions(languageOptions());
    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
    await interaction.reply({ content: current.t('lang.description'), components: [row], ephemeral: true });
    const reply = await interaction.fetchReply();
    const collector = reply.createMessageComponentCollector({ time: 60000 });
    collector.on('collect', async selectInteraction => {
      if (selectInteraction.user.id !== interaction.user.id) { await selectInteraction.reply({ content: current.t('help.notYourInteraction'), ephemeral: true }); return; }
       if (!selectInteraction.isStringSelectMenu()) return;
      const requested = selectInteraction.values[0];
      const info = i18nManager.getAvailableLanguages().find(x => x.lang === requested);
      if (!info) return;
      await i18nManager.setUserLanguage(interaction.user.id, requested);
      await selectInteraction.update({ content: i18nManager.get(requested).t('lang.changed', { language: `${info.flag} ${info.name}` }), components: [] });
      collector.stop('selected');
    });
    collector.on('end', (_, reason) => { if (reason === 'time') interaction.editReply({ components: [] }).catch(() => {}); });
  },
};
export default command;
