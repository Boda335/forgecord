from __future__ import annotations

from typing import TYPE_CHECKING

import discord

from ...Base.baseEvents import EventData
from ...functions.handleInteraction import handle_interaction

if TYPE_CHECKING:
    from ...Base.baseClient import NexusClient


async def execute(client: "NexusClient", interaction: discord.Interaction) -> None:
    # Slash commands are already dispatched by client.tree; only handle raw
    # component interactions here (buttons/selects not backed by an active
    # discord.ui.View instance, e.g. on a message that outlived a restart).
    if interaction.type != discord.InteractionType.component:
        return

    await handle_interaction(client, interaction)


data = EventData(name="on_interaction", execute=execute)
