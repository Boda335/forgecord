export interface BotInfo {
  name: string;
  language: 'JavaScript' | 'TypeScript' | 'Python' | string;
  status: 'online' | 'starting' | string;
  dashboard: 'enabled' | 'disabled' | string;
}

export interface DashboardUser {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
}

export interface DashboardSession {
  authenticated: boolean;
  user: DashboardUser | null;
}

export interface DiscordServer {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export interface ApiErrorShape {
  error?: string;
  detail?: string;
}
