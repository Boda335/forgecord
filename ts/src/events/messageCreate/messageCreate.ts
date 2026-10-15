import { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import cooldown from '../../functions/cooldown';
import getPermissionName from '../../functions/getPermissionName';
import type { BaseEvent } from '../../Base/baseEvents';


function randomCooldownReply(timeLeft: number): string {
  const timestamp = Math.floor(Date.now() / 1000 + timeLeft);
  const replies = [
    `**Please wait and try again <t:${timestamp}:R>.**`,
    `**Hold on, you can use this command again <t:${timestamp}:R>.**`,
    `**You're doing that too quickly. Try again <t:${timestamp}:R>.**`,
    `**Slow down! You can run this command <t:${timestamp}:R>.**`,
    `**This command is on cooldown. Try again <t:${timestamp}:R>.**`,
    `**Patience! You can try again <t:${timestamp}:R>.**`,
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const messageCreateEvent: BaseEvent<'messageCreate'> = {
  name: 'messageCreate',
  target: 'client',
  once: false,

  async execute(client, message) {
    if (message.author.bot || !message.guild || !message.id) return;

    const prefix = client.config.PREFIX;
    const mentionPrefix = new RegExp(`^(<@!?${client.user!.id}>|${escapeRegex(prefix)})\\s*`);
    const match = message.content.match(mentionPrefix);
    if (!match) return;

    const nprefix = match[1];
    const args = message.content.slice(match[0].length).trim().split(/ +/);
    const cmdName = args.shift()!.toLowerCase();

    if (cmdName.length === 0) {
      if (nprefix.includes(client.user!.id)) {
        const embed = new EmbedBuilder()
          .setAuthor({ name: client.user!.username, iconURL: client.user!.displayAvatarURL() })
          .setThumbnail(message.guild.iconURL())
          .setColor(client.config.embed.color)
          .setDescription(
            `**My prefix for \`${message.guild.name}\` is \`${prefix}\`**\n**You can join our [Support Server](${client.config.links.DiscordServer}) for more help!**\n**This Bot is made by [\`Boda3350\`](${client.config.links.Devloper}) [\`neXus-Team\`](${client.config.links.DiscordServer})**`
          );
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setURL(client.config.links.DiscordServer).setLabel('Support Server').setStyle(ButtonStyle.Link),
          new ButtonBuilder().setURL(client.config.links.Devloper).setLabel('Developer').setStyle(ButtonStyle.Link)
        );
        await message.reply({ embeds: [embed], components: [row] });
      }
      return;
    }

    const command = client.commands.get(cmdName) || client.commands.find(c => c.command?.aliases?.includes(cmdName));
    if (!command || !command.command?.enabled) return;

    if (command.userPermissions?.length && !message.member!.permissions.has(PermissionsBitField.resolve(command.userPermissions as any))) {
      const needPerms = getPermissionName(new PermissionsBitField(command.userPermissions as any).bitfield);
      client.embed(message, `**🙄 You need ${needPerms!.map(p => `\`${p}\``).join(', ')} permission(s) to use this command.**`);
      return;
    }

    if (command.botPermissions?.length && !message.guild.members.me!.permissions.has(PermissionsBitField.resolve(command.botPermissions as any))) {
      const needPerms = getPermissionName(new PermissionsBitField(command.botPermissions as any).bitfield);
      client.embed(message, `**🙄 I need ${needPerms!.map(p => `\`${p}\``).join(', ')} permission(s) to run \`${command.name}\`.**`);
      return;
    }

    const timeLeft = cooldown(client, message, command);
    if (timeLeft) {
      const reply = await message.reply({ content: randomCooldownReply(timeLeft) });
      setTimeout(() => reply.delete().catch(() => {}), 3000);
      return;
    }

    if (command.category === 'OWNER' && !client.config.Owners.includes(message.author.id)) {
      await message.reply({
        embeds: [new EmbedBuilder().setColor(client.config.embed.errorcolor).setDescription(':rolling_eyes: **This command is for the bot owner only**')],
      });
      return;
    }

    if (!command.msgExecute) return;

    await client.errorHandler.safeExecute(() => command.msgExecute!(client, message, args, nprefix), {
      kind: 'command',
      name: command.name,
    });
  },
};

export default messageCreateEvent;
