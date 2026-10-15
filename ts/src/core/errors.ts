import type { ForgecordErrorMeta } from '../types/errors';
export type { ForgecordErrorMeta } from '../types/errors';

/**
 * Base error class for every error Forgecord throws itself. Having a common
 * base lets ErrorHandler branch on `instanceof ForgecordError` to tell
 * "expected/handled" framework errors apart from truly unexpected bugs.
 */
export class ForgecordError extends Error {
  code: string;
  context: Record<string, unknown>;

  constructor(message: string, meta: ForgecordErrorMeta = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = meta.code || 'FORGECORD_ERROR';
    this.context = meta.context || {};
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/** Thrown when a command/event/component file fails schema validation while loading. */
export class ValidationError extends ForgecordError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, { code: 'VALIDATION_ERROR', context });
  }
}

/** Thrown by loaders (Command/Event/Component/Function) on unrecoverable load failures. */
export class LoaderError extends ForgecordError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, { code: 'LOADER_ERROR', context });
  }
}

/** Thrown when a user or the bot itself is missing required permissions. */
export class PermissionError extends ForgecordError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, { code: 'PERMISSION_ERROR', context });
  }
}

/** Thrown when a plugin misbehaves (bad shape, throws during onLoad, duplicate name, ...). */
export class PluginError extends ForgecordError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, { code: 'PLUGIN_ERROR', context });
  }
}

/** Thrown when required .env / settings values are missing or left as placeholders. */
export class ConfigError extends ForgecordError {
  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message, { code: 'CONFIG_ERROR', context });
  }
}
