from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING, TypedDict

from .CommandLoader import load as load_commands
from .ComponentsLoader import load as load_components
from .FunctionsLoader import load as load_functions

if TYPE_CHECKING:
    from ..Base.baseClient import NexusClient


class ReloadSummary(TypedDict):
    loaded: int
    failed: int


class ReloadAllResult(TypedDict):
    commands: ReloadSummary
    functions: ReloadSummary
    interactions: ReloadSummary


async def reload_all(client: "NexusClient") -> ReloadAllResult:
    commands, functions, interactions = await asyncio.gather(
        load_commands(client),
        load_functions(client),
        load_components(client),
    )

    if client.config.SLASH["global"]:
        await client.tree.sync()
    else:
        for guild_id in client.config.SLASH["guild_ids"]:
            import discord

            await client.tree.sync(guild=discord.Object(id=guild_id))

    return {
        "commands": {"loaded": commands.loaded, "failed": commands.failed},
        "functions": {"loaded": functions.loaded, "failed": functions.failed},
        "interactions": {"loaded": interactions.loaded, "failed": interactions.failed},
    }