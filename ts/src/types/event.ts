import type { ClientEvents } from 'discord.js';
import type { NexusClient } from './client';

export interface BaseEvent<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  target: string;
  once: boolean;
  execute: (client: NexusClient, ...args: ClientEvents[K]) => Promise<unknown> | unknown;
}
