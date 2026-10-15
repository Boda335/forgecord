from __future__ import annotations

import discord

from ...Base.baseCommand import CommandData, CommandInfo
from ...Base.i18n import i18n


async def msg_execute(client, message, args, prefix) -> None:
    current = i18n.get_for_user(message.author.id)
    await message.reply(content=current.t('ping.pong', {'ping': round(client.latency * 1000)}))


async def interaction_execute(client, interaction: discord.Interaction) -> None:
    current = i18n.get_for_user(interaction.user.id)
    await interaction.response.send_message(content=current.t('ping.pong', {'ping': round(client.latency * 1000)}), ephemeral=True)


data = CommandData(
    name="ping",
    description="Ping the bot and get the current latency",
    cooldown=10,
    category="misc",
    botPermissions=["send_messages"],
    userPermissions=["send_messages"],
    command=CommandInfo(aliases=["p", "latency"]),
    msgExecute=msg_execute,
    interactionExecute=interaction_execute,
)
