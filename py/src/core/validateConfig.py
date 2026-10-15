"""Fail-fast validation for settings/config.py.

Deliberately runs BEFORE plugins/commands/events load and BEFORE the client
logs in — a bad token used to only surface after the full startup sequence
(tables, plugin loading, ~seconds of work) via a fairly generic discord.py
auth error (LoginFailure). Catching it here means the failure is instant
and points at exactly what's wrong.
"""
from __future__ import annotations

import re
from typing import Iterable

from .errors import ConfigError

# Values config.py falls back to when the matching env var isn't set — treated
# the same as "missing" so a copy-pasted, never-edited .env fails loudly.
_PLACEHOLDERS = {"BOT_TOKEN", "CLIENT_ID", "BOT_PREFIX"}
_SNOWFLAKE_RE = re.compile(r"^\d{15,25}$")


def validate_config(token: str, client_id: str | None = None) -> None:
    """Raises ConfigError listing every problem found, or returns silently."""
    problems: list[str] = []

    if not token or token in _PLACEHOLDERS:
        problems.append(
            "TOKEN is missing. Set TOKEN=<your bot token> in .env "
            "(create one at https://discord.com/developers/applications -> your app -> Bot -> Reset Token)."
        )

    if client_id and client_id not in _PLACEHOLDERS and not _SNOWFLAKE_RE.match(client_id):
        problems.append(
            f'ID ("{client_id}") doesn\'t look like a Discord application/client ID '
            "(expected a 15-25 digit snowflake)."
        )

    if problems:
        raise ConfigError(_format(problems))


def _format(problems: Iterable[str]) -> str:
    bullets = "\n".join(f"  - {p}" for p in problems)
    return f"Cannot start — invalid configuration:\n{bullets}"
