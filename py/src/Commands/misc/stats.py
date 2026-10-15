from __future__ import annotations

import platform
import time

import discord

from ...Base.baseCommand import CommandData, CommandInfo
from ...Base.i18n import i18n
from ...functions.formatBytes import format_bytes

_START_TIME = time.time()


def _build_embed(client, current) -> discord.Embed:
    total_mem, used_mem = _memory_snapshot()

    embed = discord.Embed(color=client.config.EMBED["color"], title=current.t('stats.title'))
    embed.set_thumbnail(url=client.user.display_avatar.url)
    embed.add_field(name=current.t('stats.memory'), value=f"`{format_bytes(used_mem)}` / `{format_bytes(total_mem)}`", inline=True)
    embed.add_field(name=current.t('stats.uptime'), value=f"<t:{int(_START_TIME)}:R>", inline=True)
    embed.add_field(name=current.t('stats.servers'), value=f"`{len(client.guilds)}`", inline=True)
    embed.add_field(name=current.t('stats.users'), value=f"`{sum(g.member_count or 0 for g in client.guilds):,}`", inline=True)
    embed.add_field(name=current.t('stats.discordjs'), value=f"v{discord.__version__}", inline=True)
    embed.add_field(name=current.t('stats.node'), value=platform.python_version(), inline=True)
    embed.add_field(name=current.t('stats.ping'), value=f"{round(client.latency * 1000)}ms", inline=True)
    embed.add_field(name=current.t('stats.arch'), value=platform.machine(), inline=True)
    embed.add_field(name=current.t('stats.platform'), value=platform.system(), inline=True)
    embed.set_footer(text=current.t('stats.footer', {'bot': client.user.name}), icon_url=client.user.display_avatar.url)
    return embed


def _memory_snapshot() -> tuple[int, int]:
    """Uses /proc/meminfo on Linux (no extra dependency needed); falls back
    to a rough estimate elsewhere since Python's stdlib has no portable
    total/used-RAM API without a package like psutil."""
    try:
        with open("/proc/meminfo") as f:
            info = {}
            for line in f:
                key, value = line.split(":")
                info[key.strip()] = int(value.strip().split()[0]) * 1024  # kB -> bytes
        total = info.get("MemTotal", 0)
        free = info.get("MemAvailable", info.get("MemFree", 0))
        return total, total - free
    except Exception:
        return 0, 0


async def msg_execute(client, message, args, prefix) -> None:
    await message.reply(embed=_build_embed(client, i18n.get_for_user(message.author.id)))


async def interaction_execute(client, interaction: discord.Interaction) -> None:
    await interaction.response.send_message(embed=_build_embed(client, i18n.get_for_user(interaction.user.id)), ephemeral=True)


data = CommandData(
    name="botinfo",
    description="Shows bot statistics",
    cooldown=10,
    category="misc",
    botPermissions=["send_messages"],
    userPermissions=["send_messages"],
    command=CommandInfo(aliases=["stats", "statistics", "info"]),
    msgExecute=msg_execute,
    interactionExecute=interaction_execute,
)
