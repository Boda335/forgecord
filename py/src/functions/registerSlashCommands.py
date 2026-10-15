from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ..Base.baseClient import NexusClient


async def register_slash_commands(client: "NexusClient") -> None:
    """Sync the app command tree according to Forgecord's slash settings."""
    if client.config.SLASH["global"]:
        await client.tree.sync()
        client.logger.info("Global slash commands registered.")
        return

    for guild_id in client.config.SLASH["guild_ids"]:
        guild = client.get_guild(int(guild_id))
        if guild is None:
            client.logger.warn(f"Guild with ID {guild_id} not found.")
            continue
        client.tree.copy_global_to(guild=guild)
        await client.tree.sync(guild=guild)
        client.logger.info(f"Slash commands registered for guild: {guild.name} ({guild.id})")


registerSlashCommands = register_slash_commands
