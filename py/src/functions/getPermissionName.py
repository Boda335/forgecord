from __future__ import annotations

from typing import List

import discord


def get_permission_name(permissions: discord.Permissions) -> List[str]:
    return [name for name, value in permissions if value]


data = get_permission_name
