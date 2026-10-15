from __future__ import annotations

import discord

from ...Base.baseCommand import CommandData, CommandInfo
from ...Base.i18n import i18n
from ...core.logger import Logger
from ...handlers.reloadAll import reload_all


def _format_summary(result: dict) -> str:
    return (
        "```\n"
        f"DONE Commands: {result['commands']['loaded']} loaded, {result['commands']['failed']} failed\n"
        f"DONE Components: {result['interactions']['loaded']} loaded, {result['interactions']['failed']} failed\n"
        f"DONE Functions: {result['functions']['loaded']} loaded, {result['functions']['failed']} failed\n"
        "```"
    )


async def msg_execute(client, message, args, prefix) -> None:
    current = i18n.get_for_user(message.author.id)
    try:
        result = await reload_all(client)
        await message.reply(content=f"```\n{current.t('reload.done', {'commandsLoaded': result['commands']['loaded'], 'commandsFailed': result['commands']['failed'], 'interactionsLoaded': result['interactions']['loaded'], 'interactionsFailed': result['interactions']['failed'], 'functionsLoaded': result['functions']['loaded'], 'functionsFailed': result['functions']['failed']})}\n```")
    except Exception as err:
        Logger.error('Error in reload command:', err)
        await message.reply(content=current.t('reload.error', {'error': str(err)}))


async def interaction_execute(client, interaction: discord.Interaction) -> None:
    current = i18n.get_for_user(interaction.user.id)
    try:
        await interaction.response.defer(ephemeral=True)
        result = await reload_all(client)
        await interaction.followup.send(content=f"```\n{current.t('reload.done', {'commandsLoaded': result['commands']['loaded'], 'commandsFailed': result['commands']['failed'], 'interactionsLoaded': result['interactions']['loaded'], 'interactionsFailed': result['interactions']['failed'], 'functionsLoaded': result['functions']['loaded'], 'functionsFailed': result['functions']['failed']})}\n```")
    except Exception as err:
        Logger.error('Error in reload command:', err)
        await interaction.followup.send(content=current.t('reload.error', {'error': str(err)}))


data = CommandData(
    name="refrish",
    description="Reload commands, functions, and components without restarting the bot",
    cooldown=10,
    category="OWNER",
    botPermissions=["manage_guild"],
    userPermissions=["manage_channels"],
    command=CommandInfo(aliases=["rl", "re"]),
    msgExecute=msg_execute,
    interactionExecute=interaction_execute,
)