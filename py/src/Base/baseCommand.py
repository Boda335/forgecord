"""Canonical command contract shared by all Python command modules."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Awaitable, Callable, List, Optional, Any

import discord

if TYPE_CHECKING:
    from .baseClient import NexusClient

MsgExecuteFn = Callable[["NexusClient", discord.Message, List[str], str], Awaitable[Any] | Any]
InteractionExecuteFn = Callable[["NexusClient", discord.Interaction, List[Any]], Awaitable[Any] | Any]
AutocompleteExecuteFn = Callable[["NexusClient", discord.AutocompleteInteraction], Awaitable[Any] | Any]


@dataclass
class CommandInfo:
    enabled: bool = True
    aliases: List[str] = field(default_factory=list)
    usage: str = ""
    minArgsCount: int = 0
    subcommands: List[dict[str, str]] = field(default_factory=list)


@dataclass
class SlashCommandInfo:
    enabled: bool = True
    ephemeral: bool = False


@dataclass
class CommandData:
    name: str
    description: str
    cooldown: int = 0
    isPremium: bool = False
    category: str = "NONE"
    about: str = ""
    botPermissions: List[str] = field(default_factory=list)
    userPermissions: List[str] = field(default_factory=list)
    validations: List[Any] = field(default_factory=list)
    options: List[Any] = field(default_factory=list)
    dmonly: bool = False
    userInstall: bool = False
    command: CommandInfo = field(default_factory=CommandInfo)
    slashCommand: SlashCommandInfo = field(default_factory=SlashCommandInfo)
    msgExecute: Optional[MsgExecuteFn] = None
    interactionExecute: Optional[InteractionExecuteFn] = None
    autocompleteExecute: Optional[AutocompleteExecuteFn] = None

    # Compatibility helpers for the previous snake_case Python template.
    @property
    def aliases(self) -> List[str]:
        return self.command.aliases

    @property
    def command_enabled(self) -> bool:
        return self.command.enabled

    @property
    def slash_enabled(self) -> bool:
        return self.slashCommand.enabled

    @property
    def bot_permissions(self) -> List[str]:
        return self.botPermissions

    @property
    def user_permissions(self) -> List[str]:
        return self.userPermissions

    @property
    def msg_execute(self):
        return self.msgExecute

    @property
    def interaction_execute(self):
        return self.interactionExecute
