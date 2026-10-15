'use strict';

/**
 * Example plugin — drop any file like this in src/plugins/ and Forgecord
 * loads it automatically at startup. No core files need to change.
 *
 * Delete this file (or just don't ship it) if you don't need it; it's here
 * purely as a template for the plugin system.
 */
module.exports = {
  name: 'example-command-logger',

  async onLoad(client) {
    client.hooks.on('commandError', ({ error, context }) => {
      // e.g. forward to your own metrics/analytics service here
      client.warn(`example-command-logger saw an error in ${context.kind} "${context.name}": ${error.message}`);
    });

    client.hooks.on('loaderComplete', ({ name, loaded, failed }) => {
      if (failed > 0) {
        client.warn(`example-command-logger: ${failed}/${loaded + failed} ${name} failed to load`);
      }
    });
  },
};
