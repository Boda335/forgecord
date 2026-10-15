'use strict';

const { Client, Collection, GatewayIntentBits, Partials, EmbedBuilder, ActivityType, parseEmoji, SnowflakeUtil } = require('discord.js');

const fs = require('fs');
const path = require('path');
const ms = require('ms');
const Database = require('./Database.js');
const { Logger } = require('../core/logger.js');
const ErrorHandler = require('../core/ErrorHandler');
const PluginManager = require('../core/PluginManager');
const UpdateChecker = require('../handlers/UpdateChecker');
const { COMMANDS_DIR, PLUGINS_DIR, ROOT_DIR } = require('../core/paths');

class BaseNexus extends Client {
  /**
   * @constructor
   * @param {{ database?: import('../handlers/Nexus.js').DataBase }} [options={}]
   */
  constructor(options = {}) {
    super({
      partials: [Partials.Channel, Partials.GuildMember, Partials.Message, Partials.User],

      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildModeration, GatewayIntentBits.GuildEmojisAndStickers, GatewayIntentBits.GuildIntegrations, GatewayIntentBits.GuildWebhooks, GatewayIntentBits.GuildInvites, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMessageTyping, GatewayIntentBits.DirectMessages, GatewayIntentBits.DirectMessageReactions, GatewayIntentBits.DirectMessageTyping, GatewayIntentBits.GuildScheduledEvents, GatewayIntentBits.AutoModerationConfiguration, GatewayIntentBits.AutoModerationExecution, GatewayIntentBits.MessageContent],

      shards: 'auto',

      failIfNotExists: false,

      allowedMentions: {
        parse: ['everyone', 'roles', 'users'],
        users: [],
        roles: [],
        repliedUser: false,
      },
    });
    this.config = require('../../settings/config');
    this.databaseConfig = options.database || { database_type: 'JSON' };
    /** @type {import('good.db').IGoodDB | null} */
    this.db = this.createDatabase(this.databaseConfig);
    /** @type {import('good.db').IGoodDB | null} Backward-friendly alias for client.db. */
    this.database = this.db;
    this.framework = require('../../settings/framework');

    this.logger = Logger;

    this.errorHandler = new ErrorHandler(this, {
      fileLoggingEnabled: this.framework.errorLogging?.enabled ?? false,

      webhookURL: this.framework.errorLogging?.errorLogs,
    });

    this.pluginManager = new PluginManager(this, PLUGINS_DIR);

    this.events = new Collection();
    this.commands = new Collection();
    this.aliases = new Collection();
    this.cooldowns = new Collection();
    this.statuses = new Collection();

    // Functions
    this.functions = new Collection();

    // Components
    this.ComponentsAction = new Collection();
    this.buttons = new Collection();
    this.menus = new Collection();

    // Commands
    this.messageCommands = new Collection();
    this.slashCommands = new Collection();

    // Emoji tasks
    this.emojiTasks = new Map();

    this.mcategories = fs.existsSync(COMMANDS_DIR) ? fs.readdirSync(COMMANDS_DIR) : [];

    this.clientMs = ms;
    this.ms = ms;

    this.formatDuration = value => String(value);

    this.Checker();
  }
  createDatabase(dbOption) {
    const type = String(dbOption?.database_type || 'JSON').toUpperCase();
    switch (type) {
      case 'JSON': return Database.db_default(dbOption);
      case 'SQLITE': return Database.db_sqlite(dbOption);
      case 'MONGODB': return Database.db_mongo(dbOption);
      case 'MYSQL': return Database.db_mysql(dbOption);
      default: throw new TypeError(`Unsupported database_type: ${dbOption?.database_type}`);
    }
  }

  async DBConnect() {
    const type = String(this.databaseConfig?.database_type || 'JSON').toUpperCase();
    if (!this.db) throw new Error('Database has not been initialized.');

    if (type === 'MONGODB' || type === 'MYSQL') {
      await this.db.connect();
      this.logger.info(`DB Connected to ${type}`);
    } else {
      this.logger.info(`DB initialized using ${type}`);
    }
    this.database = this.db;
  }

  table(name) {
    if (!this.db) throw new Error('Database has not been initialized.');
    return this.db.table(name);
  }

  Checker() {
    setTimeout(() => {
      UpdateChecker.checkVersion();
    }, 1000);
  }

  async start(token) {
    await this.pluginManager.loadAll();

    for (const handler of ['intro', 'CommandLoader', 'EventsLoader', 'FunctionsLoader', 'ComponentsLoader']) {
      await require(`../handlers/${handler}`)(this);
    }

    await this.login(token);
  }

  getFooter(user) {
    if (!this.config.options?.embedFooter) {
      return null;
    }

    return {
      text: `Requested By ${user.username || user.tag}`,
      iconURL: user.displayAvatarURL(),
    };
  }

  embed(interaction, data) {
    const user = interaction.user || interaction.author;

    const embed = new EmbedBuilder().setColor(this.config.embed.color).setDescription(`${data}`.substring(0, 3000)).setFooter(this.getFooter(user));

    const send = interaction.deferred ? interaction.followUp.bind(interaction) : interaction.reply.bind(interaction);

    return send({
      embeds: [embed],
    }).catch(() => {});
  }

  async loadEmojis() {
    try {
      if (!this.application?.emojis) {
        return;
      }

      const emojis = await this.application.emojis.fetch();

      Logger.info(`Emojis loaded: ${emojis.size}`);
    } catch (error) {
      Logger.error('Error fetching emojis:', error);
    } finally {
      await this.loadLocalEmojis();
    }
  }

  async loadLocalEmojis() {
    try {
      const emojiFolderPath = path.join(ROOT_DIR, 'emojis');

      if (!fs.existsSync(emojiFolderPath) || !fs.statSync(emojiFolderPath).isDirectory()) {
        return;
      }

      const allowedExtensions = ['png', 'gif', 'jpg', 'jpeg'];

      const emojiFiles = fs.readdirSync(emojiFolderPath).filter(file => {
        const extension = file.split('.').pop()?.toLowerCase();

        return allowedExtensions.includes(extension);
      });

      for (const file of emojiFiles) {
        const emojiName = path.parse(file).name;

        // Already exists
        if (this.getEmoji(emojiName, false)) {
          continue;
        }

        try {
          const buffer = fs.readFileSync(path.join(emojiFolderPath, file));

          await this.createEmojiWithBuffer(emojiName, buffer, true);
        } catch (error) {
          Logger.error(`Error creating emoji ${emojiName}:`, error);
        }
      }
    } catch (error) {
      Logger.error('Error loading local emojis:', error);
    }
  }

  getEmoji = (emojiName, returnBlank = false) => {
    try {
      if (!emojiName) {
        return returnBlank ? '' : null;
      }

      const emoji = this.application?.emojis?.cache.find(emoji => emoji.name?.toLowerCase().trim() === String(emojiName).toLowerCase().trim());

      return emoji ? emoji.toString() : returnBlank ? '' : null;
    } catch (error) {
      Logger.error('Error getting emoji:', error);

      return returnBlank ? '' : null;
    }
  };

  get emojisList() {
    try {
      if (typeof this.emoji === 'function') {
        return this.emoji(this);
      }

      return this.emoji || {};
    } catch (error) {
      Logger.error('Error loading emoji list:', error);

      return {};
    }
  }

  createEmoji = async (emojiName, emojiUrl, force = false) => {
    if (!emojiName || !emojiUrl) {
      return null;
    }

    const existing = this.getEmoji(emojiName, false);

    if (existing && !force) {
      return existing;
    }

    // Prevent duplicate requests
    if (this.emojiTasks.has(emojiName)) {
      return this.emojiTasks.get(emojiName);
    }

    const task = (async () => {
      try {
        const createdEmoji = await this.application.emojis.create({
          attachment: emojiUrl,
          name: emojiName,
        });

        Logger.info(`Emoji ${createdEmoji.name} created`);

        return createdEmoji.toString();
      } finally {
        this.emojiTasks.delete(emojiName);
      }
    })();

    this.emojiTasks.set(emojiName, task);

    return task;
  };

  createEmojiWithBuffer = async (emojiName, buffer, force = false) => {
    if (!emojiName || !buffer) {
      return null;
    }

    const existing = this.getEmoji(emojiName, false);

    if (existing && !force) {
      return existing;
    }

    const createdEmoji = await this.application.emojis.create({
      attachment: buffer,
      name: emojiName,
    });

    Logger.info(`Emoji ${createdEmoji.name} created`);

    return createdEmoji.toString();
  };

  deleteEmoji = async emojiName => {
    const emoji = this.getEmoji(emojiName, false);

    const id = emoji && parseEmoji(emoji)?.id;

    if (!emoji || !id) {
      return false;
    }

    await this.application.emojis.delete(id);

    Logger.info(`Emoji ${emojiName} deleted`);

    return true;
  };

  Checker() {
    setTimeout(async () => {
      try {
        const result = await UpdateChecker.checkVersionWithResult();

        if (!result.success) {
          Logger.warn(`Update check failed: ${result.error}`);

          return;
        }

        if (result.updateAvailable) {
          Logger.warn(`Forgecord has a new update available: ${result.latest}, you are on ${result.current}`);
        } else {
          Logger.info(`Forgecord is up to date, you are on the latest version: ${result.current}`);
        }
      } catch (error) {
        Logger.error('Unexpected error in Checker:', error);
      }
    }, 5000);
  }
}

module.exports = BaseNexus;
