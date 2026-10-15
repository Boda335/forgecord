import { NEXUS } from './src/handlers/Nexus';
import config from './settings/config';
import { validateConfig } from './src/core/validateConfig';
import { ConfigError } from './src/core/errors';
import { startDashboardServer } from './src/dashboard/server';

require('events').EventEmitter.defaultMaxListeners = 50; // sane cap, not "unlimited"

try {
  validateConfig(config);
} catch (err) {
  if (err instanceof ConfigError) {
    console.error(`\n${err.message}\n`);
    process.exit(1);
  }
  throw err;
}

// Database configuration — choose a driver here; no database settings are required in .env.
// Supported drivers: JSON, Sqlite, MONGODB, and MySQL.
const client = new NEXUS({
  database: {
    // ! if use database_type "JSON" Default path in @root/database/database.json
    // ! if use database_type "Sqlite" Default path in @root/database/database.sqlite
    database_type: 'JSON', // @forgecord-database-type
    MongoDB: {
      database: 'Forgecord', // you can change the database name
      uri: 'mongodb://127.0.0.1:27017',
    },
    // ! if use database_type "MySQL"
    MySQL: {
      database: 'Forgecord', // you can change the database name
      host: 'localhost', // your host or ip
      port: 3306, // your port default 3306
      user: 'forgecord', // your username
      password: 'forgecord', // your password
    },

    // ! if using cache system in work space and modifying any data in database manually,
    // ! cache may still return the old value until cache is updated.
    options: {
      table: 'ForgecordDB',
      nested: '..', // default use it
      nestedIsEnabled: true, // default use it
      cache: {
        capacity: 1024, // default use it
        isEnabled: true, // default use it
      },
    },
  } satisfies import('./src/types/database').ForgecordDatabaseConfig,
});
if (process.env.DASHBOARD_ENABLED === 'true') startDashboardServer(client);

client.start(config.TOKEN).catch(err => {
  // A failure to even start (bad token, network down, ...) can't be routed
  // through client.errorHandler in a meaningful way since login never
  // succeeded — so this stays a plain console.error + non-zero exit.
  console.error('Fatal: Forgecord failed to start:', err);
  process.exit(1);
});
