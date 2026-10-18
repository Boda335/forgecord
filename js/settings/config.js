require('dotenv').config({ quiet: true });
const bot = {
  TOKEN: process.env.TOKEN || 'BOT_TOKEN',
  PREFIX: process.env.PREFIX || 'BOT_PREFIX',
  ID: process.env.ID || 'CLIENT_ID',
  REMEMBER_ENCRYPTION_KEY: process.env.REMEMBER_ENCRYPTION_KEY || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOGTAIL_ENABLE: process.env.LOGTAIL_ENABLE === 'true',
  LOGTAIL_SOURCE_TOKEN: process.env.LOGTAIL_SOURCE_TOKEN || '',
  LOGTAIL_INGESTION_HOST: process.env.LOGTAIL_INGESTION_HOST || '',
  DASHBOARD_ENABLED: process.env.DASHBOARD_ENABLED === 'true',
  DASHBOARD_PORT: Number(process.env.DASHBOARD_PORT || 3000),
  DASHBOARD_HOST: process.env.DASHBOARD_HOST || '127.0.0.1',
  Owners: (process.env.OWNER_IDS || '').split(',').map(id => id.trim()).filter(id => /^\d{17,20}$/.test(id)),
  Dev: process.env.DEVELOPER_LABEL || 'Bot Developer',
  DevTeam: process.env.DEVELOPER_TEAM_LABEL || 'Development Team',
};

const embedSettings = {
  color: '#9f4015',
  color_hex: 0x9f4015,

  successcolor: '#28a745',
  successcolor_hex: 0x28a745,

  warningcolor: '#ffcc00',
  warningcolor_hex: 0xffcc00,

  errorcolor: '#b50b0b',
  errorcolor_hex: 0xb50b0b,
};
const options = {
  embedFooter: true,
  debugMode: process.env.NODE_ENV !== 'production',
  dashboardProduction: true,
};
const emojiSettings = {
  ERROR: '❌',
  SUCCESS: '✅',
  disabled: '🔴',
  enabled: '🟢',
  cleared: '🧹',
  time: '⏲️',
  ping: '🏓',
  bot: '🤖',
};

const links = {
  store: process.env.STORE_URL || '',
  inviteURL: `https://discord.com/api/oauth2/authorize?client_id=BOTID&permissions=6508997968&scope=bot%20applications.commands`,
  DiscordServer: process.env.SUPPORT_SERVER_URL || '',
  Devloper: process.env.DEVELOPER_URL || '',
};

const slashSettings = {
  global: true,
  guildIDS: (process.env.SLASH_GUILD_IDS || '').split(',').map(id => id.trim()).filter(id => /^\d{17,20}$/.test(id)),
};

module.exports = {
  ...bot,
  embed: embedSettings,
  emoji: emojiSettings,
  links,
  options,
  slash: slashSettings,
};
