<div align="center">

<img src="https://i.postimg.cc/pLdnx5S7/fc-ts.png" alt="fc_ts" width="100"/>

# Forgecord — TypeScript

**A batteries-included framework for building Discord bots with [discord.js](https://discord.js.org), fully typed end to end.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A520.0.0-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](tsconfig.json)
[![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?logo=discord&logoColor=white)](https://discord.js.org)
[![Tests](https://img.shields.io/badge/tests-27%20passing-brightgreen?logo=vitest&logoColor=white)](test/)

File-based command/event/component loading, a plugin system, centralized
error handling, fail-fast config validation, and hot reload — with discord.js's
own event and interaction types enforced by the compiler, not just documented
in a comment.

</div>

---

## Contents

- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Project layout](#project-layout)
- [Writing a command](#writing-a-command)
- [Fully-typed events](#fully-typed-events)
- [Plugins](#plugins)
- [Hot reload](#hot-reload)
- [Configuration & startup validation](#configuration--startup-validation)
- [Error handling](#error-handling)
- [Testing & type-checking](#testing--type-checking)
- [Docker](#docker)
- [What's different from the original DiscoForge template](#whats-different-from-the-original-discoforge-template)

## Requirements

- Node.js 20+
- A Discord bot token — create one at the [Discord Developer Portal](https://discord.com/developers/applications)
- Database storage via good.db (JSON, SQLite, MongoDB, and MySQL)

## Getting started

```bash
npm install
cp .env.example .env   # if you scaffolded this with forgecord, .env already exists
# edit .env with your bot token
npm run dev              # runs straight from TS via tsx, with watch mode
# or
npm run build && npm start   # compile to dist/ and run the compiled output
```

If `TOKEN` is missing or left as the placeholder value, the bot tells you
immediately and exits — see [Configuration & startup validation](#configuration--startup-validation).

## Project layout

```
bot.ts                        # entry point — validates config, then boots the client
settings/
  config.ts                   # token, prefix, embed colors, links (typed: BotConfig)
  framework.ts                  # error logging + presence rotation settings (typed: ForgecordSettings)
src/
  Base/                       # baseClient.ts (NexusClient) and the CommandData/ComponentData/BaseEvent<K> types
  core/                       # BaseLoader<T>, ErrorHandler, PluginManager, validateConfig, custom error classes
  handlers/                   # CommandLoader, EventsLoader, ComponentsLoader, FunctionsLoader, Nexus.ts
  Commands/<category>/        # one file per command, grouped by category folder
  events/<Target>/            # one file per event — BaseEvent<K> ties the event name to discord.js's real argument types
  ComponentsAction/           # button/select/modal handlers
  functions/                  # small reusable utilities, auto-loaded onto client.functions
  plugins/                    # optional plugins — see below
test/                         # Vitest suite (27 tests)
```

Every loader (`Commands`, `Events`, `Components`, `Functions`) is a thin
subclass of the generic `src/core/BaseLoader.ts`: it recursively scans its
directory, imports every file in parallel, validates the shape, and
registers it — one file's error never stops the rest of the batch from
loading.

## Writing a command

```ts
// src/Commands/misc/hello.ts
import type { CommandData } from '../../Base/baseCommand';

const command: CommandData = {
  name: 'hello',
  description: 'Says hello',
  cooldown: 5,
  category: 'misc',
  command: { enabled: true, aliases: ['hi'] },
  slashCommand: { enabled: true },

  async msgExecute(client, message) {
    await message.reply('Hello!');
  },

  async interactionExecute(client, interaction) {
    await interaction.reply('Hello!');
  },
};

export default command;
```

Drop the file anywhere under `src/Commands/<any-category-folder>/` and it's
picked up automatically on the next start — or instantly via [hot reload](#hot-reload).

## Fully-typed events

`BaseEvent<K>` types `execute`'s extra arguments against discord.js's own
`ClientEvents` — get the event name wrong, or use the wrong argument shape,
and `tsc` catches it before you ever run the bot:

```ts
// src/events/Client/ready.ts
import type { BaseEvent } from '../../Base/baseEvents';

const readyEvent: BaseEvent<'clientReady'> = {
  name: 'clientReady',
  target: 'client',
  once: true,
  async execute(client) { /* ... */ },
};

export default readyEvent;
```

## Plugins

Any file dropped in `src/plugins/` is loaded automatically and can hook into
lifecycle events without touching a single core file:

```ts
// src/plugins/my-plugin.ts
import type { ForgecordPlugin } from '../core/PluginManager';

const myPlugin: ForgecordPlugin = {
  name: 'my-plugin',
  async onLoad(client) {
    client.hooks.on('commandError', ({ error, context }) => {
      // e.g. forward to your own metrics/analytics service
    });
  },
};

export default myPlugin;
```

See `src/plugins/example-command-logger.ts` for a working example. Hook
events currently emitted by the framework: `loaderComplete` (after each
loader finishes) and `commandError` (whenever `safeExecute` catches an
error) — see `src/core/PluginManager.ts`.

## Hot reload

Run `refrish` (aliases: `rl`, `re`) as a message or slash command in Discord
to reload commands, events, functions, and components without restarting the
process. It's owner-only by default and runs every loader in parallel.

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

## Configuration & startup validation

`bot.ts` calls `validateConfig()` (`src/core/validateConfig.ts`) **before**
loading any plugin, command, event, or component, and before `client.login()`
is ever called. If `TOKEN` is missing or still the untouched placeholder
(`BOT_TOKEN`), or `ID` doesn't look like a real Discord snowflake, the
process exits immediately with a message that says exactly what to fix:

```
Cannot start — invalid configuration:
  - TOKEN is missing. Set TOKEN=<your bot token> in .env (create one at
    https://discord.com/developers/applications → your app → Bot → Reset Token).
```

This replaces what used to be a several-second startup sequence followed by
a fairly generic discord.js authentication error — the failure is now
instant and actionable.



## Error handling

Every command/event/component call is wrapped in
`client.errorHandler.safeExecute()`:

- Errors are caught — they never crash the process or surface as an
  unhandled rejection.
- Every error is logged to the console and, if `errorLogging.enabled: true`
  in `settings/framework.ts` with a real webhook URL, queued and posted to a
  Discord webhook **in batches** (once every few seconds) rather than firing
  one HTTP request per error.
- Known, expected errors (`ValidationError`, `LoaderError`,
  `PermissionError`, `PluginError`, `ConfigError` — all subclasses of
  `ForgecordError`) are logged with just their message; anything unexpected
  gets its full stack trace.

## Testing & type-checking

```bash
npm test              # 27 tests via Vitest
npx tsc --noEmit       # type-check with zero emitted files
```

The test suite covers:

- `BaseLoader` / `CommandLoader` validation rules
- `ErrorHandler.safeExecute()` and webhook batching (including failure
  handling and the placeholder-URL case)
- `PluginManager` — loaded against real fixture plugin files under
  `test/fixtures/`, not mocks: a well-formed plugin, one missing a name, one
  that throws during `onLoad`, and a duplicate-name collision
- `validateConfig()` — every pass/fail combination for `TOKEN` and `ID`
- The cooldown function

Not full coverage — a solid foundation. Add tests under `test/` as you add
commands worth covering.

## Docker

```bash
docker compose up --build
```

The CLI generates the Compose file to match the selected database driver. JSON and SQLite need no database service; MongoDB and MySQL selections include the corresponding local service. Change the default development credentials before exposing a database beyond your machine.

## What's different from the original DiscoForge template

This started as a TypeScript port of [DiscoForge](https://github.com/Boda335/DiscoForge)
(now archived, and originally JS-only) — rebuilt around a shared, fully-typed
loader core (`BaseLoader<T>`, `ErrorHandler`, `PluginManager`) and extended
with the CLI installer and the additions listed above.
