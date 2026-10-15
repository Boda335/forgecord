const cooldown = require('../../functions/cooldown');
const getPermissionName = require('../../functions/getPermissionName');
const handleInteraction = require('../../functions/handleInteraction');
const { emoji } = require('../../../settings/config');
const { ApplicationCommandOptionType, EmbedBuilder, PermissionsBitField } = require('discord.js');
const BEV = require('@base/baseEvents');

/** @type {BEV.BaseEvent<"interactionCreate">} */
module.exports = {
  name: 'interactionCreate',
  target: 'client',
  once: false,
  async execute(client, interaction) {
    if (interaction.isAutocomplete()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd || typeof cmd.autocompleteExecute !== 'function') return;

      await client.errorHandler.safeExecute(() => cmd.autocompleteExecute(client, interaction), {
        kind: 'autocomplete',
        name: cmd.name,
      });
      return;
    }
    if (interaction.isCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) {
        return client.embed(interaction, `${emoji.ERROR} \`${interaction.commandName}\` Command Not Found `);
      }

      const args = [];
      for (let option of interaction.options.data) {
        if (option.type === ApplicationCommandOptionType.Subcommand) {
          if (option.name) args.push(option.name);
          option.options?.forEach(x => {
            if (x.value) args.push(x.value);
          });
        } else if (option.value) args.push(option.value);
      }

      if (cmd) {
        // dmonly=true / userInstall=true -> command must be run in a DM with the bot, never in a guild
        // both false/undefined -> command must be run in a guild, never in a DM
        const isDmOnly = cmd.dmonly || cmd.userInstall;
        if (isDmOnly && interaction.guild) {
          return client.embed(interaction, `**:rolling_eyes: This command can only be used in DMs, not in a server**`);
        } else if (!isDmOnly && !interaction.guild) {
          return client.embed(interaction, `**:rolling_eyes: This command can only be used in a server, not in DMs**`);
        } else if (interaction.guild && interaction.member && !interaction.member.permissions.has(cmd.userPermissions)) {
          const needPerms = getPermissionName(new PermissionsBitField(cmd.userPermissions).bitfield);
          return client.embed(interaction, `**:rolling_eyes: You need ${needPerms.map(p => `\`${p}\``).join(', ')} for this command**`);
        } else if (interaction.guild && interaction.guild.members.me && !interaction.guild.members.me.permissions.has(cmd.botPermissions)) {
          const needPerms = getPermissionName(new PermissionsBitField(cmd.botPermissions).bitfield);
          return client.embed(interaction, `**:rolling_eyes: I need ${needPerms.map(p => `\`${p}\``).join(', ')} for this command**`);
        } else if (cooldown(interaction, cmd)) {
          const timeLeft = cooldown(interaction, cmd);
          if (timeLeft) {
            const timestamp = Math.floor(Date.now() / 1000 + timeLeft);
            const replies = [`**Please wait and try again <t:${timestamp}:R>.**`, `**Hold on, you can use this command again <t:${timestamp}:R>.**`, `**You're doing that too quickly. Try again <t:${timestamp}:R>.**`, `**Slow down! You can run this command <t:${timestamp}:R>.**`, `**This command is on cooldown. Try again <t:${timestamp}:R>.**`, `**Not so fast! You’ll be able to use this command again <t:${timestamp}:R>.**`, `**Give it a second. Try again <t:${timestamp}:R>.**`, `**You need to wait before using this command again <t:${timestamp}:R>.**`, `**Too soon. The command will be ready <t:${timestamp}:R>.**`, `**Patience! You can try again <t:${timestamp}:R>.**`, `**Let the cooldown finish. Try again <t:${timestamp}:R>.**`, `**You're on cooldown. Try again <t:${timestamp}:R>.**`, `**Please be patient. You can use this again <t:${timestamp}:R>.**`, `**This command is still cooling down. Try again <t:${timestamp}:R>.**`, `**Hang tight! You’ll be able to use it again <t:${timestamp}:R>.**`, `**Calm down. You can try again <t:${timestamp}:R>.**`, `**Cool down active! Please wait until <t:${timestamp}:R>.**`, `**Almost there. Try again <t:${timestamp}:R>.**`, `**Easy! This command will be ready <t:${timestamp}:R>.**`, `**You're going too fast. Try again <t:${timestamp}:R>.**`, `**Don't rush it. Try again <t:${timestamp}:R>.**`, `**Cooldown in effect. Try again <t:${timestamp}:R>.**`, `**Retry this command <t:${timestamp}:R>.**`, `**You're temporarily blocked from using this command. Try again <t:${timestamp}:R>.**`, `**The system is preventing rapid use. Try again <t:${timestamp}:R>.**`, `**Command temporarily unavailable. Please retry <t:${timestamp}:R>.**`, `**Let the cooldown finish up. You’ll be able to use it again <t:${timestamp}:R>.**`];

            const randomReply = replies[Math.floor(Math.random() * replies.length)];
            return interaction.reply({
              content: randomReply,
              ephemeral: true,
            });
          }
        } else if (cmd.category === 'OWNER' && !client.config.Owners.includes(interaction.user.id)) {
          return interaction.reply({
            embeds: [new EmbedBuilder().setColor(client.config.embed.errorcolor).setDescription(':rolling_eyes: **This command is for the bot owner only**')],
          });
        } else {
          await client.errorHandler.safeExecute(() => cmd.interactionExecute(client, interaction, args), {
            kind: 'command',
            name: cmd.name,
          });
        }
      }
    }
    if (interaction.isButton() || interaction.isModalSubmit() || interaction.isAnySelectMenu()) {
      const parts = interaction.customId?.split('_');
      await client.errorHandler.safeExecute(() => handleInteraction(client, interaction, parts), {
        kind: 'component',
        name: interaction.customId,
      });
    }
  },
};
