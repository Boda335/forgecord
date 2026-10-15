import { ApplicationCommandOptionType, EmbedBuilder, PermissionsBitField } from 'discord.js';
import cooldown from '../../functions/cooldown';
import getPermissionName from '../../functions/getPermissionName';
import handleInteraction from '../../functions/handleInteraction';
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

const interactionCreateEvent: BaseEvent<'interactionCreate'> = {
  name: 'interactionCreate',
  target: 'client',
  once: false,
  async execute(client, interaction) {
    const { emoji } = client.config;

    if (interaction.isAutocomplete()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd || typeof cmd.autocompleteExecute !== 'function') return;

      await client.errorHandler.safeExecute(() => cmd.autocompleteExecute!(client, interaction), {
        kind: 'autocomplete',
        name: cmd.name,
      });
      return;
    }

    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) {
        client.embed(interaction, `${emoji.ERROR} \`${interaction.commandName}\` Command Not Found`);
        return;
      }

      const args: unknown[] = [];
      for (const option of interaction.options.data) {
        if (option.type === ApplicationCommandOptionType.Subcommand) {
          if (option.name) args.push(option.name);
          option.options?.forEach(x => {
            if (x.value) args.push(x.value);
          });
        } else if (option.value !== undefined) {
          args.push(option.value);
        }
      }

      if (cmd.userPermissions?.length && !(interaction.member!.permissions as PermissionsBitField).has(cmd.userPermissions as any)) {
        const needPerms = getPermissionName(new PermissionsBitField(cmd.userPermissions as any).bitfield);
        client.embed(interaction, `**:rolling_eyes: You need ${needPerms!.map(p => `\`${p}\``).join(', ')} for this command**`);
        return;
      }

      if (cmd.botPermissions?.length && !interaction.guild!.members.me!.permissions.has(cmd.botPermissions as any)) {
        const needPerms = getPermissionName(new PermissionsBitField(cmd.botPermissions as any).bitfield);
        client.embed(interaction, `**:rolling_eyes: I need ${needPerms!.map(p => `\`${p}\``).join(', ')} for this command**`);
        return;
      }

      const timeLeft = cooldown(client, interaction, cmd);
      if (timeLeft) {
        await interaction.reply({ content: randomCooldownReply(timeLeft), ephemeral: true });
        return;
      }

      if (cmd.category === 'OWNER' && !client.config.Owners.includes(interaction.user.id)) {
        await interaction.reply({
          embeds: [new EmbedBuilder().setColor(client.config.embed.errorcolor).setDescription(':rolling_eyes: **This command is for the bot owner only**')],
        });
        return;
      }

      await client.errorHandler.safeExecute(() => cmd.interactionExecute!(client, interaction, args), {
        kind: 'command',
        name: cmd.name,
      });
      return;
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

export default interactionCreateEvent;
