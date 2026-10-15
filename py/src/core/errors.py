"""Custom exceptions used across Forgecord.

Having a common base (ForgecordError) lets ErrorHandler tell "expected /
handled" framework errors apart from truly unexpected bugs when deciding
how much detail to log.
"""
from __future__ import annotations

from typing import Any, Optional


class ForgecordError(Exception):
    def __init__(self, message: str, *, code: str = "FORGECORD_ERROR", context: Optional[dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.context = context or {}

    def __str__(self) -> str:
        return self.message


class ValidationError(ForgecordError):
    """A command/event/component file failed schema validation while loading."""

    def __init__(self, message: str, context: Optional[dict[str, Any]] = None):
        super().__init__(message, code="VALIDATION_ERROR", context=context)


class LoaderError(ForgecordError):
    """Unrecoverable failure inside a loader (bad directory, etc.)."""

    def __init__(self, message: str, context: Optional[dict[str, Any]] = None):
        super().__init__(message, code="LOADER_ERROR", context=context)


class PermissionError_(ForgecordError):
    """A user or the bot itself is missing required permissions.

    Named PermissionError_ to avoid shadowing Python's built-in PermissionError.
    """

    def __init__(self, message: str, context: Optional[dict[str, Any]] = None):
        super().__init__(message, code="PERMISSION_ERROR", context=context)


class PluginError(ForgecordError):
    """A plugin misbehaved (bad shape, threw during on_load, duplicate name, ...)."""

    def __init__(self, message: str, context: Optional[dict[str, Any]] = None):
        super().__init__(message, code="PLUGIN_ERROR", context=context)


class ConfigError(ForgecordError):
    """Required .env / settings values are missing or left as placeholders."""

    def __init__(self, message: str, context: Optional[dict[str, Any]] = None):
        super().__init__(message, code="CONFIG_ERROR", context=context)
