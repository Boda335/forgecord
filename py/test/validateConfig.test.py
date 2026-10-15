from __future__ import annotations

import pytest

from src.core.errors import ConfigError
from src.core.validateConfig import validate_config


def test_accepts_a_real_looking_token():
    validate_config("a.real.token", "123456789012345678")  # should not raise


def test_rejects_a_missing_token():
    with pytest.raises(ConfigError):
        validate_config("", "CLIENT_ID")


def test_rejects_the_untouched_placeholder_token():
    with pytest.raises(ConfigError):
        validate_config("BOT_TOKEN", "CLIENT_ID")


def test_lists_all_problems_in_one_error():
    with pytest.raises(ConfigError) as exc_info:
        validate_config("", "not-a-snowflake")
    message = str(exc_info.value)
    assert "TOKEN is missing" in message
    assert "doesn't look like a Discord" in message


def test_does_not_flag_id_when_plausible_snowflake():
    validate_config("a.real.token", "1344065394368839701")  # should not raise


def test_does_not_flag_missing_placeholder_id_alone():
    validate_config("a.real.token", "CLIENT_ID")  # should not raise
