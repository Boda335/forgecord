"""Forgecord's Python logger.

The public API and runtime behavior intentionally mirror the JavaScript logger:
- info(), warn(), error(), debug()
- log() for styled Forgecord client messages
- logToFile() for error-handler snapshots
- daily + size based rotating JSON logs
- exceptions.log / rejections.log
- caller file + line information
- optional Better Stack / Logtail transport
- process/thread/asyncio exception hooks

Only the implementation language and the underlying logging primitives differ.
"""
from __future__ import annotations

import asyncio
import gzip
import inspect
import json
import logging
import os
import sys
import threading
from datetime import datetime, timezone
from pathlib import Path
from pprint import pformat
from typing import Any, Literal, TypeAlias

from rich.console import Console

from .paths import ERRORS_DIR, ROOT_DIR

try:
    from logtail import LogtailHandler
except ImportError:  # optional until LOGTAIL_ENABLE is enabled
    LogtailHandler = None  # type: ignore[assignment,misc]

StyleKey: TypeAlias = Literal[
    "successColor", "warningColor", "infoColor", "commandColor", "userColor",
    "errorColor", "highlightColor", "accentColor", "secondaryColor",
    "primaryColor", "dividerColor", "1",
]
LogPart: TypeAlias = str | tuple[StyleKey, str]

_LEVELS = {"debug": logging.DEBUG, "info": logging.INFO, "warn": logging.WARNING, "error": logging.ERROR}

_ANSI = {
    "gray": "\033[90m",
    "green": "\033[32m",
    "yellow": "\033[33m",
    "red": "\033[31m",
    "magenta": "\033[35m",
    "blue": "\033[34m",
    "white": "\033[37m",
    "reset": "\033[0m",
}

_STYLE_COLORS = {
    "successColor": "green",
    "warningColor": "yellow",
    "infoColor": "blue",
    "commandColor": "magenta",
    "userColor": "blue",
    "errorColor": "red",
    "highlightColor": "white",
    "accentColor": "magenta",
    "secondaryColor": "gray",
    "primaryColor": "white",
    "dividerColor": "gray",
    "1": "white",
}

_TAGS = {
    logging.INFO: ("[LOG]", "green"),
    logging.WARNING: ("[WARN]", "yellow"),
    logging.ERROR: ("[ERROR]", "red"),
    logging.DEBUG: ("[DEBUG]", "magenta"),
}


def _supports_color() -> bool:
    return bool(getattr(sys.stdout, "isatty", lambda: False)()) and os.getenv("NO_COLOR") is None


def _paint(text: str, color: str) -> str:
    if not _supports_color():
        return text
    return f"{_ANSI[color]}{text}{_ANSI['reset']}"


def _stringify(value: Any) -> str:
    if isinstance(value, BaseException):
        return "".join(__import__("traceback").format_exception(type(value), value, value.__traceback__)).rstrip() or str(value)
    if isinstance(value, (dict, list, tuple, set)):
        return pformat(value, depth=None, sort_dicts=False)
    return str(value)


class _ConsoleFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        now = datetime.now()
        time_str = f"[{now.hour:02d}:{now.minute:02d}:{now.second:02d}]"
        tag, color = _TAGS.get(record.levelno, (f"[{record.levelname}]", "white"))
        source = getattr(record, "source", "[unknown]") or "[unknown]"
        message = record.getMessage()
        if record.exc_info:
            message = f"{message}\n{self.formatException(record.exc_info)}"
        return f"{_paint(time_str, 'gray')} {_paint(tag, color)} {_paint(str(source), 'blue')} {message}"


class _JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created, timezone.utc).isoformat(),
            "level": record.levelname.lower(),
            "message": record.getMessage(),
            "service": "discord-bot",
        }
        if getattr(record, "source", None):
            payload["source"] = record.source
        if record.exc_info:
            payload["stack"] = self.formatException(record.exc_info)
        return json.dumps(payload, ensure_ascii=False, default=str)


class _DailySizeRotateHandler(logging.Handler):
    """Rotate at midnight or 20 MiB, keep five archives, gzip old files."""

    def __init__(self, directory: Path, max_bytes: int = 20 * 1024 * 1024, backup_count: int = 5) -> None:
        super().__init__()
        self.directory = directory
        self.directory.mkdir(parents=True, exist_ok=True)
        self.max_bytes = max_bytes
        self.backup_count = backup_count
        self.current_date = datetime.now().date()
        self.path = self.directory / f"{self.current_date.isoformat()}.log"
        self._lock = threading.RLock()

    def emit(self, record: logging.LogRecord) -> None:
        try:
            text = self.format(record) + "\n"
            with self._lock:
                now = datetime.now()
                if now.date() != self.current_date or (self.path.exists() and self.path.stat().st_size + len(text.encode("utf-8")) > self.max_bytes):
                    self._rotate()
                self.path.open("a", encoding="utf-8").write(text)
        except Exception:
            self.handleError(record)

    def _rotate(self) -> None:
        if self.path.exists() and self.path.stat().st_size:
            stamp = datetime.now().strftime("%Y-%m-%d-%H%M%S")
            archive = self.directory / f"{self.current_date.isoformat()}-{stamp}.log"
            self.path.rename(archive)
            with archive.open("rb") as source, gzip.open(f"{archive}.gz", "wb") as target:
                target.writelines(source)
            archive.unlink(missing_ok=True)
            archives = sorted(self.directory.glob("*.log.gz"), key=lambda p: p.stat().st_mtime, reverse=True)
            for old in archives[self.backup_count:]:
                old.unlink(missing_ok=True)
        self.current_date = datetime.now().date()
        self.path = self.directory / f"{self.current_date.isoformat()}.log"


class Logger:
    def __init__(self, *, file_logging_enabled: bool = False) -> None:
        self.file_logging_enabled = file_logging_enabled
        self.console = Console()
        self._logger = self._create_logger()
        self._install_process_handlers()

    def _create_logger(self) -> logging.Logger:
        logger = logging.getLogger("forgecord")
        logger.setLevel(logging.INFO)
        logger.propagate = False
        for handler in list(logger.handlers):
            logger.removeHandler(handler)
            handler.close()

        log_handler = _DailySizeRotateHandler(ROOT_DIR / "logs")
        log_handler.setFormatter(_JsonFormatter())
        logger.addHandler(log_handler)

        self._exceptions_handler = logging.FileHandler(ROOT_DIR / "logs" / "exceptions.log", encoding="utf-8")
        self._exceptions_handler.setFormatter(_JsonFormatter())
        self._rejections_handler = logging.FileHandler(ROOT_DIR / "logs" / "rejections.log", encoding="utf-8")
        self._rejections_handler.setFormatter(_JsonFormatter())

        if os.getenv("NODE_ENV", "development") != "production":
            console = logging.StreamHandler(sys.stdout)
            console.setFormatter(_ConsoleFormatter())
            logger.addHandler(console)

        if os.getenv("LOGTAIL_ENABLE", "false").lower() == "true":
            self._add_logtail(logger)

        return logger

    @staticmethod
    def _add_logtail(logger: logging.Logger) -> None:
        if LogtailHandler is None:
            print("Failed to initialize Logtail: logtail-python is not installed", file=sys.stderr)
            return
        token = os.getenv("LOGTAIL_SOURCE_TOKEN", "")
        endpoint = os.getenv("LOGTAIL_INGESTION_HOST", "")
        if not token or len(token) <= 1:
            print("Failed to initialize Logtail: Logtail source token is missing", file=sys.stderr)
            return
        if not endpoint or "https://" not in endpoint:
            print("Failed to initialize Logtail: Logtail ingestion host is missing or invalid format (https://)", file=sys.stderr)
            return
        try:
            logger.addHandler(LogtailHandler(source_token=token, host=endpoint))
        except Exception as error:
            print(f"Failed to initialize Logtail: {error}", file=sys.stderr)

    def attachProcessHandlers(self, loop: asyncio.AbstractEventLoop | None = None) -> "Logger":
        """Attach the Python equivalent of JS unhandled rejection handling."""
        target_loop = loop or asyncio.get_event_loop()

        def handle_asyncio_exception(_loop: asyncio.AbstractEventLoop, context: dict[str, Any]) -> None:
            error = context.get("exception")
            message = context.get("message", "")
            if error is not None:
                self._write_exception("Unhandled rejection", error, error.__traceback__, self._rejections_handler)
            else:
                self._logger.error(f"Unhandled rejection: {message}", extra={"source": self.getCallerFile()})
                record = self._logger.makeRecord(self._logger.name, logging.ERROR, self.getCallerFile(), 0, f"Unhandled rejection: {message}", (), None, extra={"source": self.getCallerFile()})
                self._rejections_handler.handle(record)

        target_loop.set_exception_handler(handle_asyncio_exception)
        return self

    def _install_process_handlers(self) -> None:
        previous = sys.excepthook

        def handle_exception(exc_type: type[BaseException], exc_value: BaseException, exc_traceback: Any) -> None:
            if issubclass(exc_type, KeyboardInterrupt):
                previous(exc_type, exc_value, exc_traceback)
                return
            self._write_exception("Uncaught exception", exc_value, exc_traceback, self._exceptions_handler)
            previous(exc_type, exc_value, exc_traceback)

        sys.excepthook = handle_exception

        if hasattr(threading, "excepthook"):
            def thread_exception(args: threading.ExceptHookArgs) -> None:
                self._write_exception("Uncaught thread exception", args.exc_value, args.exc_traceback, self._exceptions_handler)
            threading.excepthook = thread_exception

    def _write_exception(self, message: str, error: BaseException, traceback_obj: Any, handler: logging.Handler) -> None:
        self._logger.error(message, exc_info=(type(error), error, traceback_obj), extra={"source": self.getCallerFile()})
        record = self._logger.makeRecord(self._logger.name, logging.ERROR, self.getCallerFile(), 0, message, (), (type(error), error, traceback_obj), extra={"source": self.getCallerFile()})
        handler.handle(record)

    def getCallerFile(self) -> str:
        try:
            current = Path(__file__).resolve()
            for frame_info in inspect.stack()[2:]:
                filename = Path(frame_info.filename).resolve()
                if filename != current:
                    try:
                        relative = filename.relative_to(ROOT_DIR)
                        return f"[{relative.as_posix()}:{frame_info.lineno}]"
                    except ValueError:
                        return f"[{filename.as_posix()}:{frame_info.lineno}]"
        except Exception:
            pass
        return "[unknown]"

    def formatArgs(self, args: tuple[Any, ...]) -> str:
        return " ".join(_stringify(arg) for arg in args)

    def _write(self, level: str, *args: Any) -> None:
        source = self.getCallerFile()
        self._logger.log(_LEVELS[level], self.formatArgs(args), extra={"source": source})

    def info(self, *args: Any) -> None:
        self._write("info", *args)

    def error(self, *args: Any) -> None:
        self._write("error", *args)

    def warn(self, *args: Any) -> None:
        self._write("warn", *args)

    def debug(self, *args: Any) -> None:
        message = self.formatArgs(args)
        if getattr(self._load_config_options(), "debugMode", False):
            self._write("info", message)
        self._write("debug", message)

    @staticmethod
    def _load_config_options() -> Any:
        try:
            from settings import config
            return type("Options", (), config.options)()
        except Exception:
            return type("Options", (), {"debugMode": os.getenv("NODE_ENV", "development") != "production"})()

    def log(self, *parts: LogPart) -> str:
        # Backward compatibility with the older Python API:
        # logger.log("success", "message") / logger.log("warning", "message").
        if parts and isinstance(parts[0], str) and parts[0] in {"success", "warning", "info", "error"}:
            level = parts[0]
            remainder = parts[1:]
            style = {"success": "successColor", "warning": "warningColor", "info": "infoColor", "error": "errorColor"}[level]
            parts = ((style, str(remainder[0])) if len(remainder) == 1 else (style, self.formatArgs(tuple(remainder))),)  # type: ignore[assignment]

        message_parts: list[str] = []
        for part in parts:
            if isinstance(part, tuple) and len(part) == 2:
                key, text = part
                color = _STYLE_COLORS.get(key, "white")
                message_parts.append(_paint(str(text), color))
            else:
                message_parts.append(str(part))
        message = " ".join(message_parts)
        self.info(message)
        return message

    async def logToFile(self, content: str) -> str | None:
        try:
            ERRORS_DIR.mkdir(parents=True, exist_ok=True)
            file_name = f"{datetime.now(timezone.utc).isoformat().replace(':', '-')}.txt"
            file_path = ERRORS_DIR / file_name
            await asyncio.to_thread(file_path.write_text, content, encoding="utf-8")
            return str(file_path)
        except Exception as error:
            print(f"Logger failed to write error file: {error}", file=sys.stderr)
            return None

    # Python-friendly alias while preserving the Forgecord cross-language API.
    async def log_to_file(self, content: str) -> str | None:
        return await self.logToFile(content)
