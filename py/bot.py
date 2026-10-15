from __future__ import annotations

import asyncio

from dotenv import load_dotenv

load_dotenv()

from settings import config  # noqa: E402  (must load .env first)
from src.core.errors import ConfigError  # noqa: E402
from src.core.validateConfig import validate_config  # noqa: E402
from src.handlers.Nexus import NEXUS  # noqa: E402
from src.dashboard.server import start_dashboard_server  # noqa: E402


# Database configuration — choose a driver here; no database settings are required in .env.
# Supported drivers: JSON, Sqlite, MONGODB, and MySQL.

try:
    validate_config(config.TOKEN, config.CLIENT_ID)
except ConfigError as err:
    raise SystemExit(f"\n{err}\n") from None


async def main() -> None:
    client = NEXUS(
        database={
            # ! if use database_type "JSON" Default path in @root/database/database.json
            # ! if use database_type "Sqlite" Default path in @root/database/database.sqlite
            "database_type": "JSON",  # @forgecord-database-type
            "MongoDB": {
                "database": "Forgecord",  # you can change the database name
                "uri": "mongodb://127.0.0.1:27017",
            },
            # ! if use database_type "MySQL"
            "MySQL": {
                "database": "Forgecord",  # you can change the database name
                "host": "localhost",  # your host or ip
                "port": 3306,  # your port default 3306
                "user": "forgecord",  # your username
                "password": "forgecord",  # your password
            },

            # ! if using cache system in work space and modifying any data in database manually,
            # ! cache may still return the old value until cache is updated.
            "options": {
                "table": "ForgecordDB",
                "nested": "..",  # default use it
                "nestedIsEnabled": True,  # default use it
                "cache": {
                    "capacity": 1024,  # default use it
                    "isEnabled": True,  # default use it
                },
            },
        }
    )
    dashboard_task = None
    if config.DASHBOARD_ENABLED:
        dashboard_task = asyncio.create_task(start_dashboard_server(client))
    try:
        await client.launch(config.TOKEN)
    except Exception as err:
        # A failure to even start (bad token, network down, ...) can't be
        # routed through client.errorHandler in a meaningful way since
        # login never succeeded, so this stays a plain print + non-zero exit.
        print(f"Fatal: Forgecord failed to start: {err}")
        raise SystemExit(1) from err
    finally:
        if dashboard_task:
            dashboard_task.cancel()


if __name__ == "__main__":
    asyncio.run(main())
