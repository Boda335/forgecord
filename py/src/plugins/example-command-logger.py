from __future__ import annotations

from ..core.PluginManager import ForgecordPlugin


async def on_load(client) -> None:
    def on_command_error(payload: dict) -> None:
        error = payload.get("error")
        context = payload.get("context", {})
        client.logger.warn(
            f'example-command-logger saw an error in {context.get("kind")} "{context.get("name")}": {error}'
        )

    def on_loader_complete(payload: dict) -> None:
        if payload.get("failed", 0) > 0:
            client.logger.warn(
                f'example-command-logger: {payload["failed"]}/{payload["loaded"] + payload["failed"]} {payload["name"]} failed to load'
            )

    client.hooks.on("commandError", on_command_error)
    client.hooks.on("loaderComplete", on_loader_complete)


plugin = ForgecordPlugin(name="example-command-logger", on_load=on_load)
