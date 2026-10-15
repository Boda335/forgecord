<div align="center">

<img src="https://i.postimg.cc/GmpsrTf6/fc-py.png" alt="fc_py" width="100"/>

# Forgecord — Python

**A batteries-included framework for building Discord bots with [discord.py](https://discordpy.readthedocs.io).**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-%E2%89%A53.10-3776AB?logo=python&logoColor=white)](https://python.org)
[![discord.py](https://img.shields.io/badge/discord.py-v2-5865F2?logo=discord&logoColor=white)](https://discordpy.readthedocs.io)
[![Tests](https://img.shields.io/badge/tests-31%20passing-brightgreen?logo=pytest&logoColor=white)](tests/)

File-based command/event/component loading, a plugin system, centralized
error handling, fail-fast config validation, and hot reload — built directly
on `discord.Client` rather than wrapping `commands.Bot`'s Cog system.

</div>

---

## Contents

- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Project layout](#project-layout)
- [Writing a command](#writing-a-command)
- [Events, and why `discord.Client` instead of `commands.Bot`](#events-and-why-discordclient-instead-of-commandsbot)
- [Plugins](#plugins)
- [Hot reload](#hot-reload)
- [Configuration & startup validation](#configuration--startup-validation)
- [Error handling](#error-handling)
- [Testing](#testing)
- [A note on "parallel" loading](#a-note-on-parallel-loading)
- [Docker](#docker)
- [What's different from the original DiscoForge template](#whats-different-from-the-original-discoforge-template)

## Requirements

- Python 3.10+
- A Discord bot token — create one at the [Discord Developer Portal](https://discord.com/developers/applications)
- Database storage via KivoDB (JSON, SQLite, MongoDB, and MySQL)

## Getting started

```bash
python -m venv venv
venv/bin/pip install -r requirements.txt      # venv\Scripts\pip on Windows
cp .env.example .env    # if you scaffolded this with forgecord, .env already exists
# edit .env with your bot token
venv/bin/python bot.py
```

If `TOKEN` is missing or left as the placeholder value, the bot tells you
immediately and exits — see [Configuration & startup validation](#configuration--startup-validation).

## Project layout

```
bot.py                          # entry point — validates config, then boots the client
settings/
  config.py                     # token, prefix, embed colors, links
  framework.py                    # error logging + presence rotation settings
src/
  Base/                         # baseClient.py, baseCommand.py, baseComponent.py and baseEvents.py
  core/                         # BaseLoader, ErrorHandler, PluginManager, HookBus, validate_config, custom exceptions
  handlers/                     # command_loader, event_loader, component_loader, function_loader, nexus.py
  commands/<category>/          # one file per command, grouped by category folder
  events/                       # one file per event (on_ready.py, on_message.py, ...)
  components_action/            # button/select handlers for raw/persistent custom_ids
  functions/                    # small reusable utilities, auto-loaded onto client.functions
  plugins/                      # optional plugins — see below
tests/                          # pytest suite (31 tests)
```

Every loader (`Commands`, `Events`, `Components`, `Functions`) is a thin
subclass of `src/core/base_loader.py`: it recursively scans its directory,
imports every module, validates the shape, and registers it — one file's
error never stops the rest of the batch from loading.

## Writing a command

Every command file exports a module-level `data: CommandData`:

```python
# src/Commands/misc/hello.py
from ...Base.baseCommand import CommandData


async def msg_execute(client, message, args, prefix):
    await message.reply(content="Hello!")


async def interaction_execute(client, interaction):
    await interaction.response.send_message(content="Hello!")


data = CommandData(
    name="hello",
    description="Says hello",
    cooldown=5,
    category="misc",
    aliases=["hi"],
    msg_execute=msg_execute,
    interaction_execute=interaction_execute,
)
```

Drop the file anywhere under `src/Commands/<any-category-folder>/` and it's
picked up automatically on the next start — or instantly via [hot reload](#hot-reload).

## Events, and why `discord.Client` instead of `commands.Bot`

Events (`src/events/`) export a module-level `data: EventData` where `name`
matches a real discord.py event (`"on_message"`, `"on_ready"`, ...) — see
`src/Base/baseEvents.py` and the existing event files for the exact shape.

> discord.py's `Client` only supports one method per event name; this
> framework's file-based design allows multiple event *files* to target the
> same Discord event, which needs its own dispatch layer.
> `NexusClient.add_listener()` / `remove_listener()` in
> `src/Base/baseClient.py` implement that fan-out — see the comment there
> for the full reasoning.

## Plugins

Any file dropped in `src/plugins/` is loaded automatically and can hook into
lifecycle events without touching a single core file:

```python
# src/plugins/my_plugin.py
from ..core.plugin_manager import ForgecordPlugin


async def on_load(client):
    client.hooks.on("commandError", lambda payload: print(payload))


plugin = ForgecordPlugin(name="my-plugin", on_load=on_load)
```

See `src/plugins/example_command_logger.py` for a working example. Hook
events currently emitted by the framework: `loaderComplete` (after each
loader finishes) and `commandError` (whenever `safe_execute` catches an
error) — see `src/core/plugin_manager.py` / `src/core/hooks.py`.

## Hot reload

Run `refrish` (aliases: `rl`, `re`) as a message or slash command in Discord
to reload commands, events, functions, and components without restarting the
process. It's owner-only by default.

## Database drivers

Forgecord uses [KivoDB](https://github.com/Boda335/KivoDB), a Python database toolkit with a public API inspired by `good.db`. The framework integrates the same four drivers as the JavaScript template: JSON, SQLite, MongoDB, and MySQL.

Choose `database_type` directly in `bot.py`. JSON stores data in `database/database.json`, SQLite stores data in `database/database.sqlite`, and MongoDB/MySQL connection settings live in the same `DATABASE` object passed to `NEXUS(database=DATABASE)`. The default JSON driver requires no external service.

The initialized database is exposed as `client.db` and `client.database`, and named table proxies are available through `client.table("profiles")`. JSON and SQLite are synchronous. MongoDB and MySQL are asynchronous: use `await client.table("profiles")` for a table proxy and `await` for database operations.

```python
key = f"profiles..{user_id}"
profile = client.db.get(key)
client.db.set(key, {"name": "Ahmed", "points": 100})
```

Set remote database credentials in `bot.py` before selecting a remote driver. In Docker Compose, the generated file includes the matching MongoDB or MySQL service. Don't commit real production credentials to a public repository.

## Configuration & startup validation

`bot.py` calls `validate_config()` (`src/core/validate_config.py`) **before**
`asyncio.run(main())` is even reached — before any plugin, command, event, or
component loads, and before the client ever attempts to log in. If `TOKEN`
is missing or still the untouched placeholder (`BOT_TOKEN`), or `CLIENT_ID`
doesn't look like a real Discord snowflake, the process exits immediately
with a message that says exactly what to fix:

```
Cannot start — invalid configuration:
  - TOKEN is missing. Set TOKEN=<your bot token> in .env (create one at
    https://discord.com/developers/applications -> your app -> Bot -> Reset Token).
```

This replaces what used to be a several-second startup sequence followed by
a fairly generic discord.py `LoginFailure` — the failure is now instant and
actionable.


## Error handling

Every command/event/component call is wrapped in
`client.error_handler.safe_execute()`:

- Errors are caught — they never crash the event loop or the process.
- Every error is logged to the console and, if `ERROR_LOGGING["enabled"] = True`
  in `settings/framework.py` with a real webhook URL, queued and posted to a
  Discord webhook **in batches** (once every few seconds, via `aiohttp`)
  rather than firing one HTTP request per error.
- Known, expected errors (`ValidationError`, `LoaderError`,
  `PermissionError`, `PluginError`, `ConfigError` — all subclasses of
  `ForgecordError`) are logged with just their message; anything unexpected
  gets its full traceback.

## Testing

```bash
venv/bin/pip install -r requirements-dev.txt
venv/bin/python -m pytest
```

31 tests via pytest (+ `pytest-asyncio`), covering:

- `BaseLoader` / command validation rules
- `ErrorHandler.safe_execute()` and webhook batching (`aiohttp.ClientSession.post`
  is mocked — no test ever makes a real network call — including the
  placeholder-URL case and delivery failures)
- `PluginManager` — loaded against real fixture plugin modules under
  `tests/fixtures/`, not mocks: a well-formed plugin, one missing a
  `plugin.name`, one that throws during `on_load`, and a duplicate-name
  collision
- `validate_config()` — every pass/fail combination for `TOKEN` and `CLIENT_ID`
- The cooldown function

Not full coverage — a solid foundation. Add tests under `tests/` as you add
commands worth covering.

## A note on "parallel" loading

Loaders use `asyncio.gather()`, but CPython's import machinery is synchronous
and the GIL means this isn't real concurrent speedup the way `Promise.allSettled`
is in the JS/TS versions — what it buys here is **error isolation** (one bad
command file doesn't stop the rest from loading) and keeping the event loop
free during startup. See the comment in `src/core/base_loader.py` for the
full explanation.

## Docker

```bash
docker compose up --build
```

The CLI generates the Compose file to match the selected database driver. JSON and SQLite need no database service; MongoDB and MySQL selections include the corresponding local service. Change the default development credentials before exposing a database beyond your machine.

## What's different from the original DiscoForge template

This started as a Python port of [DiscoForge](https://github.com/Boda335/DiscoForge)
(now archived, and originally JS-only) — rebuilt around a shared loader core
(`BaseLoader`, `ErrorHandler`, `PluginManager`) and extended with the CLI
installer and the additions listed above.
