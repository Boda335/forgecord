const cooldown = require('../../functions/cooldown');
const getPermissionName = require('../../functions/getPermissionName');
const { PREFIX: botPrefix } = require('../../../settings/config');
const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const BEV = require('@base/baseEvents');

/** @type {BEV.BaseEvent<"messageCreate">} */
module.exports = {
  name: 'messageCreate',
  target: 'client',
  once: false,

  async execute(client, message) {
    if (message.author.bot || !message.guild || !message.id) return;
    const prefix = botPrefix;
    let mentionprefix = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`);
    if (!mentionprefix.test(message.content)) return;
    const [, nprefix] = message.content.match(mentionprefix);
    const args = message.content.slice(nprefix.length).trim().split(/ +/);
    const cmd = args.shift().toLowerCase();
    if (cmd.length === 0) {
      if (nprefix.includes(client.user.id)) {
        let embed = new EmbedBuilder()
          .setAuthor({
            name: client.user.username,
            iconURL: client.user.displayAvatarURL({ dynamic: true }),
          })
          .setThumbnail(message.guild.iconURL({ dynamic: true }))
          .setColor(client.config.embed.color)
          .setDescription(`**My prefix for \`${message.guild.name}\` is \`${prefix}\`**\n**You can join our [Support Server](${client.config.links.DiscordServer}) for more help!**\n**This bot is powered by Forgecord**`);
        let row = new ActionRowBuilder().addComponents(new ButtonBuilder().setURL(client.config.links.DiscordServer).setLabel('Support Server').setStyle(ButtonStyle.Link), new ButtonBuilder().setURL(client.config.links.Devloper).setLabel('Developer').setStyle(ButtonStyle.Link));
        return message.reply({ embeds: [embed], components: [row] });
      }
    }
    const command = client.commands.get(cmd) || client.commands.find(cmds => cmds.command.aliases && cmds.command.aliases.includes(cmd));
    if (!command) return;

    if (!command.command?.enabled) return;
    if (command.userPermissions && !message.member.permissions.has(PermissionsBitField.resolve(command.userPermissions))) {
      const needPerms = getPermissionName(new PermissionsBitField(command.userPermissions).bitfield);

      return client.embed(message, `**🙄 You need ${needPerms.map(perm => `\`${perm}\``).join(', ')} permission(s) to use this command.**`);
    } else if (command.botPermissions && !message.guild.members.me.permissions.has(PermissionsBitField.resolve(command.botPermissions))) {
      const needPerms = getPermissionName(new PermissionsBitField(command.botPermissions).bitfield);

      return client.embed(message, `**🙄 I need ${needPerms.map(perm => `\`${perm}\``).join(', ')} permission(s) to run \`${command.name}\`.**`);
    } else if (cooldown(message, command)) {
      const timeLeft = cooldown(message, command);
      if (timeLeft) {
        const timestamp = Math.floor(Date.now() / 1000 + timeLeft);
        const replies = [`**Please wait and try again <t:${timestamp}:R>.**`, `**Hold on, you can use this command again <t:${timestamp}:R>.**`, `**You're doing that too quickly. Try again <t:${timestamp}:R>.**`, `**Slow down! You can run this command <t:${timestamp}:R>.**`, `**This command is on cooldown. Try again <t:${timestamp}:R>.**`, `**Not so fast! You’ll be able to use this command again <t:${timestamp}:R>.**`, `**Give it a second. Try again <t:${timestamp}:R>.**`, `**You need to wait before using this command again <t:${timestamp}:R>.**`, `**Too soon. The command will be ready <t:${timestamp}:R>.**`, `**Patience! You can try again <t:${timestamp}:R>.**`, `**Let the cooldown finish. Try again <t:${timestamp}:R>.**`, `**You're on cooldown. Try again <t:${timestamp}:R>.**`, `**Please be patient. You can use this again <t:${timestamp}:R>.**`, `**This command is still cooling down. Try again <t:${timestamp}:R>.**`, `**Hang tight! You’ll be able to use it again <t:${timestamp}:R>.**`, `**Calm down. You can try again <t:${timestamp}:R>.**`, `**Cool down active! Please wait until <t:${timestamp}:R>.**`, `**Almost there. Try again <t:${timestamp}:R>.**`, `**Easy! This command will be ready <t:${timestamp}:R>.**`, `**You're going too fast. Try again <t:${timestamp}:R>.**`, `**Don't rush it. Try again <t:${timestamp}:R>.**`, `**Cooldown in effect. Try again <t:${timestamp}:R>.**`, `**Retry this command <t:${timestamp}:R>.**`, `**You're temporarily blocked from using this command. Try again <t:${timestamp}:R>.**`, `**The system is preventing rapid use. Try again <t:${timestamp}:R>.**`, `**Command temporarily unavailable. Please retry <t:${timestamp}:R>.**`, `**Let the cooldown finish up. You’ll be able to use it again <t:${timestamp}:R>.**`];

        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        return message.reply({ content: randomReply }).then(msg => {
          setTimeout(() => {
            msg.delete();
          }, 3000);
        });
      }
    }
    if (command.category === 'OWNER' && !client.config.Owners.includes(message.author.id)) {
      return message.reply({
        embeds: [new EmbedBuilder().setColor(client.config.embed.errorcolor).setDescription(':rolling_eyes: **This command is for the bot owner only**')],
      });
    } else {
      await client.errorHandler.safeExecute(() => command.msgExecute(client, message, args, nprefix), {
        kind: 'command',
        name: command.name,
      });
    }
  },
};

function escapeRegex(newprefix) {
  return newprefix.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);
}
