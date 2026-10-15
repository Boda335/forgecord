const { ApplicationCommandType, MessageFlags, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const i18nManager = require('@base/i18n.js');

function languageOptions(i18n) {
  return i18nManager.getAvailableLanguages().map(item => ({
    label: `${item.flag || ''} ${item.name}`.trim(),
    value: item.lang,
    description: item.short,
  }));
}

module.exports = {
  name: 'lang',
  description: 'Change your preferred language',
  cooldown: 3,
  category: 'misc',
  botPermissions: ['SendMessages'],
  userPermissions: ['SendMessages'],
  options: [],
  type: ApplicationCommandType.ChatInput,
  command: { enabled: true, aliases: ['language'], minArgsCount: 0 },
  slashCommand: { enabled: true, ephemeral: true },

  async change(client, userId, requested) {
    const current = await i18nManager.getForUser(userId);
    const info = i18nManager.getAvailableLanguages().find(x => x.lang === requested);
    if (!info) {
      return current.t('lang.invalid', {
        languages: i18nManager.getAvailableLanguages().map(x => `${x.flag} ${x.short}`).join(', '),
      });
    }
    await i18nManager.setUserLanguage(userId, requested);
    return i18nManager.get(requested).t('lang.changed', { language: `${info.flag} ${info.name}` });
  },

  async msgExecute(client, message, args) {
    const requested = String(args?.[0] || '').toLowerCase();
    if (!requested) {
      const i18n = await i18nManager.getForUser(message.author.id);
      const menu = new StringSelectMenuBuilder()
        .setCustomId(`lang_select:${message.author.id}`)
        .setPlaceholder(i18n.t('lang.choose'))
        .addOptions(languageOptions(i18n));
      const row = new ActionRowBuilder().addComponents(menu);
      return message.reply({ content: i18n.t('lang.description'), components: [row] });
    }
    return message.reply({ content: await module.exports.change(client, message.author.id, requested) });
  },

  async interactionExecute(client, interaction) {
    const i18n = await i18nManager.getForUser(interaction.user.id);
    const menu = new StringSelectMenuBuilder()
      .setCustomId(`lang_select:${interaction.user.id}`)
      .setPlaceholder(i18n.t('lang.choose'))
      .addOptions(languageOptions(i18n));
    const row = new ActionRowBuilder().addComponents(menu);
    await interaction.reply({ content: i18n.t('lang.description'), components: [row], flags: MessageFlags.Ephemeral });
    const message = await interaction.fetchReply();
    const collector = message.createMessageComponentCollector({ time: 60000 });
    collector.on('collect', async selectInteraction => {
      if (selectInteraction.user.id !== interaction.user.id) {
        return selectInteraction.reply({ content: i18n.t('help.notYourInteraction'), flags: MessageFlags.Ephemeral });
      }
      const requested = selectInteraction.values[0];
      const content = await module.exports.change(client, interaction.user.id, requested);
      await selectInteraction.update({ content, components: [] });
      collector.stop('selected');
    });
    collector.on('end', (_, reason) => {
      if (reason === 'time') interaction.editReply({ components: [] }).catch(() => {});
    });
  },

  autocompleteExecute: () => {},
};
