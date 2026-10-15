import { Collection } from 'discord.js';
import type { NexusClient } from '../types/client';
import type { CommandData } from '../types/command';
import type { CooldownSource } from '../types/cooldown';

/** Returns `false` if the command is off cooldown (and starts a new one), or the seconds left if it's still on cooldown. */
export default function cooldown(client: NexusClient, source: CooldownSource, cmd: CommandData): number | false;
export default function cooldown(source: { client: NexusClient } & CooldownSource, cmd: CommandData): number | false;
export default function cooldown(a: any, b: any, c?: any): number | false {
  const client: NexusClient = c ? a : a.client;
  const source: CooldownSource = c ? b : a;
  const cmd: CommandData = c ? c : b;

  if (!client || !cmd) return false;
  const userId = (source.member?.id || source.member?.user?.id || source.author?.id) as string;

  if (!client.cooldowns.has(cmd.name)) {
    client.cooldowns.set(cmd.name, new Collection());
  }

  const now = Date.now();
  const timestamps = client.cooldowns.get(cmd.name)!;
  const cooldownAmount = cmd.cooldown * 1000;

  if (timestamps.has(userId)) {
    const expirationTime = timestamps.get(userId)! + cooldownAmount;
    if (now < expirationTime) {
      return (expirationTime - now) / 1000;
    }
  }

  timestamps.set(userId, now);
  setTimeout(() => timestamps.delete(userId), cooldownAmount);
  return false;
}
