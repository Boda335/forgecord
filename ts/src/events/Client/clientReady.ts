import { ActivityType } from 'discord.js';
import registerSlashCommands from '../../functions/registerSlashCommands';
import type { BaseEvent } from '../../Base/baseEvents';

const readyEvent: BaseEvent<'clientReady'> = {
  name: 'clientReady',
  target: 'client',
  once: true,
  async execute(client) {
    const presenceConfig = client.framework.presence;
    if (presenceConfig?.enabled) {
      const names = presenceConfig.names;
      let index = 0;

      setInterval(() => {
        client.user!.setActivity({
          name: names[index],
          type: (ActivityType as any)[presenceConfig.type] ?? ActivityType.Playing,
          url: presenceConfig.type.toUpperCase() === 'STREAMING' ? presenceConfig.streamingUrl : undefined,
        });
        index = (index + 1) % names.length;
      }, presenceConfig.interval);

      client.user!.setStatus(presenceConfig.status);
    }

    await client.DBConnect();
    await registerSlashCommands(client);

    client.logger.info(`Bot logged in successfully! Username: ${client.user!.tag} | ID: ${client.user!.id}`);
  },
};

export default readyEvent;
