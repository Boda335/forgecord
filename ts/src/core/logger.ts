import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { Logtail } from '@logtail/node';
import { LogtailTransport } from '@logtail/winston';
import path from 'path';
import { fileURLToPath } from 'url';
import util from 'util';
import chalk from 'chalk';
import config from '../../settings/config';
import { ROOT_DIR } from './paths';

export class Logger {
  private static logger = Logger.createLogger();

  private static createLogger(): winston.Logger {
    const fileTransport = new DailyRotateFile({
      filename: 'logs/%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '5',
    });

    const customConsoleFormat = winston.format.printf(info => {
      const { level, message } = info;
      const time = new Date();
      const timeStr = chalk.gray(
        `[${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}:${String(time.getSeconds()).padStart(2, '0')}]`,
      );

      let tagColored = '';
      switch (level) {
        case 'info':
          tagColored = chalk.green('[LOG]');
          break;
        case 'warn':
          tagColored = chalk.yellow('[WARN]');
          break;
        case 'error':
          tagColored = chalk.red('[ERROR]');
          break;
        case 'debug':
          tagColored = chalk.magenta('[DEBUG]');
          break;
        default:
          tagColored = chalk.white(`[${String(level).toUpperCase()}]`);
          break;
      }

      const formattedMsg = typeof message === 'object'
        ? util.inspect(message, { depth: null, colors: false })
        : message;

      const source = info.source ? chalk.blue(String(info.source)) : chalk.blue('[unknown]');
      return `${timeStr} ${tagColored} ${source} ${formattedMsg}`;
    });

    const consoleTransport = new winston.transports.Console({
      format: customConsoleFormat,
    });

    const logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'discord-bot' },
      transports: [fileTransport],
      exitOnError: false,
    });

    logger.exceptions.handle(new winston.transports.File({ filename: 'logs/exceptions.log' }));
    logger.rejections.handle(new winston.transports.File({ filename: 'logs/rejections.log' }));

    logger.on('error', error => {
      console.error('Logger internal error:', error);
    });

    if (process.env.NODE_ENV !== 'production') {
      logger.add(consoleTransport);
    }

    if (process.env.LOGTAIL_ENABLE === 'true') {
      try {
        const token = process.env.LOGTAIL_SOURCE_TOKEN;
        const endpoint = process.env.LOGTAIL_INGESTION_HOST;

        if (!token || token.length <= 1) throw new Error('Logtail source token is missing');
        if (!endpoint || !endpoint.includes('https://')) {
          throw new Error('Logtail ingestion host is missing or invalid format (https://)');
        }

        const logtail = new Logtail(token, { endpoint });
        logger.add(new LogtailTransport(logtail, { level: 'info' }));
      } catch (error) {
        console.error('Failed to initialize Logtail:', error);
      }
    }

    return logger;
  }

  private static getCallerFile(): string {
    try {
      const originalPrepare = Error.prepareStackTrace;
      Error.prepareStackTrace = (_, stack) => stack;
      const stack = new Error().stack as unknown as NodeJS.CallSite[] | undefined;
      Error.prepareStackTrace = originalPrepare;

      for (const frame of stack ?? []) {
        let fileName = frame?.getFileName?.();
        const line = frame?.getLineNumber?.();
        if (!fileName) continue;
        if (fileName.startsWith('node:')) continue;
        if (fileName.includes(`${path.sep}node_modules${path.sep}`)) continue;
        if (fileName === __filename) continue;
        if (fileName.startsWith('file://')) fileName = fileURLToPath(fileName);
        return `[${path.relative(ROOT_DIR, fileName)}:${line || 0}]`;
      }
    } catch {}

    return '[unknown]';
  }

  private static formatArgs(args: unknown[]): string {
    return args
      .map(arg => {
        if (arg instanceof Error) return arg.stack || arg.message;
        if (typeof arg === 'object' && arg !== null) {
          return util.inspect(arg, { depth: null, colors: false });
        }
        return String(arg);
      })
      .join(' ');
  }

  static info(...args: unknown[]): void {
    Logger.logger.info(Logger.formatArgs(args), { source: Logger.getCallerFile() });
  }

  static error(...args: unknown[]): void {
    Logger.logger.error(Logger.formatArgs(args), { source: Logger.getCallerFile() });
  }

  static warn(...args: unknown[]): void {
    Logger.logger.warn(Logger.formatArgs(args), { source: Logger.getCallerFile() });
  }

  static debug(...args: unknown[]): void {
    const message = Logger.formatArgs(args);

    if (config?.options?.debugMode === true) {
      Logger.logger.info(message, {
        source: Logger.getCallerFile(),
      });
    }

    Logger.logger.debug(message, {
      source: Logger.getCallerFile(),
    });
  }

  static async logToFile(content: string): Promise<string | null> {
    try {
      const fs = await import('fs/promises');
      const filePath = path.join(process.cwd(), 'errors', `${new Date().toISOString().replace(/:/g, '-')}.txt`);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content, 'utf8');
      return filePath;
    } catch {
      return null;
    }
  }
}

if (!process.send) {
  process.on('unhandledRejection', reason => Logger.error('Unhandled rejection', reason));
  process.on('uncaughtException', err => Logger.error('Uncaught exception', err));
}
