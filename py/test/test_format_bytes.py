from __future__ import annotations

from src.functions.formatBytes import format_bytes


def test_bytes_under_1024_stay_in_bytes():
    assert format_bytes(500) == "500 bytes"


def test_converts_to_kb():
    assert format_bytes(2048) == "2.0 KB"


def test_converts_to_mb_with_decimal_when_under_10():
    result = format_bytes(5 * 1024 * 1024)
    assert result.endswith("MB")
    assert result.startswith("5.0")


def test_converts_to_gb():
    result = format_bytes(3 * 1024 * 1024 * 1024)
    assert result.endswith("GB")
