'use strict';
const path = require('path');

// bot.js lives at the project root, so this file (src/core/paths.js) is
// always exactly two levels below it. Resolving from __dirname (instead of
// process.cwd() or a hardcoded 'src/Commands' string) means every loader
// keeps working no matter where `node bot.js` / `forgecord start` is run from,
// or how the process is spawned (pm2, docker, a monorepo script, etc.).
const ROOT_DIR = path.resolve(__dirname, '..', '..');

module.exports = {
  ROOT_DIR,
  COMMANDS_DIR: path.join(ROOT_DIR, 'src', 'Commands'),
  EVENTS_DIR: path.join(ROOT_DIR, 'src', 'events'),
  COMPONENTS_DIR: path.join(ROOT_DIR, 'src', 'ComponentsAction'),
  FUNCTIONS_DIR: path.join(ROOT_DIR, 'src', 'functions'),
  PLUGINS_DIR: path.join(ROOT_DIR, 'src', 'plugins'),
  ERRORS_DIR: path.join(ROOT_DIR, 'errors'),
};
