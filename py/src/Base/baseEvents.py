from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Any, Awaitable, Callable

if TYPE_CHECKING:
    from .baseClient import NexusClient

ExecuteFn = Callable[..., Awaitable[None]]


@dataclass
class EventData:
    """`name` must match a discord.py event name, e.g. "on_ready", "on_message",
    "on_interaction". `once` runs the handler at most one time (useful for
    startup-only logic in an on_ready handler)."""

    name: str
    execute: ExecuteFn
    once: bool = False
