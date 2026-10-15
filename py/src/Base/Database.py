from __future__ import annotations

from typing import Any

from kivodb import KivoDB, JSONDriver, SQLiteDriver, MongoDBDriver, MySQLDriver

from ..core.paths import ROOT_DIR

DATABASE_DIR = ROOT_DIR / 'database'
JSON_PATH = DATABASE_DIR / 'database.json'
SQLITE_PATH = DATABASE_DIR / 'database.sqlite'

DEFAULT_OPTIONS: dict[str, Any] = {
    'nested': '..',
    'nestedIsEnabled': True,
    'table': 'ForgecordDB',
    'cache': {'capacity': 1024, 'isEnabled': True},
}


def _ensure_database_dir() -> None:
    DATABASE_DIR.mkdir(parents=True, exist_ok=True)


class GDB(KivoDB):
    # KivoDB wrapper with the same constructor behavior as the JS GDB class.

    def __init__(self, driver: Any, options: dict[str, Any] | None = None, db_option: dict[str, Any] | None = None) -> None:
        configured_options = (db_option or {}).get('options')
        selected_options = configured_options if configured_options is not None else (options or DEFAULT_OPTIONS)
        super().__init__(driver, selected_options)


class Database:
    @staticmethod
    def db_default(db_option: dict[str, Any] | None = None) -> GDB:
        _ensure_database_dir()
        return GDB(JSONDriver({'path': str(JSON_PATH), 'format': True}), DEFAULT_OPTIONS, db_option)

    @staticmethod
    def db_sqlite(db_option: dict[str, Any] | None = None) -> GDB:
        _ensure_database_dir()
        return GDB(SQLiteDriver({'path': str(SQLITE_PATH)}), DEFAULT_OPTIONS, db_option)

    @staticmethod
    def db_mongo(db_option: dict[str, Any] | None = None) -> GDB:
        options = (db_option or {}).get('MongoDB') or {}
        return GDB(MongoDBDriver(options), DEFAULT_OPTIONS, db_option)

    @staticmethod
    def db_mysql(db_option: dict[str, Any] | None = None) -> GDB:
        options = dict((db_option or {}).get('MySQL') or {})
        # KivoDB's MySQL driver uses aiomysql's `db` option; keep the public
        # bot.py config aligned with JS (`database`) and translate internally.
        if 'database' in options and 'db' not in options:
            options['db'] = options.pop('database')
        return GDB(MySQLDriver(options), DEFAULT_OPTIONS, db_option)
