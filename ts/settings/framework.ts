export type PresenceActivityType = 'Playing' | 'Watching' | 'Listening' | 'Competing' | 'Custom' | 'Streaming';
export type PresenceStatus = 'online' | 'idle' | 'dnd' | 'invisible';

export interface ForgecordSettings {
  errorLogging: {
    enabled: boolean;
    errorLogs: string;
  };
  presence: {
    enabled: boolean;
    status: PresenceStatus;
    interval: number;
    type: PresenceActivityType;
    names: string[];
    streamingUrl?: string;
  };
}

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
      'Made by Boda3350',
      'Powered by Forgecord',
      'discord.gg/9cfgTktxHm',
    ],
    streamingUrl: 'https://www.twitch.tv/example',
  },
};

export default settings;
