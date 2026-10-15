"""Central path resolution.

Resolved from this file's own location (not the working directory or a
hardcoded string), so every loader keeps working no matter where
`python bot.py` is launched from — a systemd service, Docker, a monorepo
script, etc.
"""
from __future__ import annotations

from pathlib import Path

ROOT_DIR: Path = Path(__file__).resolve().parents[2]

COMMANDS_DIR: Path = ROOT_DIR / "src" / "Commands"
EVENTS_DIR: Path = ROOT_DIR / "src" / "events"
COMPONENTS_DIR: Path = ROOT_DIR / "src" / "ComponentsAction"
FUNCTIONS_DIR: Path = ROOT_DIR / "src" / "functions"
PLUGINS_DIR: Path = ROOT_DIR / "src" / "plugins"
ERRORS_DIR: Path = ROOT_DIR / "errors"
