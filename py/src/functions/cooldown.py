from __future__ import annotations

import time
from typing import TYPE_CHECKING, Optional, Union

import discord

if TYPE_CHECKING:
    from ..Base.baseClient import NexusClient
    from ..Base.baseCommand import CommandData


def check(client: "NexusClient", user_id: int, cmd: "CommandData") -> Union[float, bool]:
    """Returns False if the command is off cooldown (and starts a new one), or the seconds left if it's still on cooldown."""
    bucket = client.cooldowns.setdefault(cmd.name, {})
    now = time.monotonic()
    cooldown_amount = cmd.cooldown

    expires_at = bucket.get(user_id)
    if expires_at is not None and now < expires_at:
        return expires_at - now

    bucket[user_id] = now + cooldown_amount
    return False


data = check
