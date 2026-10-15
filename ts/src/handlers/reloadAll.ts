import loadCommands from './CommandLoader';
import loadFunctions from './FunctionsLoader';
import loadComponents from './ComponentsLoader';
import type { NexusClient } from '../types/client';
import type { ReloadAllResult } from '../types/reload';
export type { ReloadSummary, ReloadAllResult } from '../types/reload';

/** Runs every loader in parallel since they're fully independent of each other. */
export default async function reloadAll(client: NexusClient): Promise<ReloadAllResult> {
  const [commands, functions, interactions] = await Promise.all([
    loadCommands(client),
    loadFunctions(client),
    loadComponents(client),
  ]);

  return {
    commands: { loaded: commands.loaded, failed: commands.failed },
    functions: { loaded: functions.loaded, failed: functions.failed },
    interactions: { loaded: interactions.loaded, failed: interactions.failed },
  };
}
