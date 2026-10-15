from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional

import discord

if TYPE_CHECKING:
    from ..Base.baseClient import NexusClient


async def handle_interaction(client: "NexusClient", interaction: discord.Interaction, parts: Optional[List[str]] = None) -> None:
    """Looks up a handler in `client.components_action` by custom_id. This is
    for raw/persistent components (e.g. buttons on a message that outlives a
    bot restart) — components attached to an active `discord.ui.View`
    instance are already dispatched directly by discord.py and don't need
    this path.
    """
    custom_id = interaction.data.get("custom_id") if interaction.data else None
    if not custom_id:
        return

    segments = parts or custom_id.split("_")

    handler = client.components_action.get(custom_id) or next(
        (h for h in client.components_action.values() if h.custom_id == custom_id), None
    )
    if handler is None:
        handler = next((h for h in client.components_action.values() if h.name.startswith(segments[0])), None)

    if handler is None or not handler.enabled:
        return

    if handler.user_permissions and interaction.user:
        member = interaction.user
        perms = getattr(member, "guild_permissions", None)
        if perms and not all(getattr(perms, p, False) for p in handler.user_permissions):
            await interaction.response.send_message(
                f"🚫 You need `{', '.join(handler.user_permissions)}` to use this interaction.", ephemeral=True
            )
            return

    if handler.bot_permissions and interaction.guild and interaction.guild.me:
        bot_perms = interaction.guild.me.guild_permissions
        if not all(getattr(bot_perms, p, False) for p in handler.bot_permissions):
            await interaction.response.send_message(
                f"🤖 I need `{', '.join(handler.bot_permissions)}` to perform this action.", ephemeral=True
            )
            return

    await client.errorHandler.safe_execute(
        lambda: handler.action(client, interaction, segments), kind="component", name=handler.name
    )


data = handle_interaction
