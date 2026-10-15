import fs from 'fs';
import path from 'path';
import { GoodDB, JSONDriver, MongoDBDriver, SQLiteDriver, MySQLDriver } from 'good.db';
import { ROOT_DIR } from '../core/paths';
import type { ForgecordDatabaseConfig, DatabaseOptions } from '../types/database';

const DATABASE_DIR = path.join(ROOT_DIR, 'database');
const JSON_PATH = path.join(DATABASE_DIR, 'database.json');
const SQLITE_PATH = path.join(DATABASE_DIR, 'database.sqlite');

const DEFAULT_OPTIONS: DatabaseOptions = {
  nested: '..',
  nestedIsEnabled: true,
  table: 'ForgecordDB',
  cache: { capacity: 1024, isEnabled: true },
};

function ensureDatabaseDir(): void {
  fs.mkdirSync(DATABASE_DIR, { recursive: true });
}

class GDB extends GoodDB {
  constructor(driver: any, options: DatabaseOptions = DEFAULT_OPTIONS, dbOption?: ForgecordDatabaseConfig) {
    super(driver as any, (dbOption?.options ?? options) as any);
  }
}

export default class Database {
  static db_default(dbOption: ForgecordDatabaseConfig = { database_type: 'JSON' }): GDB {
    ensureDatabaseDir();
    return new GDB(new JSONDriver({ path: JSON_PATH, format: true }), DEFAULT_OPTIONS, dbOption);
  }

  static db_sqlite(dbOption: ForgecordDatabaseConfig = { database_type: 'Sqlite' }): GDB {
    ensureDatabaseDir();
    return new GDB(new SQLiteDriver({ path: SQLITE_PATH }), DEFAULT_OPTIONS, dbOption);
  }

  static db_mongo(dbOption: ForgecordDatabaseConfig = { database_type: 'MONGODB' }): GDB {
    return new GDB(new MongoDBDriver(dbOption.MongoDB as any), DEFAULT_OPTIONS, dbOption);
  }

  static db_mysql(dbOption: ForgecordDatabaseConfig = { database_type: 'MySQL' }): GDB {
    return new GDB(new MySQLDriver(dbOption.MySQL as any), DEFAULT_OPTIONS, dbOption);
  }
}
