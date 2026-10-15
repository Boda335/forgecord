from __future__ import annotations

from pathlib import Path

import pytest

from src.Base.baseCommand import CommandData
from src.core.errors import ValidationError
from src.handlers.CommandLoader import CommandLoader


async def _noop(*args, **kwargs):
    pass


def make_loader() -> CommandLoader:
    # validate() never touches the client, so None is fine here.
    return CommandLoader(client=None)  # type: ignore[arg-type]


def test_accepts_well_formed_command():
    loader = make_loader()
    data = CommandData(name="ping", description="Ping", interaction_execute=_noop)
    loader.validate(data, Path("ping.py"))  # should not raise


def test_rejects_non_command_data():
    loader = make_loader()
    with pytest.raises(ValidationError):
        loader.validate({"name": "ping"}, Path("bad.py"))  # type: ignore[arg-type]


def test_rejects_command_without_name():
    loader = make_loader()
    data = CommandData(name="", description="x", interaction_execute=_noop)
    with pytest.raises(ValidationError):
        loader.validate(data, Path("bad.py"))


def test_rejects_command_with_no_execute_functions():
    loader = make_loader()
    data = CommandData(name="ping", description="x")
    with pytest.raises(ValidationError):
        loader.validate(data, Path("bad.py"))


def test_accepts_command_defined_with_only_msg_execute():
    loader = make_loader()
    data = CommandData(name="ping", description="x", msg_execute=_noop)
    loader.validate(data, Path("ping.py"))  # should not raise
