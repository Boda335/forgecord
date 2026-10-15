from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, List

import discord
from discord import app_commands

from ..Base.baseCommand import CommandData
from ..core.BaseLoader import BaseLoader, LoadResult
from ..core.errors import ValidationError
from ..core.paths import COMMANDS_DIR

if TYPE_CHECKING:
    from ..Base.baseClient import NexusClient


class CommandLoader(BaseLoader[CommandData]):
    def __init__(self, client: "NexusClient"):
        super().__init__(
            client,
            name="Commands",
            directory=COMMANDS_DIR,
            table_headings=["Command File", "Category", "isPrefix", "isSlash", "Status"],
        )

    def validate(self, data: CommandData, file_path: Path) -> None:
        if not isinstance(data, CommandData):
            raise ValidationError(f"{file_path.name}: `data` must be a CommandData instance", {"file": str(file_path)})
        if not data.name:
            raise ValidationError(f"{file_path.name}: command is missing a name", {"file": str(file_path)})
        if not data.interaction_execute and not data.msg_execute:
            raise ValidationError(
                f'Command "{data.name}" must define at least one of msg_execute/interaction_execute', {"file": str(file_path)}
            )

    def on_load(self, data: CommandData, file_path: Path) -> List[str]:
        self.client.commands[data.name] = data

        for alias in data.aliases:
            self.client.aliases[alias] = data.name

        category = file_path.parent.name
        is_prefix = "✅" if data.command_enabled else "❌"
        is_slash = "❌"

        if data.slash_enabled and data.interaction_execute:
            self._register_slash(data)
            is_slash = "✅"

        return [category, is_prefix, is_slash]

    def _register_slash(self, data: CommandData) -> None:
        # MVP: registers a no-argument slash command. Commands that need
        # options can still declare interaction_execute and add
        # app_commands.describe/choices manually against
        # client.tree.get_command(name) after load() if needed.
        existing = self.client.tree.get_command(data.name)
        if existing is not None:
            self.client.tree.remove_command(data.name)

        async def callback(interaction: discord.Interaction) -> None:
            await self.client.errorHandler.safe_execute(
                lambda: data.interaction_execute(self.client, interaction),  # type: ignore[arg-type,misc]
                kind="command",
                name=data.name,
            )

        cmd = app_commands.Command(name=data.name, description=data.description or "No description provided.", callback=callback)
        self.client.tree.add_command(cmd)

    async def load(self) -> LoadResult:
        self.client.commands.clear()
        self.client.aliases.clear()
        return await super().load()


async def load(client: "NexusClient") -> LoadResult:
    return await CommandLoader(client).load()
