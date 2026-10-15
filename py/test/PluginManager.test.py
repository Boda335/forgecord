from __future__ import annotations

from pathlib import Path
from unittest.mock import MagicMock

import pytest

from src.core.PluginManager import PluginManager

FIXTURES = Path(__file__).parent / "fixtures"


class FakeClient:
    def __init__(self) -> None:
        self.log = MagicMock()


@pytest.mark.asyncio
async def test_returns_zero_loaded_when_plugins_dir_missing():
    client = FakeClient()
    manager = PluginManager(client, FIXTURES / "does-not-exist")
    result = await manager.load_all()
    assert result == {"loaded": 0}


@pytest.mark.asyncio
async def test_loads_well_formed_plugin_and_runs_on_load():
    client = FakeClient()
    manager = PluginManager(client, FIXTURES / "plugins_good")
    result = await manager.load_all()

    assert result == {"loaded": 1}
    assert client._tracker_loaded is True
    assert "tracker" in manager.plugins


@pytest.mark.asyncio
async def test_sets_client_hooks_before_loading():
    client = FakeClient()
    manager = PluginManager(client, FIXTURES / "plugins_good")
    assert client.hooks is manager.hooks
    await manager.load_all()
    assert client.hooks is manager.hooks


@pytest.mark.asyncio
async def test_logs_and_skips_plugin_missing_name_and_one_that_throws():
    client = FakeClient()
    manager = PluginManager(client, FIXTURES / "plugins_bad")
    result = await manager.load_all()

    assert result == {"loaded": 0}
    messages = [str(call.args) for call in client.log.call_args_list]
    assert any('missing a module-level "plugin.name"' in m for m in messages)
    assert any("setup failed" in m for m in messages)


@pytest.mark.asyncio
async def test_rejects_second_plugin_with_duplicate_name():
    client = FakeClient()
    manager = PluginManager(client, FIXTURES / "plugins_dup")
    result = await manager.load_all()

    assert result == {"loaded": 1}
    assert len(manager.plugins) == 1
