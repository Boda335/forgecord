from __future__ import annotations

from src.core.PluginManager import ForgecordPlugin


async def on_load(client) -> None:
    client.hooks.on("commandExecuted", lambda payload: None)
    client._tracker_loaded = True


plugin = ForgecordPlugin(name="tracker", on_load=on_load)
