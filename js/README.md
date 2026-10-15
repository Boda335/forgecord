<div align="center">

<img src="https://i.postimg.cc/vZm6MxKk/fc-js.png" alt="fc_js" width="100"/>

# Forgecord — JavaScript

**A batteries-included framework for building Discord bots with [discord.js](https://discord.js.org/).**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A520-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white)](https://discord.js.org/)
[![Forgecord](https://img.shields.io/badge/Forgecord-JavaScript-5865F2)](https://github.com/Boda335/forgecord)

</div>

---

## What is Forgecord?

Forgecord is a reusable Discord bot framework and project generator. This directory is the **JavaScript edition of Forgecord**, built on top of `discord.js`.

It provides file-based loading for commands, events, components, functions and plugins, centralized error handling, configuration validation, hot reload support, multi-driver database integration, localization, and a production-ready logger.

The JavaScript, TypeScript and Python templates are separate language implementations of the same Forgecord architecture and concepts.

## Features

- Automatic command, event, component and function loading.
- Plugin system with lifecycle hooks.
- Centralized `ErrorHandler` and safe execution.
- Forgecord `Logger` with console output, JSON file logs, daily/size rotation, exception/rejection logs, caller information, and optional Better Stack Logtail transport.
- Hot reload through the built-in reload command.
- Multi-driver database support through good.db.
- English, Arabic and French localization files.
- Startup configuration validation.
- Discord slash commands and message commands.
- Docker support.
- Vitest test suite.

## Logger

The framework logger is available through `client.logger` and exposes the same public logging API used across the Forgecord language editions:

```js
client.logger.info('Database initialized.');
client.logger.warn('Something may be wrong.');
client.logger.error('Failed to load command:', error);
client.logger.debug('Debug information:', data);
```

The logger writes JSON logs to `logs/`, keeps `exceptions.log` and `rejections.log`, reports the caller file and line, and can forward logs to Better Stack when `LOGTAIL_ENABLE=true` is configured.

## Project layout

```text
bot.js
settings/
  config.js
  framework.js
src/
  Base/              # base client, commands, components and events
  Commands/          # Discord commands
  ComponentsAction/  # component handlers
  core/              # loader, logger, errors, i18n and validation
  events/             # Discord event modules
  functions/          # reusable functions
  handlers/           # startup and subsystem handlers
  plugins/            # optional Forgecord plugins
lang/                # en / ar / fr
```

## Requirements

- Node.js 20+
- A Discord bot token
- The default JSON driver requires no external database service. Select a driver and configure its settings in `bot.js` / `bot.ts`.

## Getting started

Install dependencies and configure `.env`:

```bash
npm install
cp .env.example .env
npm start
```

When generated through the Forgecord CLI, the template is already scaffolded with the required files and configuration.

## Database drivers

Forgecord uses the native [`good.db`](https://github.com/good-db/good.db) package. The framework integrates four drivers: JSON, SQLite, MongoDB, and MySQL.

Choose `database_type` in `bot.js` or `bot.ts`. JSON stores data in `database/database.json`, SQLite stores data in `database/database.sqlite`, and MongoDB/MySQL connection settings live in the same object passed to `new NEXUS({ database })`. The CLI writes your selection into that field. No database-type or connection URL values are needed in `.env`.

The initialized database is exposed as `client.db` and `client.database`. JSON and SQLite are local drivers; MongoDB and MySQL connect asynchronously, so using `await` works for all of them:

```js
const key = `profiles..${userId}`;
const profile = await client.db.get(key);
await client.db.set(key, { name: 'Ahmed', points: 100 });
```

Set the connection credentials in `bot.js` before selecting a remote driver. If you use Docker Compose, change remote hosts from `127.0.0.1` to the Compose service names (`mongo` or `mysql`). Don't commit real production credentials to a public repository.

## Configuration

Important environment variables include:

```env
TOKEN=your_bot_token
PREFIX=!
ID=your_client_id
NODE_ENV=development
LOGTAIL_ENABLE=false
LOGTAIL_SOURCE_TOKEN=
LOGTAIL_INGESTION_HOST=
```

## Relationship to the other Forgecord editions

- `js/` — **Forgecord JavaScript edition**, using `discord.js`.
- `ts/` — **Forgecord TypeScript edition**, using `discord.js` with static typing.
- `py/` — **Forgecord Python edition**, using `discord.py`.

All editions aim to keep the same framework concepts, class names, logger API, configuration surface and project organization while following the conventions of their language.

## License

Forgecord is released under the MIT License. See [LICENSE](LICENSE).
