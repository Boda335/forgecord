from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING

import discord

from ...Base.baseEvents import EventData

if TYPE_CHECKING:
    from ...Base.baseClient import NexusClient

_ACTIVITY_TYPES = {
    "playing": discord.ActivityType.playing,
    "watching": discord.ActivityType.watching,
    "listening": discord.ActivityType.listening,
    "competing": discord.ActivityType.competing,
    "custom": discord.ActivityType.custom,
}

_STATUS_MAP = {
    "online": discord.Status.online,
    "idle": discord.Status.idle,
    "dnd": discord.Status.dnd,
    "invisible": discord.Status.invisible,
}


async def _presence_loop(client: "NexusClient") -> None:
    presence = client.framework.PRESENCE
    names = presence["names"]
    interval = presence["interval"]
    activity_type = _ACTIVITY_TYPES.get(str(presence["type"]).lower(), discord.ActivityType.playing)
    index = 0

    await client.change_presence(status=_STATUS_MAP.get(str(presence["status"]).lower(), discord.Status.online))

    while not client.is_closed():
        name = names[index % len(names)]
        if str(presence["type"]).lower() == "streaming":
            activity = discord.Streaming(name=name, url=presence.get("streaming_url", ""))
        else:
            activity = discord.Activity(type=activity_type, name=name)
        await client.change_presence(activity=activity)
        index += 1
        await asyncio.sleep(interval)


async def execute(client: "NexusClient") -> None:
    if client.framework.PRESENCE.get("enabled"):
        client.loop.create_task(_presence_loop(client))

    await client.DBConnect()

    client.logger.info(f"Bot logged in successfully! {client.user}")


data = EventData(name="on_ready", execute=execute, once=True)
