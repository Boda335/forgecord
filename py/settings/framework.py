from __future__ import annotations

ERROR_LOGGING: dict[str, object] = {
    "enabled": False,
    "webhook_url": "WEBHOOK_URL",
}

PRESENCE: dict[str, object] = {
    "enabled": True,
    "status": "idle",  # online | idle | dnd | invisible
    "interval": 10,  # seconds
    "type": "custom",  # playing | watching | listening | competing | custom | streaming
    "names": [
        "discord.gg/9cfgTktxHm",
        "Made by Nexus Studio Team",
        "Made by Boda3350",
        "Powered by Forgecord",
        "discord.gg/9cfgTktxHm",
    ],
    "streaming_url": "https://www.twitch.tv/example",
}
