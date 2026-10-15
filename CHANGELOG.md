# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed
- CLI smoke test in CI referenced a leftover filename from before the
  DiscoForge → Forgecord rebrand (`bin/create-discoforge.js`) instead of the
  real one (`bin/create-forgecord.js`) — the workflow would have failed on
  the next run.
- Root `package.json`'s `"bin"` field pointed at a non-existent
  `bin/forgecord.js`, which would have broken `npx forgecord` for anyone
  installing the published package.
- The `cli-smoke-test` CI job never ran `npm install` at the repo root
  before invoking the CLI, so it would have failed on `require('chalk')`
  (and every other root dependency) the moment the filename bug above was
  fixed.

### Added
- **Fail-fast configuration validation** (`validateConfig`) in all three
  templates. A missing or placeholder `TOKEN` now stops the bot instantly
  with a clear, actionable message, before any command/event/plugin loads
  and before `login()` is attempted — instead of surfacing several seconds
  later as a generic discord.js/discord.py authentication error. A new
  `ConfigError` class was added alongside the existing `ForgecordError`
  hierarchy in each language.
- **Expanded test coverage** across all three templates:
  - JavaScript: 10 → 28 tests
  - TypeScript: 9 → 27 tests
  - Python: 12 → 31 tests

  New coverage: `validateConfig`/`validate_config`, `ErrorHandler.safeExecute()`
  / `safe_execute()` (including Discord webhook batching, delivery failure
  handling, and the placeholder-URL case), and `PluginManager` (loaded
  against real fixture plugin files rather than mocks — a well-formed
  plugin, one missing a name, one that throws during load, and a
  duplicate-name collision).
- Root-level `LICENSE` (MIT), matching the license already declared in
  `package.json` and shipped inside each template.
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, and this
  `CHANGELOG.md`.
- GitHub issue templates (bug report, feature request), a pull request
  template, and a Dependabot config for the root CLI's dependencies.

### Changed
- Rewrote the root `README.md` and all three template `README.md` files:
  added a table of contents, a feature overview, a JS/TS/Python comparison
  table, and corrected a couple of stale details (the hook events actually
  emitted today are `loaderComplete` and `commandError` — earlier docs also
  listed a `commandExecuted` event that nothing currently fires).
- Rebuilt the CLI's interactive prompts on [`@clack/prompts`](https://www.npmjs.com/package/@clack/prompts)
  — the same prompt library family behind modern scaffolders like Astro's
  and SvelteKit's `create-*` tools. Arrow-key `select` for the language
  choice, styled `confirm`/`text` prompts, a spinner during dependency
  install (instead of npm/pip's raw noisy output), and a boxed "Next steps"
  summary via `note()`/`outro()`. Falls back automatically to `--yes`
  defaults when stdin isn't a real terminal (piped input, CI without
  `--yes`), instead of hanging.
- Dependency installs during scaffolding now run behind a spinner with
  captured output — quiet on success, and the full `npm`/`pip` log is only
  printed if the install actually fails.

### Removed
- `CHANGES-BY-CLAUDE.md` from all three templates, and every reference to
  it across the READMEs, this changelog, and `CONTRIBUTING.md`.

## Earlier history

Everything before this file existed — the original port from DiscoForge,
the shared `BaseLoader`/`ErrorHandler`/`PluginManager` architecture, the
TypeScript and Python ports, the CLI installer, Docker support, and the
initial test suites — predates this changelog and wasn't tracked file by
file.
