"""Centralized error handling: asyncio-level exception handler, rate-limited/
batched webhook reporting, and `safe_execute()` — a single consistent
"catch, log, tell the user something went wrong" wrapper for
command/component/event execution instead of every file reimplementing
(or forgetting) its own try/except.
"""
from __future__ import annotations

import asyncio
import traceback
from datetime import datetime, timezone
from typing import TYPE_CHECKING, Any, Awaitable, Callable, Dict, Optional, TypeVar

import aiohttp

from .errors import ForgecordError

if TYPE_CHECKING:
    from ..Base.baseClient import NexusClient

T = TypeVar("T")


class ErrorHandler:
    def __init__(
        self,
        client: "NexusClient",
        *,
        webhook_url: Optional[str] = None,
        webhook_interval_seconds: float = 5.0,
    ):
        self.client = client
        self.webhook_url = webhook_url if webhook_url and webhook_url != "WEBHOOK_URL" else None
        self.webhook_interval_seconds = webhook_interval_seconds
        self._webhook_queue: list[str] = []
        self._flush_task: Optional[asyncio.Task] = None

    def attach_process_handlers(self) -> "ErrorHandler":
        loop = asyncio.get_event_loop()

        def handle_exception(loop: asyncio.AbstractEventLoop, context: dict[str, Any]) -> None:
            exc = context.get("exception")
            message = context.get("message", "")
            detail = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__)) if exc else message
            self.report(f"Unhandled asyncio exception: {detail}", {"source": "asyncio_exception_handler"})

        loop.set_exception_handler(handle_exception)
        return self

    async def safe_execute(self, fn: Callable[[], Awaitable[T]], **context: Any) -> Optional[T]:
        """Runs `fn`, catching and reporting any error instead of letting it
        propagate. Use this to wrap command/component/event execution."""
        try:
            return await fn()
        except Exception as err:
            known = isinstance(err, ForgecordError)
            kind = context.get("kind", "handler")
            name = context.get("name")
            label = f'{kind} "{name}"' if name else kind
            detail = str(err) if known else traceback.format_exc()
            self.report(f"Error in {label}: {err}\n{detail if not known else ''}".rstrip(), context)
            await self.client.hooks.emit("commandError", {"error": err, "context": context})
            return None

    def report(self, message: str, context: Optional[Dict[str, Any]] = None) -> None:
        """Logs to console + file, and queues a (rate-limited) webhook post. Never raises."""
        self.client.logger.error(message)
        asyncio.create_task(
            self.client.logger.logToFile(f"{datetime.now(timezone.utc).isoformat()} {context or {}}\n{message}")
        )
        if self.webhook_url:
            self._queue_webhook(message)

    def _queue_webhook(self, message: str) -> None:
        self._webhook_queue.append(message)
        if self._flush_task is None:
            self._flush_task = asyncio.create_task(self._flush_webhook_later())

    async def _flush_webhook_later(self) -> None:
        await asyncio.sleep(self.webhook_interval_seconds)
        self._flush_task = None
        batch, self._webhook_queue = self._webhook_queue, []
        if not batch:
            return

        description = "\n---\n".join(batch)[:3900]
        payload = {
            "embeds": [
                {
                    "title": f"Error Notification{f' ({len(batch)} errors batched)' if len(batch) > 1 else ''}",
                    "description": f"```{description}```",
                    "color": 0xFF0000,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "footer": {"text": "Forgecord Error Logger"},
                }
            ]
        }
        try:
            async with aiohttp.ClientSession() as session:
                await session.post(self.webhook_url, json=payload)  # type: ignore[arg-type]
        except Exception as err:
            self.client.logger.error("Failed to deliver error webhook:", err)
