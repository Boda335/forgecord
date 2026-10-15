from __future__ import annotations

from src.core.PluginManager import ForgecordPlugin


async def on_load(client) -> None:
    raise RuntimeError("setup failed")


plugin = ForgecordPlugin(name="throws-plugin", on_load=on_load)
