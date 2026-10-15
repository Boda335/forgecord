const { ActivityType } = require('discord.js');
const registerSlashCommands = require('../../functions/registerSlashCommands');
const framework = require('../../../settings/framework.js');
const BEV = require('@base/baseEvents');

/** @type {BEV.BaseEvent<"clientReady">} */
module.exports = {
  name: 'clientReady',
  target: 'client',
  once: true,
  async execute(client) {
    try {
      const presenceConfig = framework.presence || {};
      if (presenceConfig.enabled) {
        const names = Array.isArray(presenceConfig.names) ? presenceConfig.names : [presenceConfig.names];

        let index = 0;
        setInterval(() => {
          client.user.setActivity({ name: names[index], type: ActivityType[presenceConfig.type] || ActivityType.Playing, url: presenceConfig.type.toUpperCase() === 'STREAMING' ? presenceConfig.streamingUrl : undefined });
          index = (index + 1) % names.length;
        }, presenceConfig.interval);

        client.user.setStatus(presenceConfig.status);
      }

      await client.DBConnect();
      await registerSlashCommands(client);

      client.logger.info(`Bot logged in successfully! Username: ${client.user.tag} | ID: ${client.user.id}`);
    } catch (error) {
      client.logger.error(`Error occurred while logging in: ${error.message}`);
    }
  },
};
