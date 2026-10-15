from __future__ import annotations

import discord

from ...Base.baseCommand import CommandData, CommandInfo, SlashCommandInfo
from ...Base.i18n import i18n


def language_map() -> dict[str, tuple[str, str]]:
    return {item["lang"]: (item.get("flag", ""), item.get("name", item["lang"])) for item in i18n.get_available_languages()}

class LanguageView(discord.ui.View):
    def __init__(self, user_id: int):
        super().__init__(timeout=60)
        self.user_id = user_id
        languages = language_map()
        self.select = discord.ui.Select(
            placeholder=i18n.get_for_user(user_id).t("lang.choose"),
            options=[discord.SelectOption(label=f"{flag} {name}".strip(), value=code) for code, (flag, name) in languages.items()],
        )
        self.select.callback = self.on_select
        self.add_item(self.select)

    async def on_select(self, interaction: discord.Interaction) -> None:
        current = i18n.get_for_user(interaction.user.id)
        if interaction.user.id != self.user_id:
            await interaction.response.send_message(current.t("help.notYourInteraction"), ephemeral=True)
            return
        requested = self.select.values[0]
        i18n.set_user_language(interaction.user.id, requested)
        flag, name = language_map()[requested]
        await interaction.response.edit_message(content=i18n.get(requested).t("lang.changed", {"language": f"{flag} {name}"}), view=None)
        self.stop()

async def msg_execute(client, message, args, prefix) -> None:
    current = i18n.get_for_user(message.author.id)
    requested = str(args[0]).lower() if args else ""
    if not requested:
        await message.reply(content=current.t("lang.description"), view=LanguageView(message.author.id))
        return
    languages = language_map()
    if requested not in languages:
        await message.reply(content=current.t("lang.invalid", {"languages": ", ".join(f"{flag} {code}" for code, (flag, _) in languages.items())}))
        return
    i18n.set_user_language(message.author.id, requested)
    flag, name = languages[requested]
    await message.reply(content=i18n.get(requested).t("lang.changed", {"language": f"{flag} {name}"}))

async def interaction_execute(client, interaction: discord.Interaction, args=None) -> None:
    current = i18n.get_for_user(interaction.user.id)
    await interaction.response.send_message(content=current.t("lang.description"), view=LanguageView(interaction.user.id), ephemeral=True)

data = CommandData(
    name="lang", description="Change your preferred language", cooldown=3, category="misc",
    botPermissions=["send_messages"], userPermissions=["send_messages"],
    command=CommandInfo(aliases=["language"], minArgsCount=0), slashCommand=SlashCommandInfo(enabled=True, ephemeral=True),
    msgExecute=msg_execute, interactionExecute=interaction_execute,
)
