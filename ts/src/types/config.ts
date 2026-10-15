export interface BotConfig {
  TOKEN: string;
  PREFIX: string;
  ID: string;
  REMEMBER_ENCRYPTION_KEY: string;
  NODE_ENV: 'development' | 'production' | string;
  LOGTAIL_ENABLE: boolean;
  LOGTAIL_SOURCE_TOKEN: string;
  LOGTAIL_INGESTION_HOST: string;
  Owners: string[];
  Dev: string;
  DevTeam: string;
  embed: { color: `#${string}`; successcolor: `#${string}`; warningcolor: `#${string}`; errorcolor: `#${string}` };
  emoji: Record<string, string>;
  links: { store: string; inviteURL: string; DiscordServer: string; Devloper: string };
  options: { embedFooter: boolean; debugMode?: boolean; dashboardProduction?: boolean };
  slash: { global: boolean; guildIDS: string[] };
}
