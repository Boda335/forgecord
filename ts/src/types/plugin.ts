import type { EventEmitter } from 'events';
import type { NexusClient } from './client';

export interface ForgecordHookEvents {
  loaderComplete: { name: string; loaded: number; failed: number };
  commandError: { error: Error; context: Record<string, unknown> };
  commandExecuted: { name: string; kind: string; userId?: string };
  ready: { client: NexusClient };
}

export interface HookBus extends EventEmitter {
  on<K extends keyof ForgecordHookEvents>(event: K, listener: (payload: ForgecordHookEvents[K]) => void): this;
  emit<K extends keyof ForgecordHookEvents>(event: K, payload: ForgecordHookEvents[K]): boolean;
}

export interface ForgecordPlugin {
  name: string;
  onLoad?(client: NexusClient): void | Promise<void>;
}
