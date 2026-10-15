"""Very small plugin system. `client.hooks` is a HookBus that loaders/event
handlers publish lifecycle events on. A plugin module just exposes a
module-level `plugin` object and optionally does setup work in
`on_load(client)` — no core files need to change to extend the bot.

A plugin module looks like:

    from src.core.PluginManager import ForgecordPlugin

    async def on_load(client):
        client.hooks.on("commandError", lambda payload: client.logger.warn(payload))

    plugin = ForgecordPlugin(name="my-plugin", on_load=on_load)
"""
from __future__ import annotations

import inspect
from dataclasses import dataclass
from pathlib import Path
from typing import TYPE_CHECKING, Any, Awaitable, Callable, Dict, Optional, Union, DefaultDict, List
from collections import defaultdict

from .errors import PluginError


if TYPE_CHECKING:
    from ..Base.baseClient import NexusClient


Listener = Callable[[Any], Union[None, Awaitable[None]]]


class HookBus:
    """Small async hook bus matching the lifecycle surface of JS EventEmitter."""
    def __init__(self) -> None:
        self._listeners: DefaultDict[str, List[Listener]] = defaultdict(list)

    def on(self, event: str, listener: Listener) -> None:
        self._listeners[event].append(listener)

    async def emit(self, event: str, payload: Any = None) -> None:
        for listener in list(self._listeners.get(event, [])):
            result = listener(payload)
            if inspect.isawaitable(result):
                await result


def import_module_from_path(file_path: Path):
    import importlib
    import sys
    from .paths import ROOT_DIR
    dotted = ".".join(file_path.resolve().relative_to(ROOT_DIR).with_suffix("").parts)
    if dotted in sys.modules:
        return importlib.reload(sys.modules[dotted])
    return importlib.import_module(dotted)

OnLoadFn = Callable[["NexusClient"], Union[None, Awaitable[None]]]


@dataclass
class ForgecordPlugin:
    name: str
    on_load: Optional[OnLoadFn] = None


class PluginManager:
    def __init__(self, client: "NexusClient", plugins_dir: Path):
        self.client = client
        self.plugins_dir = plugins_dir
        self.hooks = HookBus()
        client.hooks = self.hooks
        self.plugins: Dict[str, ForgecordPlugin] = {}

    async def load_all(self) -> dict[str, int]:
        if not self.plugins_dir.exists():
            return {"loaded": 0}

        files = sorted(p for p in self.plugins_dir.glob("*.py") if not p.name.startswith("_"))
        for file_path in files:
            await self._load_one(file_path)

        self.client.logger.info(f"{len(self.plugins)} Plugins Loaded")
        return {"loaded": len(self.plugins)}

    async def _load_one(self, file_path: Path) -> None:
        try:
            module = import_module_from_path(file_path)
            plugin: Optional[ForgecordPlugin] = getattr(module, "plugin", None)

            if plugin is None or not getattr(plugin, "name", None):
                raise PluginError(f'Plugin at {file_path} is missing a module-level "plugin.name"', {"file": str(file_path)})
            if plugin.name in self.plugins:
                raise PluginError(f'Duplicate plugin name "{plugin.name}"', {"file": str(file_path)})

            if plugin.on_load:
                result: Any = plugin.on_load(self.client)
                if inspect.isawaitable(result):
                    await result

            self.plugins[plugin.name] = plugin
        except Exception as err:
            self.client.logger.error(f"Failed to load plugin {file_path}: {err}")
