export type AnyFunction = (...args: any[]) => any;
export type BaseFunctionInteraction = (
  client: import('./client').NexusClient,
  interaction: import('discord.js').ChatInputCommandInteraction,
  isEdit?: boolean,
) => Promise<void> | void;
