from __future__ import annotations

import asyncio

from typing import Any, Callable, Dict, List, Optional, Set

import discord
from discord import app_commands

from ..core.ErrorHandler import ErrorHandler
from ..core.PluginManager import HookBus
from ..core.logger import Logger
from ..core.paths import COMMANDS_DIR, PLUGINS_DIR
from ..core.PluginManager import PluginManager
from ..handlers.UpdateChecker import check_version_with_result
from .Database import Database
from ..functions.registerSlashCommands import register_slash_commands
from .baseCommand import CommandData
from .baseComponent import ComponentData

CooldownMap = Dict[str, Dict[int, float]]


class NexusClient(discord.Client):
    def __init__(self, *, database: dict[str, Any] | None = None) -> None:
        intents = discord.Intents.default()
        intents.message_content = True
        intents.members = True
        super().__init__(intents=intents)

        # Local import to dodge a circular import (settings imports nothing
        # from src, but keeping this lazy keeps the dependency direction obvious).
        from settings import config as config_module
        from settings import framework as framework_module

        self.config = config_module
        self.db: Any | None = None
        self.database: Any | None = None
        self.database_config: dict[str, Any] = database or {"database_type": "JSON"}
        self.db = self._create_database(self.database_config)
        self.database = self.db
        self.framework = framework_module

        self.logger = Logger(file_logging_enabled=self.framework.ERROR_LOGGING["enabled"])
        self.errorHandler = ErrorHandler(self, webhook_url=self.framework.ERROR_LOGGING["webhook_url"])
        self.hooks: HookBus  # assigned by PluginManager's constructor
        self.pluginManager = PluginManager(self, PLUGINS_DIR)

        self.tree = app_commands.CommandTree(self)

        self.commands: Dict[str, CommandData] = {}
        self.aliases: Dict[str, str] = {}
        self.functions: Dict[str, Callable[..., Any]] = {}
        self.components_action: Dict[str, ComponentData] = {}
        self.statuses: Set[str] = set()
        self.cooldowns: CooldownMap = {}
        self.event_listeners: List[tuple] = []
        self._event_handlers: Dict[str, List[Callable[..., Any]]] = {}

        self.mcategories: List[str] = (
            sorted(p.name for p in COMMANDS_DIR.iterdir() if p.is_dir()) if COMMANDS_DIR.exists() else []
        )

    def add_listener(self, func: Callable[..., Any], name: str) -> None:
        """discord.Client only supports one method per event name
        (`self.on_message`, overwritten if you assign it twice). We want N
        independent event files to be able to target the same Discord
        event, so this keeps our own per-event list and binds a single
        dispatcher method (named exactly like the real discord.py hook,
        e.g. `on_message`) that fans out to everything registered."""
        if name not in self._event_handlers:
            self._event_handlers[name] = []

            async def dispatcher(*args: Any, _name: str = name, **kwargs: Any) -> None:
                for handler in list(self._event_handlers.get(_name, [])):
                    await handler(*args, **kwargs)

            setattr(self, name, dispatcher)

        self._event_handlers[name].append(func)

    def remove_listener(self, func: Callable[..., Any], name: str) -> None:
        handlers = self._event_handlers.get(name)
        if handlers and func in handlers:
            handlers.remove(func)

    async def setup_hook(self) -> None:
        """Runs once, after login but before connecting to the gateway —
        the right place to load everything and sync the slash-command tree."""
        self.logger.attachProcessHandlers(asyncio.get_running_loop())
        from ..handlers import intro

        intro.show()

        self.errorHandler.attach_process_handlers()
        await self.pluginManager.load_all()

        from ..handlers.CommandLoader import load as load_commands
        from ..handlers.ComponentsLoader import load as load_components
        from ..handlers.EventsLoader import load as load_events
        from ..handlers.FunctionsLoader import load as load_functions

        await load_commands(self)
        await load_events(self)
        await load_functions(self)
        await load_components(self)

        await register_slash_commands(self)

        self._check_for_updates()

    @staticmethod
    def _create_database(db_option: dict[str, Any]) -> Any:
        driver_type = str(db_option.get("database_type", "JSON") or "JSON").upper()
        if driver_type == "JSON":
            return Database.db_default(db_option)
        if driver_type == "SQLITE":
            return Database.db_sqlite(db_option)
        if driver_type == "MONGODB":
            return Database.db_mongo(db_option)
        if driver_type == "MYSQL":
            return Database.db_mysql(db_option)
        raise TypeError(f"Unsupported database_type: {db_option.get('database_type')}")

    async def DBConnect(self) -> None:
        driver_type = str(self.database_config.get("database_type", "JSON") or "JSON").upper()
        if self.db is None:
            raise RuntimeError("Database has not been initialized.")

        if driver_type in {"MONGODB", "MYSQL"}:
            await self.db.connect()
            self.logger.info(f"DB Connected to {driver_type}")
        else:
            self.logger.info(f"DB initialized using {driver_type}")
        self.database = self.db

    def table(self, name: str) -> Any:
        if self.db is None:
            raise RuntimeError("Database has not been initialized.")
        return self.db.table(name)

    async def launch(self, token: str) -> None:
        try:
            await self.start(token)
        except discord.PrivilegedIntentsRequired as err:
            self.logger.error(f"Missing privileged intents — enable them in the Discord Developer Portal: {err}")
            raise

    def get_footer(self, user: discord.abc.User) -> Optional[dict]:
        if not self.config.OPTIONS["embed_footer"]:
            return None
        return {"text": f"Requested By {user.name}", "icon_url": user.display_avatar.url}

    async def embed(self, target: discord.Interaction | discord.Message, description: str) -> None:
        user = target.user if isinstance(target, discord.Interaction) else target.author
        emb = discord.Embed(color=self.config.EMBED["color"], description=description[:3000])
        footer = self.get_footer(user)
        if footer:
            emb.set_footer(**footer)

        if isinstance(target, discord.Interaction):
            send = target.followup.send if target.response.is_done() else target.response.send_message
            await send(embed=emb)
        else:
            await target.reply(embed=emb)

    def _check_for_updates(self) -> None:
        async def runner() -> None:
            import asyncio

            await asyncio.sleep(5)
            result = await check_version_with_result()
            if not result["success"]:
                self.logger.warn(f"Update check failed: {result['error']}")
                return
            if result["update_available"]:
                self.logger.warn(f"Forgecord has a new update available: {result['latest']}, you are on {result['current']}")
            else:
                self.logger.info(f"Forgecord is up to date, you are on the latest version: {result['current']}")

        self.loop.create_task(runner())
