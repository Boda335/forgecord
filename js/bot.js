require('module-alias/register');
const NEXUS = require('./src/handlers/Nexus.js');
const config = require('./settings/config');
const validateConfig = require('./src/core/validateConfig');
const { ConfigError } = require('./src/core/errors');
const { startDashboardServer } = require('./src/dashboard/server');

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

const { TOKEN } = config;

// Database configuration — choose a driver here; no database settings are required in .env.
// Supported drivers: JSON, Sqlite, MONGODB, and MySQL.
const client = new NEXUS({
  database: {
    // ! if use database_type "JSON" Default path in @root/database/database.json
    // ! if use database_type "Sqlite" Default path in @root/database/database.sqlite
    database_type: "JSON", // @forgecord-database-type
    MongoDB: {
      database: "Forgecord", // you can change the database name
      uri: "mongodb://127.0.0.1:27017",
    },
    // ! if use database_type "MySQL"
    MySQL: {
      database: "Forgecord", // you can change the database name
      host: "localhost", // your host or ip
      port: 3306, // your port default 3306
      user: "forgecord", // your username
      password: "forgecord", // your password
    },

    // ! if using cache system in works space and modified any data in database manually,
    // ! not edit in cache manager an not modified data show
    // ! في حالة استخدام نظام ذاكرة التخزين المؤقت في مساحة العمل وتعديل أي بيانات في قاعدة البيانات يدويًا，
    // ! لا يتم التعديل في مدير ذاكرة التخزين المؤقت، وتظهر بيانات غير معدلة
    options: {
      table: "ForgecordDB",
      nested: "..", //default use it 
      nestedIsEnabled: true, //default use it 
      cache: {
        capacity: 1024, //default use it 
        isEnabled: true, //default use
      },
    }
  }
});
if (process.env.DASHBOARD_ENABLED === 'true') startDashboardServer(client);
module.exports = client;

client.start(TOKEN).catch(err => {
  // A failure to even start (bad token, network down, ...) can't be routed
  // through client.errorHandler in a meaningful way since login never
  // succeeded — so this stays a plain console.error + non-zero exit.
  console.error('Fatal: Forgecord failed to start:', err);
  process.exit(1);
});
