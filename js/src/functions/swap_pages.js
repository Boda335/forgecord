const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const NEXUS = require('../handlers/Nexus.js');
/**
 * @param {NEXUS} client
 * @param {import('discord.js').Interaction} interaction
 */
async function swap_pages(interaction, embeds, client) {
  let currentPage = 0;
  let allbuttons = new ActionRowBuilder().addComponents([new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId('0').setEmoji('⏮'), new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId('1').setEmoji('◀'), new ButtonBuilder().setStyle(ButtonStyle.Danger).setCustomId('2').setLabel('⛔️'), new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId('3').setEmoji('▶'), new ButtonBuilder().setStyle(ButtonStyle.Secondary).setCustomId('4').setEmoji('⏭')]);
  if (embeds.length === 1) {
    if (interaction.deferred) {
      return interaction.followUp({
        embeds: [embeds[0]],
        fetchReply: true,
      });
    } else {
      return interaction.reply({
        embeds: [embeds[0]],
        fetchReply: true,
      });
    }
  }
  embeds = embeds.map((embed, index) => {
    return embed.setColor(client.config.embed.color).setFooter({
      text: `Page ${index + 1} / ${embeds.length}`,
      iconURL: interaction.guild.iconURL({ dynamic: true }),
    });
  });
  let swapmsg;
  if (interaction.deferred) {
    swapmsg = await interaction.followUp({
      embeds: [embeds[0]],
      components: [allbuttons],
    });
  } else {
    swapmsg = await interaction.reply({
      embeds: [embeds[0]],
      components: [allbuttons],
    });
  }
  const collector = swapmsg.createMessageComponentCollector({
    time: 2000 * 60,
  });
  collector.on('collect', async b => {
    if (b.isButton()) {
      await b.deferUpdate().catch(e => {});
      // page first
      if (b.customId == '0') {
        if (currentPage !== 0) {
          currentPage = 0;
          await swapmsg
            .edit({
              embeds: [embeds[currentPage]],
              components: [allbuttons],
            })
            .catch(e => null);
        }
      }
      //page forward
      if (b.customId == '1') {
        if (currentPage !== 0) {
          currentPage -= 1;
          await swapmsg
            .edit({
              embeds: [embeds[currentPage]],
              components: [allbuttons],
            })
            .catch(e => null);
        } else {
          currentPage = embeds.length - 1;
          await swapmsg
            .edit({
              embeds: [embeds[currentPage]],
              components: [allbuttons],
            })
            .catch(e => null);
        }
      }
      //go home
      else if (b.customId == '2') {
        try {
          allbuttons.components.forEach(btn => btn.setDisabled(true));
          swapmsg
            .edit({
              embeds: [embeds[currentPage]],
              components: [allbuttons],
            })
            .catch(e => null);
        } catch (e) {}
      }
      //go forward
      else if (b.customId == '3') {
        if (currentPage < embeds.length - 1) {
          currentPage++;
          await swapmsg
            .edit({
              embeds: [embeds[currentPage]],
              components: [allbuttons],
            })
            .catch(e => null);
        } else {
          currentPage = 0;
          await swapmsg
            .edit({
              embeds: [embeds[currentPage]],
              components: [allbuttons],
            })
            .catch(e => null);
        }
      }
      // page last
      if (b.customId == '4') {
        currentPage = embeds.length - 1;
        await swapmsg
          .edit({
            embeds: [embeds[currentPage]],
            components: [allbuttons],
          })
          .catch(e => null);
      }
    }
  });

  collector.on('end', () => {
    allbuttons.components.forEach(btn => btn.setDisabled(true));
    swapmsg.edit({ components: [allbuttons] }).catch(e => null);
  });
}

module.exports = swap_pages;
