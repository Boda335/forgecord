from __future__ import annotations

import discord

from ...Base.baseCommand import CommandData, CommandInfo


async def msg_execute(client, message, args, prefix) -> None:
    await client.handle_help_system(message=message)


async def interaction_execute(client, interaction: discord.Interaction) -> None:
    await client.handle_help_system(interaction=interaction)


data = CommandData(
    name="help",
    description="Get help with the bot commands",
    cooldown=10,
    category="misc",
    botPermissions=["send_messages"],
    userPermissions=["send_messages"],
    command=CommandInfo(aliases=["helpme", "commands", "cmd"]),
    msgExecute=msg_execute,
    interactionExecute=interaction_execute,
)
