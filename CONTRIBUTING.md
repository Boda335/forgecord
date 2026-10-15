# Contributing to Forgecord

Thanks for considering a contribution — whether that's a bug report, a fix,
or a new feature.

## Project structure

This is a monorepo containing the CLI (`bin/`) and three independent
templates (`js/`, `ts/`, `py/`). A change usually falls into one of two
buckets:

- **CLI changes** (`bin/create-forgecord.js`) — affect scaffolding only:
  prompts, flags, file copying, `.env`/manifest generation.
- **Template changes** (`js/`, `ts/`, `py/`) — affect the generated bot
  itself. If you fix a bug or add a feature in one template, please check
  whether the same problem exists in the other two — the three templates
  are meant to share the same architecture (`BaseLoader`, `ErrorHandler`,
  `PluginManager`, `validateConfig`) even though the implementation language
  differs.

## Getting set up

```bash
git clone <this-repo>
cd forgecord
npm install                 # root CLI deps

cd js && npm install && npm test    # or ts/, or py/ with its own setup
```

Each template's own README has full setup instructions.

## Before opening a pull request

1. **Run the relevant test suite(s).** `npm test` for JS/TS,
   `pip install -r requirements-dev.txt && python -m pytest` for Python.
   `npx tsc --noEmit` must also pass for TypeScript changes.
2. **Keep the templates in sync where it matters.** A bug fixed in one
   language's `core/` should usually be fixed in the other two as well,
   unless it's genuinely language-specific (call this out in your PR
   description if so).
3. **Add tests for new behavior.** Loader/plugin/error-handling logic
   especially — see `test/` (JS/TS) or `tests/` (Python) for the existing
   patterns, including the fixture-based `PluginManager` tests.
4. **Update the relevant README** if you change public-facing behavior
   (a new config option, a new hook event, a new CLI flag).

## Reporting bugs

Open an issue with: what you expected, what happened instead, the template
and language version involved, and steps to reproduce. A minimal repro
project or command file is the fastest way to get a fix.

## Suggesting features

Open an issue describing the use case first — for anything that touches the
shared `core/` contract across all three languages, it's worth agreeing on
the shape before writing code that has to be ported three times.

## Code style

- JavaScript/TypeScript: match the existing formatting (see `.prettierrc`
  in each template). No enforced linter yet — open to a PR adding ESLint
  config + a CI job for it.
- Python: follow the existing style (type hints, dataclasses for typed
  config, `from __future__ import annotations`).

## Code of Conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md). Be
respectful — that's the whole policy in practice.
