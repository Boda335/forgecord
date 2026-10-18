type PresenceActivityType = 'Playing' | 'Watching' | 'Listening' | 'Competing' | 'Custom' | 'Streaming';
type PresenceStatus = 'online' | 'idle' | 'dnd' | 'invisible';

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