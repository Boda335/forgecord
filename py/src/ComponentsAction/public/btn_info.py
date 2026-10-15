from __future__ import annotations

from typing import List

import discord

from ...Base.baseComponent import ComponentData


async def action(client, interaction: discord.Interaction, parts: List[str]) -> None:
    await interaction.response.defer()
    # Your button logic goes here.


data = ComponentData(name="btn_info", action=action, enabled=True)
