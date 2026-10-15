import type { IGoodDB } from 'good.db';
import { Client, Collection, GatewayIntentBits, Partials, EmbedBuilder, parseEmoji } from 'discord.js';
import type { User, Interaction, Message, MessageCreateOptions } from 'discord.js';
import fs from 'fs';
import path from 'path';
import msFn from 'ms';
import { Logger } from '../core/logger';
import { ErrorHandler } from '../core/ErrorHandler';
import { PluginManager } from '../core/PluginManager';
import type { HookBus } from '../types/plugin';
import { UpdateChecker } from '../handlers/UpdateChecker';
import { COMMANDS_DIR, PLUGINS_DIR, ROOT_DIR } from '../core/paths';
import config from '../../settings/config';
import frameworkSettings from '../../settings/framework';
import type { BotConfig } from '../../settings/config';
import type { ForgecordSettings } from '../../settings/framework';
import type { CommandData } from '../types/command';
import type { ComponentData } from '../types/component';
import type { AnyFunction } from '../types/function';
import type { ForgecordDatabaseConfig } from '../types/database';
import Database from './Database';


export class BaseNexus extends Client {
  db: IGoodDB | null = null;
  database: IGoodDB | null = null;
  databaseConfig: ForgecordDatabaseConfig;
  config: BotConfig = config;
  framework: ForgecordSettings = frameworkSettings;

  logger: typeof Logger;
  errorHandler: ErrorHandler;
  pluginManager: PluginManager;
  hooks!: HookBus; // assigned by PluginManager's constructor

  events = new Collection<string, unknown>();
  cooldowns = new Collection<string, Collection<string, number>>();
  commands = new Collection<string, CommandData>();
  aliases = new Collection<string, string>();
  functions = new Collection<string, AnyFunction>();
  statuses = new Collection<string, boolean>();
  ComponentsAction = new Collection<string, ComponentData>();
  buttons = new Collection<string, ComponentData>();
  menus = new Collection<string, ComponentData>();
  messageCommands = new Collection<string, CommandData>();
  slashCommands = new Collection<string, CommandData>();
  emojiTasks = new Map<string, Promise<string | null>>();
  clientMs = msFn;
  ms = msFn;
  formatDuration = (value: unknown): string => String(value);
  mcategories: string[];
  _forgecordEventListeners: Array<{ target: { removeListener?: (name: string, listener: (...args: unknown[]) => unknown) => unknown }; name: string; listener: (...args: unknown[]) => unknown }> = [];

  constructor(options: { database?: ForgecordDatabaseConfig } = {}) {
    super({
      partials: [Partials.Channel, Partials.GuildMember, Partials.Message, Partials.User],
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.DirectMessageReactions,
        GatewayIntentBits.DirectMessageTyping,
        GatewayIntentBits.GuildScheduledEvents,
        GatewayIntentBits.AutoModerationConfiguration,
        GatewayIntentBits.AutoModerationExecution,
        GatewayIntentBits.MessageContent,
      ],
      shards: 'auto',
      failIfNotExists: false,
      allowedMentions: {
        parse: ['everyone', 'roles', 'users'],
        users: [],
        roles: [],
        repliedUser: false,
      },
    });

    this.databaseConfig = options.database || { database_type: 'JSON' };
    this.db = this.createDatabase(this.databaseConfig);
    this.database = this.db;

    this.logger = Logger;

    this.errorHandler = new ErrorHandler(this, {
      fileLoggingEnabled: this.framework.errorLogging.enabled,
      webhookURL: this.framework.errorLogging.errorLogs,
    });

    // Sets this.hooks as a side effect.
    this.pluginManager = new PluginManager(this, PLUGINS_DIR);

    this.mcategories = fs.existsSync(COMMANDS_DIR) ? fs.readdirSync(COMMANDS_DIR) : [];

    this.checkForUpdates();
  }

  private createDatabase(dbOption: ForgecordDatabaseConfig): IGoodDB {
    switch (String(dbOption.database_type || 'JSON').toUpperCase()) {
      case 'JSON': return Database.db_default(dbOption);
      case 'SQLITE': return Database.db_sqlite(dbOption);
      case 'MONGODB': return Database.db_mongo(dbOption);
      case 'MYSQL': return Database.db_mysql(dbOption);
      default: throw new TypeError(`Unsupported database_type: ${String(dbOption.database_type)}`);
    }
  }

  async DBConnect(): Promise<void> {
    const type = String(this.databaseConfig.database_type || 'JSON').toUpperCase();
    if (!this.db) throw new Error('Database has not been initialized.');

    if (type === 'MONGODB' || type === 'MYSQL') {
      await this.db.connect();
      this.logger.info(`DB Connected to ${type}`);
    } else {
      this.logger.info(`DB initialized using ${type}`);
    }
    this.database = this.db;
  }

  table(name: string) {
    if (!this.db) throw new Error('Database has not been initialized.');
    return this.db.table(name);
  }

  async start(token: string): Promise<void> {
    this.errorHandler.attachProcessHandlers();
    await this.pluginManager.loadAll();

    const { default: loadCommands } = await import('../handlers/CommandLoader');
    const { default: loadEvents } = await import('../handlers/EventsLoader');
    const { default: loadFunctions } = await import('../handlers/FunctionsLoader');
    const { default: loadComponents } = await import('../handlers/ComponentsLoader');
    const { default: intro } = await import('../handlers/intro');

    await intro();
    await loadCommands(this);
    await loadEvents(this);
    await loadFunctions(this);
    await loadComponents(this);

    await this.login(token);
  }

  getFooter(user: User): { text: string; iconURL: string } | null {
    if (!this.config.options.embedFooter) return null;
    return {
      text: `Requested By ${user.username || (user as any).tag}`,
      iconURL: user.displayAvatarURL(),
    };
  }

  embed(target: Interaction | Message, data: string): Promise<unknown> {
    const user = 'user' in target ? target.user : target.author;
    const embed = new EmbedBuilder()
      .setColor(this.config.embed.color)
      .setDescription(`${data}`.substring(0, 3000));
    const footer = this.getFooter(user);
    if (footer) embed.setFooter(footer);

    if ('isRepliable' in target && target.isRepliable()) {
      const send = target.deferred ? target.followUp.bind(target) : target.reply.bind(target);
      return send({ embeds: [embed] }).catch(() => undefined);
    }
    return (target as Message).reply({ embeds: [embed] } as MessageCreateOptions).catch(() => undefined);
  }

  async loadEmojis(): Promise<void> {
    try {
      if (!this.application?.emojis) return;
      const emojis = await this.application.emojis.fetch();
      Logger.info(`Emojis loaded: ${emojis.size}`);
    } catch (error) {
      Logger.error('Error fetching emojis:', error);
    } finally {
      await this.loadLocalEmojis();
    }
  }

  async loadLocalEmojis(): Promise<void> {
    try {
      const emojiFolderPath = path.join(ROOT_DIR, 'emojis');
      if (!fs.existsSync(emojiFolderPath) || !fs.statSync(emojiFolderPath).isDirectory()) return;
      const allowedExtensions = new Set(['png', 'gif', 'jpg', 'jpeg']);
      const emojiFiles = fs.readdirSync(emojiFolderPath).filter((file) => allowedExtensions.has(path.extname(file).slice(1).toLowerCase()));

      for (const file of emojiFiles) {
        const emojiName = path.parse(file).name;
        if (this.getEmoji(emojiName, false)) continue;
        try {
          await this.createEmojiWithBuffer(emojiName, fs.readFileSync(path.join(emojiFolderPath, file)), true);
        } catch (error) {
          Logger.error(`Error creating emoji ${emojiName}:`, error);
        }
      }
    } catch (error) {
      Logger.error('Error loading local emojis:', error);
    }
  }

  getEmoji(emojiName: string, returnBlank = false): string | null {
    try {
      if (!emojiName) return returnBlank ? '' : null;
      const emoji = this.application?.emojis?.cache.find((item) => item.name?.toLowerCase().trim() === String(emojiName).toLowerCase().trim());
      return emoji ? emoji.toString() : returnBlank ? '' : null;
    } catch (error) {
      Logger.error('Error getting emoji:', error);
      return returnBlank ? '' : null;
    }
  }

  get emojisList(): Record<string, unknown> {
    try {
      const candidate = (this as BaseNexus & { emoji?: unknown }).emoji;
      if (typeof candidate === 'function') return (candidate as (client: BaseNexus) => Record<string, unknown>)(this);
      return (candidate as Record<string, unknown>) || {};
    } catch (error) {
      Logger.error('Error loading emoji list:', error);
      return {};
    }
  }

  createEmoji = async (emojiName: string, emojiUrl: string, force = false): Promise<string | null> => {
    if (!emojiName || !emojiUrl || !this.application?.emojis) return null;
    const existing = this.getEmoji(emojiName, false);
    if (existing && !force) return existing;
    if (this.emojiTasks.has(emojiName)) return this.emojiTasks.get(emojiName)!;
    const task = (async () => {
      try {
        const createdEmoji = await this.application!.emojis.create({ attachment: emojiUrl, name: emojiName });
        Logger.info(`Emoji ${createdEmoji.name} created`);
        return createdEmoji.toString();
      } finally {
        this.emojiTasks.delete(emojiName);
      }
    })();
    this.emojiTasks.set(emojiName, task);
    return task;
  };

  createEmojiWithBuffer = async (emojiName: string, buffer: Buffer, force = false): Promise<string | null> => {
    if (!emojiName || !buffer || !this.application?.emojis) return null;
    const existing = this.getEmoji(emojiName, false);
    if (existing && !force) return existing;
    const createdEmoji = await this.application.emojis.create({ attachment: buffer, name: emojiName });
    Logger.info(`Emoji ${createdEmoji.name} created`);
    return createdEmoji.toString();
  };

  deleteEmoji = async (emojiName: string): Promise<boolean> => {
    const emoji = this.getEmoji(emojiName, false);
    const id = emoji ? parseEmoji(emoji)?.id : undefined;
    if (!emoji || !id || !this.application?.emojis) return false;
    await this.application.emojis.delete(id);
    Logger.info(`Emoji ${emojiName} deleted`);
    return true;
  };

  Checker(): void {
    this.checkForUpdates();
  }

  private checkForUpdates() {
    setTimeout(async () => {
      try {
        const result = await UpdateChecker.checkVersionWithResult();
      if (!result.success) {
        this.logger.warn(`Update check failed: ${result.error}`);
        return;
      }
      if (result.updateAvailable) {
        this.logger.warn(`Forgecord has a new update available: ${result.latest}, you are on ${result.current}`);
      } else {
        this.logger.info(`Forgecord is up to date, you are on the latest version: ${result.current}`);
      }
      } catch (error) {
        this.logger.error('Unexpected error in Checker:', error);
      }
    }, 5000);
  }
}
