'use strict';

/**
 * Base error class for every error Forgecord throws itself.
 * Having a common base lets ErrorHandler branch on `instanceof ForgecordError`
 * to tell "expected/handled" framework errors apart from truly unexpected bugs.
 */
class ForgecordError extends Error {
  /**
   * @param {string} message
   * @param {Object} [meta]
   * @param {string} [meta.code] - short machine-readable code, e.g. "LOADER_INVALID_SCHEMA"
   * @param {Record<string, any>} [meta.context] - any extra structured info (file path, command name, ...)
   */
  constructor(message, meta = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = meta.code || 'FORGECORD_ERROR';
    this.context = meta.context || {};
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/** Thrown when a command/event/component file fails schema validation while loading. */
class ValidationError extends ForgecordError {
  constructor(message, context = {}) {
    super(message, { code: 'VALIDATION_ERROR', context });
  }
}

/** Thrown by loaders (Command/Event/Component/Function) on unrecoverable load failures. */
class LoaderError extends ForgecordError {
  constructor(message, context = {}) {
    super(message, { code: 'LOADER_ERROR', context });
  }
}

/** Thrown when a user or the bot itself is missing required permissions. */
class PermissionError extends ForgecordError {
  constructor(message, context = {}) {
    super(message, { code: 'PERMISSION_ERROR', context });
  }
}

/** Thrown when a plugin misbehaves (bad shape, throws during onLoad, duplicate name, ...). */
class PluginError extends ForgecordError {
  constructor(message, context = {}) {
    super(message, { code: 'PLUGIN_ERROR', context });
  }
}

/** Thrown when required .env / settings values are missing or left as placeholders. */
class ConfigError extends ForgecordError {
  constructor(message, context = {}) {
    super(message, { code: 'CONFIG_ERROR', context });
  }
}

module.exports = { ForgecordError, ValidationError, LoaderError, PermissionError, PluginError, ConfigError };
