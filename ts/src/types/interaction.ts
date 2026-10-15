import type { Interaction, Message } from 'discord.js';

export type RepliableInteraction = Interaction & {
  deferred?: boolean;
  followUp: (opts: any) => Promise<Message>;
  reply: (opts: any) => Promise<Message>;
  guild: any;
};
