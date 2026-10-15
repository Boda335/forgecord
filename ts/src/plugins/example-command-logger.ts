import { Logger } from '../core/logger';
import type { ForgecordPlugin } from '../core/PluginManager';

/**
 * Example plugin — drop any file like this in src/plugins/ and Forgecord
 * loads it automatically at startup. No core files need to change.
 */
const exampleCommandLogger: ForgecordPlugin = {
  name: 'example-command-logger',

  async onLoad(client) {
    client.hooks.on('commandError', ({ error, context }) => {
      Logger.warn(`example-command-logger saw an error in ${context.kind} "${context.name}": ${error.message}`);
    });

    client.hooks.on('loaderComplete', ({ name, loaded, failed }) => {
      if (failed > 0) {
        Logger.warn(`example-command-logger: ${failed}/${loaded + failed} ${name} failed to load`);
      }
    });
  },
};

export default exampleCommandLogger;
