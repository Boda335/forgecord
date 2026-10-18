import 'dotenv/config';

import type { BotConfig } from '../src/types/config';
export type { BotConfig } from '../src/types/config';

const config: BotConfig = {
  TOKEN: process.env.TOKEN || 'BOT_TOKEN',
  PREFIX: process.env.PREFIX || 'BOT_PREFIX',
  ID: process.env.ID || 'CLIENT_ID',
  REMEMBER_ENCRYPTION_KEY: process.env.REMEMBER_ENCRYPTION_KEY || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOGTAIL_ENABLE: process.env.LOGTAIL_ENABLE === 'true',
  LOGTAIL_SOURCE_TOKEN: process.env.LOGTAIL_SOURCE_TOKEN || '',
  LOGTAIL_INGESTION_HOST: process.env.LOGTAIL_INGESTION_HOST || '',
  Owners: (process.env.OWNER_IDS || '').split(',').map(id => id.trim()).filter(id => /^\d{17,20}$/.test(id)),
  Dev: process.env.DEVELOPER_URL ? `[Bot Developer](${process.env.DEVELOPER_URL})` : 'Bot Developer',
  DevTeam: process.env.SUPPORT_SERVER_URL ? `[Development Team](${process.env.SUPPORT_SERVER_URL})` : 'Development Team',
  embed: {
    color: '#9f4015',
    successcolor: '#28a745',
    warningcolor: '#ffcc00',
    errorcolor: '#b50b0b',
  },
  emoji: {
    ERROR: '❌',
    SUCCESS: '✅',
    disabled: '🔴',
    enabled: '🟢',
    cleared: '🧹',
    time: '⏲️',
    ping: '🏓',
    bot: '🤖',
  },
  links: {
    store: process.env.STORE_URL || '',
    inviteURL: 'https://discord.com/api/oauth2/authorize?client_id=BOTID&permissions=6508997968&scope=bot%20applications.commands',
    DiscordServer: process.env.SUPPORT_SERVER_URL || '',
    Devloper: process.env.DEVELOPER_URL || '',
  },
  options: {
    embedFooter: true,
    debugMode: process.env.NODE_ENV !== 'production',
    dashboardProduction: true,
  },
  slash: {
    global: true,
    guildIDS: (process.env.SLASH_GUILD_IDS || '').split(',').map(id => id.trim()).filter(id => /^\d{17,20}$/.test(id)),
  },
};

export default config;
