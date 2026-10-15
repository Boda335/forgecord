import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { EmbedBuilder, Message } from 'discord.js';
import type { RepliableInteraction as Repliable } from '../types/interaction';
import type { NexusClient } from '../types/client';

export default async function swap_pages(interaction: Repliable, embeds: EmbedBuilder[], client: NexusClient): Promise<Message | void> {
  let currentPage = 0;
  const allbuttons = new ActionRowBuilder<ButtonBuilder>().addComponents([
    new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId('0').setEmoji('⏮'),
    new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId('1').setEmoji('◀'),
    new ButtonBuilder().setStyle(ButtonStyle.Danger).setCustomId('2').setLabel('⛔️'),
    new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId('3').setEmoji('▶'),
    new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId('4').setEmoji('⏭'),
  ]);

  if (embeds.length === 1) {
    const send = interaction.deferred ? interaction.followUp.bind(interaction) : interaction.reply.bind(interaction);
    return send({ embeds: [embeds[0]], fetchReply: true });
  }

  embeds = embeds.map((embed, index) =>
    embed.setColor(client.config.embed.color).setFooter({
      text: `Page ${index + 1} / ${embeds.length}`,
      iconURL: interaction.guild.iconURL({ dynamic: true }),
    })
  );

  const send = interaction.deferred ? interaction.followUp.bind(interaction) : interaction.reply.bind(interaction);
  const swapmsg = await send({ embeds: [embeds[0]], components: [allbuttons] });

  const collector = swapmsg.createMessageComponentCollector({ time: 2000 * 60 });

  collector.on('collect', async b => {
    if (!b.isButton()) return;
    await b.deferUpdate().catch(() => {});

    const goTo = async (page: number) => {
      currentPage = page;
      await swapmsg.edit({ embeds: [embeds[currentPage]], components: [allbuttons] }).catch(() => {});
    };

    switch (b.customId) {
      case '0':
        if (currentPage !== 0) await goTo(0);
        break;
      case '1':
        await goTo(currentPage !== 0 ? currentPage - 1 : embeds.length - 1);
        break;
      case '2':
        allbuttons.components.forEach(btn => btn.setDisabled(true));
        await swapmsg.edit({ embeds: [embeds[currentPage]], components: [allbuttons] }).catch(() => {});
        break;
      case '3':
        await goTo(currentPage < embeds.length - 1 ? currentPage + 1 : 0);
        break;
      case '4':
        await goTo(embeds.length - 1);
        break;
    }
  });

  collector.on('end', () => {
    allbuttons.components.forEach(btn => btn.setDisabled(true));
    swapmsg.edit({ components: [allbuttons] }).catch(() => {});
  });

  return swapmsg;
}
