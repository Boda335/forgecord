import type {
  ApplicationCommandOptionData,
  ApplicationCommandType,
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Message,
  PermissionResolvable,
} from 'discord.js';
import type { NexusClient } from './client';

export type CommandCategory =
  | 'ADMIN' | 'ANIME' | 'AUTOMOD' | 'ECONOMY' | 'FUN' | 'IMAGE'
  | 'INFORMATION' | 'INVITE' | 'MODERATION' | 'NONE' | 'OWNER'
  | 'SOCIAL' | 'PUBLIC' | 'TICKET' | 'UTILITY'
  | (string & {});

export interface Validation {
  callback: (...args: unknown[]) => boolean | Promise<boolean>;
  message: string;
}

export interface SubCommand {
  trigger: string;
  description: string;
}

export interface InteractionInfo {
  enabled: boolean;
  ephemeral?: boolean;
}

export interface CommandInfo {
  enabled: boolean;
  aliases?: string[];
  usage?: string;
  minArgsCount?: number;
  subcommands?: SubCommand[];
}

export interface CommandData {
  name: string;
  description: string;
  cooldown: number;
  isPremium?: boolean;
  category: CommandCategory;
  about?: string;
  emoji?: string;
  botPermissions?: PermissionResolvable[];
  userPermissions?: PermissionResolvable[];
  validations?: Validation[];
  options?: ApplicationCommandOptionData[];
  type?: ApplicationCommandType;
  dmonly?: boolean;
  userInstall?: boolean;
  command: CommandInfo;
  slashCommand: InteractionInfo;
  msgExecute?: (client: NexusClient, message: Message, args: string[], usedPrefix?: string) => Promise<unknown> | unknown;
  interactionExecute?: (client: NexusClient, interaction: ChatInputCommandInteraction, args?: unknown[]) => Promise<unknown> | unknown;
  autocompleteExecute?: (client: NexusClient, interaction: AutocompleteInteraction) => Promise<unknown> | unknown;
}
