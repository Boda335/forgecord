import { ForgecordSettings } from '../src/types/framework';

const settings: ForgecordSettings = {
  errorLogging: {
    enabled: false,
    errorLogs: 'WEBHOOK_URL',
  },
  presence: {
    enabled: true,
    status: 'idle',
    interval: 10000,
    type: 'Custom',
    names: [
      'https://discord.gg/9cfgTktxHm',
      'Made by Nexus Studio Team',
      'Made with Forgecord',
      'Powered by Forgecord',
      'discord.gg/9cfgTktxHm',
    ],
    streamingUrl: 'https://www.twitch.tv/example',
  },
};

export default settings;
