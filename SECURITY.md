# Security Policy

## Supported versions

Forgecord generates a project you own and run yourself — there's no hosted
service to patch. "Support" here means the CLI and the three templates in
this repository.

| Component | Status |
|---|---|
| CLI (`bin/create-forgecord.js`) | Actively maintained |
| JavaScript template | Actively maintained |
| TypeScript template | Actively maintained |
| Python template | Actively maintained |

## Reporting a vulnerability

If you find a security issue in the CLI or in any of the generated
templates (e.g. a way a malicious command file could escape the loader's
error isolation, an injection point in the CLI's file/env generation, etc.),
please **do not open a public issue**. Instead:

1. Use GitHub's [private vulnerability reporting](../../security/advisories/new)
   for this repository, if enabled, or
2. Open an issue titled generically (no details) asking a maintainer to
   reach out for a private channel.

Please include: the affected component (CLI or a specific template), the
version/commit, reproduction steps, and the potential impact. We'll
acknowledge reports as promptly as we can and credit you in the fix unless
you'd prefer otherwise.

## Securing a bot you generate with Forgecord

None of the following are Forgecord-specific, but they matter for every bot
scaffolded with it:

- **Never commit `.env`.** Every template's `.gitignore` already excludes
  it — double-check before pushing if you moved or copied files manually.
- **Treat your bot token like a password.** Anyone with it can control your
  bot. If a token leaks, regenerate it immediately in the
  [Discord Developer Portal](https://discord.com/developers/applications).
- **Protect database credentials** in `bot.js`, `bot.ts`, or `bot.py` if you enable a remote database. Use a dedicated least-privilege database user, and never commit real production credentials to a public repository. The configuration is intentionally inline to match the requested handler-style setup; move secrets to a secret manager for production deployments.
- **Review third-party plugins before dropping them in `src/plugins/`.**
  A plugin runs with the same permissions as the rest of the bot; there is
  no sandboxing between a plugin and core client internals.
- **Keep dependencies updated.** `npm audit` / `pip-audit` periodically, or
  enable Dependabot (see `.github/dependabot.yml`) on your own fork.
