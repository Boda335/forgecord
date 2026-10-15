import type { MessageComponentInteraction, ModalSubmitInteraction, PermissionResolvable } from 'discord.js';
import type { NexusClient } from './client';

export interface ComponentData {
  name: string;
  customId?: string;
  enabled: boolean;
  botPermissions?: PermissionResolvable[];
  userPermissions?: PermissionResolvable[];
  action: (
    client: NexusClient,
    interaction: MessageComponentInteraction | ModalSubmitInteraction,
    parts: string[],
  ) => Promise<unknown> | unknown;
}
