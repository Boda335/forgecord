from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Awaitable, Callable, List, Optional

import discord

if TYPE_CHECKING:
    from .baseClient import NexusClient

ActionFn = Callable[["NexusClient", discord.Interaction, List[str]], Awaitable[None]]


@dataclass
class ComponentData:
    name: str
    action: ActionFn
    custom_id: Optional[str] = None
    enabled: bool = True
    bot_permissions: List[str] = field(default_factory=list)
    user_permissions: List[str] = field(default_factory=list)
