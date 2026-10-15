from __future__ import annotations

from dataclasses import dataclass
from unittest.mock import patch

from src.functions.cooldown import check


class FakeClient:
    def __init__(self) -> None:
        self.cooldowns: dict = {}


@dataclass
class FakeCommand:
    name: str
    cooldown: int


def test_returns_false_on_first_use():
    client = FakeClient()
    cmd = FakeCommand(name="ping", cooldown=5)
    assert check(client, user_id=1, cmd=cmd) is False


def test_returns_seconds_left_on_second_call_within_window():
    client = FakeClient()
    cmd = FakeCommand(name="ping", cooldown=10)

    check(client, user_id=1, cmd=cmd)
    result = check(client, user_id=1, cmd=cmd)

    assert result is not False
    assert 0 < result <= 10


def test_tracks_users_independently():
    client = FakeClient()
    cmd = FakeCommand(name="ping", cooldown=10)

    assert check(client, user_id=1, cmd=cmd) is False
    assert check(client, user_id=2, cmd=cmd) is False


def test_allows_again_once_cooldown_expires():
    client = FakeClient()
    cmd = FakeCommand(name="ping", cooldown=5)

    with patch("src.functions.cooldown.time.monotonic", side_effect=[100.0, 106.0, 106.0]):
        assert check(client, user_id=1, cmd=cmd) is False
        assert check(client, user_id=1, cmd=cmd) is False  # 6s later, 5s cooldown -> expired
