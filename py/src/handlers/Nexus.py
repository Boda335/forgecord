from __future__ import annotations

from typing import Optional

import discord

from ..Base.baseClient import NexusClient
from ..Base.i18n import i18n


class NEXUS(NexusClient):
    """NexusClient owns setup_hook()/launch()/get_footer()/embed(). This
    subclass keeps only what's genuinely bot-specific: the interactive
    help menu."""

    async def handle_help_system(
        self,
        *,
        interaction: Optional[discord.Interaction] = None,
        message: Optional[discord.Message] = None,
    ) -> None:
        user = interaction.user if interaction else message.author  # type: ignore[union-attr]
        guild = interaction.guild if interaction else message.guild
        current = i18n.get_for_user(user.id)  # type: ignore[union-attr]

        categories = [c for c in self.mcategories if c != "dev"]
        options = [discord.SelectOption(label=cat.title(), value=cat, description=current.t('help.viewCategory', {'category': cat})) for cat in categories]
        options.append(discord.SelectOption(label="Home", value="home", emoji="🏠", description=current.t('help.home')))

        select = discord.ui.Select(placeholder=current.t('help.selectCategory'), options=options)
        view = discord.ui.View(timeout=60)
        view.add_item(select)

        home_embed = discord.Embed(
            color=self.config.EMBED["color"],
            description=current.t('help.description'),
        )
        home_embed.set_author(name=str(self.user), icon_url=self.user.display_avatar.url)  # type: ignore[union-attr]
        if guild and guild.icon:
            home_embed.set_thumbnail(url=guild.icon.url)
        home_embed.add_field(
            name=current.t('help.stats'),
            value=current.t('help.statsValue', {'commands': len(self.commands), 'guilds': len(self.guilds), 'uptime': '—', 'ping': round(self.latency * 1000)}),
        )
        footer = self.get_footer(user)
        if footer:
            home_embed.set_footer(**footer)

        async def select_callback(select_interaction: discord.Interaction) -> None:
            if select_interaction.user.id != user.id:
                await select_interaction.response.send_message(current.t('help.notYourInteraction'), ephemeral=True)
                return

            await select_interaction.response.defer()
            chosen = select.values[0]

            if chosen == "home":
                await select_interaction.edit_original_response(embed=home_embed)
                return

            cat_embed = discord.Embed(color=self.config.EMBED["color"], title=f"{chosen.title()} {current.t('help.commands')}")
            lines = []
            for cmd in self.commands.values():
                if cmd.category == chosen:
                    translated = current.t(f'commands.{cmd.name}.description')
                    line = f"> 📌 `{cmd.name}` - {translated if translated != f'commands.{cmd.name}.description' else cmd.description}"
                    if cmd.aliases:
                        line += f"\n> 🔁 {current.t('help.aliases')}: `{'`, `'.join(cmd.aliases)}`"
                    lines.append(line)
            cat_embed.description = "\n\n".join(lines) or current.t('help.noCommands')
            if footer:
                cat_embed.set_footer(**footer)

            await select_interaction.edit_original_response(embed=cat_embed)

        select.callback = select_callback  # type: ignore[assignment]

        if interaction:
            if interaction.response.is_done():
                await interaction.followup.send(embed=home_embed, view=view, ephemeral=True)
            else:
                await interaction.response.send_message(embed=home_embed, view=view, ephemeral=True)
        elif message:
            await message.reply(embed=home_embed, view=view)
