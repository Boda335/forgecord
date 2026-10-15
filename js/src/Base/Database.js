'use strict';

const fs = require('fs');
const path = require('path');
const { GoodDB, JSONDriver, MongoDBDriver, SQLiteDriver, MySQLDriver } = require('good.db');
const { ROOT_DIR } = require('../core/paths');

const DATABASE_DIR = path.join(ROOT_DIR, 'database');
const JSON_PATH = path.join(DATABASE_DIR, 'database.json');
const SQLITE_PATH = path.join(DATABASE_DIR, 'database.sqlite');

function ensureDatabaseDir() {
  fs.mkdirSync(DATABASE_DIR, { recursive: true });
}

const DEFAULT_OPTIONS = {
  nested: '..',
  nestedIsEnabled: true,
  table: 'ForgecordDB',
  cache: {
    capacity: 1024,
    isEnabled: true,
  },
};

class GDB extends GoodDB {
  /**
   * @param {object} driver
   * @param {import('good.db/dist/Types').goodDBOptions} options
   * @param {import('../handlers/Nexus').DataBase} dbOption
   */
  constructor(driver, options = DEFAULT_OPTIONS, dbOption) {
    super(driver, dbOption?.options || options);
  }
}

module.exports = class Database {
  /** @param {import('../handlers/Nexus').DataBase} [dbOption] */
  static db_default(dbOption = {}) {
    ensureDatabaseDir();
    return new GDB(
      new JSONDriver({ path: JSON_PATH, format: true }),
      DEFAULT_OPTIONS,
      dbOption
    );
  }

  /** @param {import('../handlers/Nexus').DataBase} [dbOption] */
  static db_sqlite(dbOption = {}) {
    ensureDatabaseDir();
    return new GDB(
      new SQLiteDriver({ path: SQLITE_PATH }),
      DEFAULT_OPTIONS,
      dbOption
    );
  }

  /** @param {import('../handlers/Nexus').DataBase} [dbOption] */
  static db_mongo(dbOption = {}) {
    return new GDB(
      new MongoDBDriver(dbOption.MongoDB),
      DEFAULT_OPTIONS,
      dbOption
    );
  }

  /** @param {import('../handlers/Nexus').DataBase} [dbOption] */
  static db_mysql(dbOption = {}) {
    return new GDB(
      new MySQLDriver(dbOption.MySQL),
      DEFAULT_OPTIONS,
      dbOption
    );
  }
};
