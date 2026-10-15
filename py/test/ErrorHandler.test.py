from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.core.ErrorHandler import ErrorHandler
from src.core.errors import ValidationError
from src.core.hooks import HookBus


class FakeLogger:
    def __init__(self) -> None:
        self.log_to_file = AsyncMock(return_value=None)


class FakeClient:
    def __init__(self) -> None:
        self.log = MagicMock()
        self.logger = FakeLogger()
        self.hooks = HookBus()
        self.hooks.emit = AsyncMock(wraps=self.hooks.emit)  # type: ignore[method-assign]


@pytest.mark.asyncio
async def test_safe_execute_returns_value_on_success_and_never_reports():
    client = FakeClient()
    handler = ErrorHandler(client)

    async def ok():
        return 42

    result = await handler.safe_execute(ok, kind="command", name="ping")
    assert result == 42
    client.log.assert_not_called()


@pytest.mark.asyncio
async def test_safe_execute_catches_error_logs_and_returns_none():
    client = FakeClient()
    handler = ErrorHandler(client)

    async def boom():
        raise RuntimeError("boom")

    result = await handler.safe_execute(boom, kind="command", name="ping")
    assert result is None
    client.log.assert_called_once()
    client.hooks.emit.assert_awaited_once()
    call_args = client.hooks.emit.call_args
    assert call_args.args[0] == "commandError"
    assert call_args.args[1]["context"] == {"kind": "command", "name": "ping"}


@pytest.mark.asyncio
async def test_safe_execute_includes_traceback_only_for_unknown_errors():
    client = FakeClient()
    handler = ErrorHandler(client)

    async def known_error():
        raise ValidationError("bad shape")

    await handler.safe_execute(known_error, kind="command", name="a")
    known_message = client.log.call_args.args[1]
    assert "bad shape" in known_message
    assert "Traceback" not in known_message

    client.log.reset_mock()

    async def unknown_error():
        raise RuntimeError("unexpected")

    await handler.safe_execute(unknown_error, kind="command", name="b")
    unknown_message = client.log.call_args.args[1]
    assert "unexpected" in unknown_message
    assert "Traceback" in unknown_message


@pytest.mark.asyncio
async def test_report_does_not_queue_webhook_when_not_configured():
    client = FakeClient()
    handler = ErrorHandler(client, webhook_url=None)

    with patch("aiohttp.ClientSession.post", new_callable=AsyncMock) as post:
        handler.report("oops")
        await asyncio.sleep(0.05)
        post.assert_not_called()


@pytest.mark.asyncio
async def test_report_treats_placeholder_webhook_url_as_not_configured():
    client = FakeClient()
    handler = ErrorHandler(client, webhook_url="WEBHOOK_URL")

    with patch("aiohttp.ClientSession.post", new_callable=AsyncMock) as post:
        handler.report("oops")
        await asyncio.sleep(0.05)
        post.assert_not_called()


@pytest.mark.asyncio
async def test_report_batches_multiple_errors_into_one_webhook_post():
    client = FakeClient()
    handler = ErrorHandler(client, webhook_url="https://discord.com/api/webhooks/x/y", webhook_interval_seconds=0.02)

    with patch("aiohttp.ClientSession.post", new_callable=AsyncMock) as post:
        handler.report("error one")
        handler.report("error two")
        handler.report("error three")
        post.assert_not_called()  # not flushed yet

        await asyncio.sleep(0.08)

        post.assert_awaited_once()
        payload = post.call_args.kwargs["json"]
        description = payload["embeds"][0]["description"]
        assert "error one" in description
        assert "error three" in description
        assert "3 errors batched" in payload["embeds"][0]["title"]


@pytest.mark.asyncio
async def test_failed_webhook_delivery_never_raises():
    client = FakeClient()
    handler = ErrorHandler(client, webhook_url="https://discord.com/api/webhooks/x/y", webhook_interval_seconds=0.01)

    with patch("aiohttp.ClientSession.post", side_effect=RuntimeError("network down")):
        handler.report("first batch error")
        await asyncio.sleep(0.05)  # should not raise / crash the test
