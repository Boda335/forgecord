import 'dotenv/config';

import type { BotConfig } from '../src/types/config';
export type { BotConfig } from '../src/types/config';

const config: BotConfig = {
  TOKEN: process.env.TOKEN || 'BOT_TOKEN',
  PREFIX: process.env.PREFIX || 'BOT_PREFIX',
  ID: process.env.ID || 'CLIENT_ID',
  REMEMBER_ENCRYPTION_KEY: process.env.REMEMBER_ENCRYPTION_KEY || 'your_encryption_key_here',
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOGTAIL_ENABLE: process.env.LOGTAIL_ENABLE === 'true',
  LOGTAIL_SOURCE_TOKEN: process.env.LOGTAIL_SOURCE_TOKEN || '',
  LOGTAIL_INGESTION_HOST: process.env.LOGTAIL_INGESTION_HOST || '',
  Owners: ['OWNER_ID', 'OWNER_ID2', 'OWNER_ID3'],
  Dev: '```[Boda3350]```(https://discord.com/users/1139143053387509840)',
  DevTeam: '```[Nexus Studio Team]```(https://discord.gg/9cfgTktxHm)',
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
    store: 'https://nexshop.qzz.io/',
    inviteURL: 'https://discord.com/api/oauth2/authorize?client_id=BOTID&permissions=6508997968&scope=bot%20applications.commands',
    DiscordServer: 'https://discord.gg/9cfgTktxHm',
    Devloper: 'https://discord.com/users/1139143053387509840',
  },
  options: {
    embedFooter: true,
    debugMode: process.env.NODE_ENV !== 'production',
    dashboardProduction: true,
  },
  slash: {
    global: true,
    guildIDS: ['1344065394368839701'],
  },
};

export default config;
