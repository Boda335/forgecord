import type { MessageComponentInteraction, ModalSubmitInteraction } from 'discord.js';
import { Logger } from '../core/logger';
import type { NexusClient } from '../types/client';

/**
 * Looks up the matching component handler in `client.ComponentsAction`
 * (populated once at startup/hot-reload by ComponentsLoader) instead of
 * re-scanning and re-`require()`-ing every file in ComponentsAction on every
 * single button click.
 */
export default async function handleInteraction(
  client: NexusClient,
  interaction: MessageComponentInteraction | ModalSubmitInteraction,
  parts?: string[]
): Promise<void> {
  if (!interaction.customId) {
    Logger.warn('Interaction has no customId.');
    return;
  }

  const segments = parts || interaction.customId.split('_');

  const handler =
    client.ComponentsAction.get(interaction.customId) ||
    client.ComponentsAction.find(h => h.customId === interaction.customId) ||
    client.ComponentsAction.find(h => h.name?.startsWith(segments[0]));

  if (!handler || handler.enabled === false) return;

  const memberPerms = (interaction.member as any)?.permissions;
  if (handler.userPermissions?.length && memberPerms && !memberPerms.has(handler.userPermissions)) {
    await interaction.reply({
      content: `🚫 You need \`${handler.userPermissions.join(', ')}\` to use this interaction.`,
      ephemeral: true,
    });
    return;
  }

  if (handler.botPermissions?.length && interaction.guild) {
    const me = interaction.guild.members.me;
    if (me && !me.permissions.has(handler.botPermissions)) {
      await interaction.reply({
        content: `🤖 I need \`${handler.botPermissions.join(', ')}\` to perform this action.`,
        ephemeral: true,
      });
      return;
    }
  }

  await client.errorHandler.safeExecute(() => handler.action(client, interaction, segments), {
    kind: 'component',
    name: handler.name,
  });
}
