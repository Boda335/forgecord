from __future__ import annotations

import json
import re
from pathlib import Path
from typing import TypedDict

import aiohttp

from ..core.paths import ROOT_DIR

_VERSION_FILE = ROOT_DIR / "VERSION"


class VersionCheckResult(TypedDict, total=False):
    success: bool
    latest: str
    current: str
    update_available: bool
    error: str


def _read_current_version() -> str:
    try:
        return _VERSION_FILE.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return "0.0.0"


async def check_version_with_result() -> VersionCheckResult:
    current = _read_current_version()
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get("https://api.github.com/repos/Boda335/forgecord/tags") as res:
                if res.status != 200:
                    return {"success": False, "error": "Failed to fetch tags"}
                tags = json.loads(await res.text())
        semantic_tags = []
        for item in tags if isinstance(tags, list) else []:
            name = item.get("name") if isinstance(item, dict) else None
            match = re.match(r"^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$", name or "")
            if match:
                semantic_tags.append((tuple(map(int, match.groups())), name))
        if not semantic_tags:
            return {"success": False, "error": "No semantic version tags found"}
        _, raw_name = max(semantic_tags, key=lambda item: item[0])
        latest_str = str(raw_name).lstrip("v")
        latest = [int(x) for x in latest_str.split(".")[:3]]
        latest = (latest + [0, 0, 0])[:3]
        current_parts = ([int(x) for x in current.split(".")[:3]] + [0, 0, 0])[:3]

        update_available = (
            latest[0] > current_parts[0]
            or (latest[0] == current_parts[0] and latest[1] > current_parts[1])
            or (latest[0] == current_parts[0] and latest[1] == current_parts[1] and latest[2] > current_parts[2])
        )

        return {"success": True, "latest": latest_str, "current": current, "update_available": update_available}
    except Exception as err:
        return {"success": False, "error": str(err)}
