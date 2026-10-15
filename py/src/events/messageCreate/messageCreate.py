from __future__ import annotations

import re
from typing import TYPE_CHECKING

import discord

from ...Base.baseEvents import EventData
from ...functions.cooldown import check as check_cooldown

if TYPE_CHECKING:
    from ...Base.baseClient import NexusClient



def random_cooldown_reply(time_left: float) -> str:
    timestamp = int(__import__("time").time() + time_left)
    replies = [
        f"**Please wait and try again <t:{timestamp}:R>.**",
        f"**Hold on, you can use this command again <t:{timestamp}:R>.**",
        f"**You're doing that too quickly. Try again <t:{timestamp}:R>.**",
        f"**Slow down! You can run this command <t:{timestamp}:R>.**",
        f"**This command is on cooldown. Try again <t:{timestamp}:R>.**",
        f"**Patience! You can try again <t:{timestamp}:R>.**",
    ]
    import random
    return random.choice(replies)

def _escape_regex(text: str) -> str:
    return re.escape(text)


async def execute(client: "NexusClient", message: discord.Message) -> None:
    if message.author.bot or not message.guild:
        return

    prefix = client.config.PREFIX
    mention_prefix = re.compile(rf"^(<@!?{client.user.id}>|{_escape_regex(prefix)})\s*")  # type: ignore[union-attr]
    match = mention_prefix.match(message.content)
    if not match:
        return

    used_prefix = match.group(1)
    rest = message.content[match.end():].strip()
    parts = rest.split() if rest else []

    if not parts:
        if str(client.user.id) in used_prefix:  # type: ignore[union-attr]
            embed = discord.Embed(
                color=client.config.EMBED["color"],
                description=(
                    f"**My prefix for `{message.guild.name}` is `{prefix}`**\n"
                    f"**You can join our [Support Server]({client.config.LINKS['discord_server']}) for more help!**"
                ),
            )
            embed.set_author(name=client.user.name, icon_url=client.user.display_avatar.url)  # type: ignore[union-attr]
            await message.reply(embed=embed)
        return

    cmd_name = parts.pop(0).lower()
    args = parts

    command = client.commands.get(cmd_name) or client.commands.get(client.aliases.get(cmd_name, ""))
    if not command or not command.command_enabled:
        return

    if command.user_permissions:
        member_perms = message.author.guild_permissions  # type: ignore[union-attr]
        if not all(getattr(member_perms, p, False) for p in command.user_permissions):
            needed = ", ".join(f"`{p}`" for p in command.user_permissions)
            await client.embed(message, f"**🙄 You need {needed} permission(s) to use this command.**")
            return

    if command.bot_permissions and message.guild.me:
        bot_perms = message.guild.me.guild_permissions
        if not all(getattr(bot_perms, p, False) for p in command.bot_permissions):
            needed = ", ".join(f"`{p}`" for p in command.bot_permissions)
            await client.embed(message, f"**🙄 I need {needed} permission(s) to run `{command.name}`.**")
            return

    time_left = check_cooldown(client, message.author.id, command)
    if time_left:
        reply = await message.reply(content=random_cooldown_reply(time_left))
        return

    if command.category == "OWNER" and str(message.author.id) not in client.config.OWNERS:
        await message.reply(content=":rolling_eyes: **This command is for the bot owner only**")
        return

    if not command.msg_execute:
        return

    await client.errorHandler.safe_execute(
        lambda: command.msg_execute(client, message, args, used_prefix), kind="command", name=command.name  # type: ignore[misc]
    )


data = EventData(name="on_message", execute=execute)
