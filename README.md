<div align="center">

<img src="https://i.postimg.cc/mgrFR1qs/fc-banner.png" alt="fc_banner" width="500"/>

# Forgecord

**One CLI. Three languages. One Discord bot framework.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A520.0.0-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![JavaScript](https://img.shields.io/badge/JavaScript-discord.js%20v14-323330?logo=javascript&logoColor=F7DF1E)](js/)
[![TypeScript](https://img.shields.io/badge/TypeScript-discord.js%20v14-3178C6?logo=typescript&logoColor=white)](ts/)
[![Python](https://img.shields.io/badge/Python-discord.py%20v2-3776AB?logo=python&logoColor=white)](py/)

Scaffold a production-ready Discord bot — with file-based command loading, a
plugin system, centralized error handling, and hot reload — in the language
you already know.

[Quick start](#quick-start) •
[Templates](#templates) •
[How the CLI works](#how-the-cli-works) •
[Dashboard](#dashboard) •
[Publishing](#publishing-to-npm) •
[FAQ](#faq)

</div>

---

## What is this

Forgecord is a `create-*`-style CLI (`npx forgecord my-bot`) that scaffolds a
complete, ready-to-run Discord bot project. It is not a library you install
into an existing project — it *generates* one, fully owned by you, with no
hidden abstraction layer to fight later.

Every generated project ships with the same architecture regardless of
language:

- **File-based loading** — drop a file in `commands/`, `events/`, or
  `plugins/` and it's picked up automatically, no manual registration.
- **A shared loader core** — one battle-tested implementation of directory
  scanning, parallel loading, and per-file error isolation, instead of four
  copy-pasted loaders that drift out of sync.
- **Centralized error handling** — every command/event/component call is
  wrapped automatically; a thrown error is caught, logged, and (optionally)
  batched to a Discord webhook — it never crashes the process or gets
  silently swallowed.
- **A plugin system** — extend the bot by adding a file, not by forking core
  files.
- **Hot reload** — reload commands, events, functions, and components from
  inside Discord (`refrish` / `rl`) without restarting the process.
- **Fail-fast config validation** — a missing or placeholder bot token stops
  the process immediately with a clear message, instead of failing deep into
  startup with a generic auth error.
- **Tests + CI from day one** — every template ships with a real test suite
  (Vitest for JS/TS, pytest for Python) and a GitHub Actions workflow that
  runs all three.

Forgecord began as a rebrand of [DiscoForge](https://github.com/Boda335/DiscoForge)
(now archived) — the same file-based philosophy, rebuilt around a shared
core and extended to JavaScript, TypeScript, and Python from a single
installer.

## Templates

| | JavaScript | TypeScript | Python |
|---|---|---|---|
| Discord library | [discord.js](https://discord.js.org) v14 | discord.js v14 | [discord.py](https://discordpy.readthedocs.io) v2 |
| Runtime | Node.js ≥ 20 | Node.js ≥ 20 | Python ≥ 3.10 |
| Typing | — | End-to-end, `tsc --noEmit` in CI | Type hints + dataclasses |
| Test suite | 28 tests (Vitest) | 27 tests (Vitest) | 31 tests (pytest) |
| Docs | [`js/README.md`](js/README.md) | [`ts/README.md`](ts/README.md) | [`py/README.md`](py/README.md) |

Each folder is a **complete, independently runnable** project on its own —
you never need the other two once you've scaffolded. See each template's
README for the full guide.

## Quick start

```bash
npx forgecord my-bot
```

You'll be asked which language to use, where to create the project, and what to name its main file (defaults: `bot.js`, `bot.ts`, or `bot.py`). You'll also choose a database driver (JSON, SQLite, MongoDB, or MySQL), then answer a few optional questions such as bot token and prefix. Forgecord writes the selected driver directly into `database_type` in the chosen main file; remote connection settings live alongside it. The main file name is also applied to the start/build scripts and Docker configuration. Forgecord then:

1. Copies the chosen template into `./my-bot`.
2. Generates `package.json` (or `requirements.txt` for Python) **fresh**. JavaScript/TypeScript include `good.db`; Python installs KivoDB with its MongoDB and MySQL optional dependencies. All three templates integrate JSON, SQLite, MongoDB, and MySQL.
3. Fills `.env` with your bot token and application settings; database settings are stored in the bot source file.
4. Runs `git init` and creates an initial commit.
5. Installs dependencies for you (`npm install`, or a fresh `venv` +
   `pip install` for Python) — unless you opt out.

```bash
cd my-bot
npm start          # or: python bot.py / npm run dev (TS)
```

### Flags (for scripts / CI — skips all prompts)

```bash
npx forgecord my-bot --yes --lang=ts --database=MySQL --entry=index.ts
```

| Flag | Effect |
|---|---|
| `--yes` / `-y` | No prompts. Defaults to JavaScript and the local JSON driver unless `--lang` is given. Remote settings remain placeholders. Still runs `git init` and installs dependencies. |
| `--lang=js\|ts\|py` | Pick the language without the interactive menu. |
| `--database=JSON\|Sqlite\|MONGODB\|MySQL` | Select the database driver without the interactive menu. |
| `--entry=filename.ts` | Set the main file name; the expected language extension is added if omitted. |
| `--no-git` | Skip `git init`. |
| `--no-install` | Skip the automatic dependency install. |

### Running it before it's published

You don't need npm or a global install to try Forgecord right now — run the
CLI directly from a clone of this repo:

```bash
git clone https://github.com/Boda335/forgecord
cd forgecord
npm install
node bin/create-forgecord.js my-bot
```

## How the CLI works

```
forgecord/
├── bin/create-forgecord.js     # the CLI itself
├── .github/workflows/ci.yml    # tests all three templates + a CLI smoke test on every push
├── js/                         # JavaScript template — complete, runnable on its own
├── ts/                         # TypeScript template — complete, runnable on its own
└── py/                         # Python template — complete, runnable on its own
```

The CLI has no hidden magic: it prompts (or reads flags), copies the
matching template directory, writes the chosen driver into the inline bot config, generates the manifest, writes `.env`, and optionally runs `git init` + a package install. No
network calls beyond the install step itself.

### What every template includes

- **`.gitignore` + `LICENSE` (MIT)** — update the copyright name in `LICENSE`
  before shipping your own bot.
- **`Dockerfile` + `docker-compose.yml`** — `docker compose up --build` runs
  the bot and, for MongoDB/MySQL selections, a matching database service.
  JSON and SQLite selections need no extra service.
- **A real test suite** — `npm test` (JS/TS) or
  `pip install -r requirements-dev.txt && python -m pytest` (Python). Not
  full coverage — a solid foundation covering the loader core, error
  handling, the plugin system, config validation, and cooldown logic.
- **Multi-driver database layer** — JavaScript/TypeScript use `good.db`; Python uses KivoDB, the independently maintained Python toolkit with a compatible public API. All templates expose the same four database choices and configuration shape through `bot.js`, `bot.ts`, or `bot.py`.

## Dashboard

Forgecord can optionally generate a complete web dashboard with the bot. The dashboard frontend is always **React + TypeScript + Vite**, regardless of the bot language. The backend adapter matches the bot runtime:

- **JavaScript** → Express
- **TypeScript** → Express
- **Python** → FastAPI + Uvicorn

Choose it during scaffolding:

```bash
npx forgecord my-bot
# Choose your bot language
# Include a Forgecord Dashboard? → Yes
```

Or use the non-interactive flag:

```bash
npx forgecord my-bot --lang=typescript --dashboard
```

The generated project keeps the bot and dashboard backend together. In development, Forgecord provides a single `dev:all` command for Node projects and `python dev.py` for Python projects. In production, build the React dashboard and the runtime serves it from the same dashboard API port, so deployment needs only one application port.

The dashboard communicates through a language-independent `/api/*` contract, so the React UI does not care whether the bot is written in JavaScript, TypeScript, or Python.

The dashboard starts at `/` with the public landing page. **Sign in with Discord** uses `/auth/discord`; after OAuth, the user is redirected to `/app`, where the dashboard loads the user's Discord servers from `/api/servers`. Set `DISCORD_CLIENT_ID`/`DISCORD_CLIENT_SECRET` (or use the configured bot ID) and register `/auth/callback` in the Discord application. `DASHBOARD_URL` and `DASHBOARD_REDIRECT_URI` are optional for local development but recommended for production.

## Publishing to npm

This package is published as the Forgecord CLI package — that step needs your own npm account:

```bash
npm login                 # one-time, needs an npmjs.com account
cd forgecord               # this folder
npm publish
```

If `forgecord` is already taken, change `"name"` in `package.json` (e.g.
`"@your-npm-username/forgecord"`) — scoped packages avoid name clashes and
are still runnable via `npx @your-npm-username/forgecord`.

**Before publishing, also update:**

- `package.json` → `"repository"` (currently a `Boda335/forgecord` placeholder)
- Each template's `src/handlers/UpdateChecker.*` / `update_checker.py` → the
  same placeholder, used for the "new version available" check on startup
- Each template's `LICENSE` → the copyright name

## Renaming this project

If you don't keep the name "Forgecord" either, it shows up in these places —
search for it case-insensitively across the repo:

- `package.json` (root, and in each of `js/`, `ts/`, `py/`) → `name`, `description`
- Each template's `settings/framework.*` and every `client.framework` /
  `this.framework` reference
- Startup banners in `src/handlers/intro.*`
- Error class / hook type names (`ForgecordError`, `ForgecordPlugin`,
  `ForgecordSettings`, `ForgecordHookEvents`)

## FAQ

**Do I need all three languages installed?**
No. `npx forgecord` only touches the one template you pick; the other two
folders in this repo are simply not copied.

**Can I add a template for a fourth language?**
Yes — copy the structure of an existing template folder, keep the same
`src/core/` contract (`BaseLoader`, `ErrorHandler`, `PluginManager`,
`ConfigError`/`validateConfig`), and add an entry to `LANGUAGES` in
`bin/create-forgecord.js`.

**Why does the CLI generate `package.json` / `requirements.txt` instead of copying them?**
So the generated project includes `good.db` for JavaScript/TypeScript or KivoDB for Python, with the optional MongoDB and MySQL drivers available in Python.

**Is this affiliated with discord.js or discord.py?**
No — Forgecord is an independent scaffolding tool built on top of them.

## License

MIT — see [`LICENSE`](LICENSE). Each generated template ships its own copy;
update the copyright name before publishing your bot.

## Managing a generated project

Run these commands from the Forgecord repository, or from a generated project folder. Generators support JavaScript, TypeScript, and Python.

```bash
forgecord add command
forgecord add event
forgecord add plugin
forgecord add component
forgecord doctor
```

When running from the Forgecord repository, pass `--lang=js`, `--lang=ts`, or `--lang=py` to select the template. From a generated project, Forgecord detects the current project. Command generation asks for a name, description, cooldown in minutes, category, and whether prefix and slash commands are enabled. Known categories are selectable, with a custom-category option. Handler functions are included as commented examples so they can be enabled when implemented. Event generation defaults to the `client` target and asks whether the listener should run once.

`forgecord doctor` performs local configuration checks only; it does not send your token to any service or verify live Discord connectivity.
