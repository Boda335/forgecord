"""Forgecord runtime configuration.

The Python template intentionally mirrors the JavaScript/TypeScript configuration
surface so projects can move between languages without changing environment
variable names or the overall settings layout.
"""
from __future__ import annotations

import os

TOKEN = os.getenv("TOKEN", "BOT_TOKEN")
PREFIX = os.getenv("PREFIX", "BOT_PREFIX")
ID = os.getenv("ID", "CLIENT_ID")
REMEMBER_ENCRYPTION_KEY = os.getenv("REMEMBER_ENCRYPTION_KEY", "")
NODE_ENV = os.getenv("NODE_ENV", "development")
LOGTAIL_ENABLE = os.getenv("LOGTAIL_ENABLE", "false").lower() == "true"
LOGTAIL_SOURCE_TOKEN = os.getenv("LOGTAIL_SOURCE_TOKEN", "")
LOGTAIL_INGESTION_HOST = os.getenv("LOGTAIL_INGESTION_HOST", "")
DASHBOARD_ENABLED = os.getenv("DASHBOARD_ENABLED", "false").lower() == "true"
DASHBOARD_PORT = int(os.getenv("DASHBOARD_PORT", "3000"))
DASHBOARD_HOST = os.getenv("DASHBOARD_HOST", "127.0.0.1")

Owners = [item.strip() for item in os.getenv('OWNER_IDS', '').split(',') if item.strip().isdigit() and 17 <= len(item.strip()) <= 20]
Dev = f"[Bot Developer]({os.getenv('DEVELOPER_URL')})" if os.getenv("DEVELOPER_URL") else "Bot Developer"
DevTeam = f"[Development Team]({os.getenv('SUPPORT_SERVER_URL')})" if os.getenv("SUPPORT_SERVER_URL") else "Development Team"

embed = {
    "color": 0x9F4015,
    "successcolor": 0x28A745,
    "warningcolor": 0xFFCC00,
    "errorcolor": 0xB50B0B,
}

emoji = {
    "ERROR": "❌",
    "SUCCESS": "✅",
    "disabled": "🔴",
    "enabled": "🟢",
    "cleared": "🧹",
    "time": "⏲️",
    "ping": "🏓",
    "bot": "🤖",
}

links = {
    "store": os.getenv("STORE_URL", ""),
    "inviteURL": "https://discord.com/api/oauth2/authorize?client_id=BOTID&permissions=6508997968&scope=bot%20applications.commands",
    "DiscordServer": os.getenv("SUPPORT_SERVER_URL", ""),
    "Devloper": os.getenv("DEVELOPER_URL", ""),
}

options = {
    "embedFooter": True,
    "debugMode": NODE_ENV != "production",
    "dashboardProduction": True,
}

slash = {
    "global": True,
    "guildIDS": [item.strip() for item in os.getenv("SLASH_GUILD_IDS", "").split(",") if item.strip().isdigit() and 17 <= len(item.strip()) <= 20],
}

# Backward-compatible aliases for older Forgecord Python projects.
CLIENT_ID = ID
OWNERS = Owners
DEV = Dev
DEV_TEAM = DevTeam
EMBED = embed
EMOJI = emoji
LINKS = {
    "store": links["store"],
    "invite_url": links["inviteURL"],
    "discord_server": links["DiscordServer"],
    "developer": links["Devloper"],
}
OPTIONS = {"embed_footer": options["embedFooter"], "debug_mode": options["debugMode"], "dashboard_production": options["dashboardProduction"]}
SLASH = {"global": slash["global"], "guild_ids": slash["guildIDS"]}
