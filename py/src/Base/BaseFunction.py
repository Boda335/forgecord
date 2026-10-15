from __future__ import annotations

from typing import TYPE_CHECKING

import discord

if TYPE_CHECKING:
    from .baseClient import NexusClient


async def interaction(client: "NexusClient", interaction: discord.Interaction, is_edit: bool = False) -> None:
    """Base hook for reusable interaction functions."""
    return None


data = interaction
