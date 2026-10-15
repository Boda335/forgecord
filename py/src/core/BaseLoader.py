"""Shared behaviour for every loader in the framework (commands, events,
components, functions). Concrete loaders only implement `validate()` and
`on_load()` — everything else (recursive scan, isolated per-file import,
hot-reload bookkeeping, table/summary printing) lives here once.

Note on "parallel": CPython's import machinery is synchronous and the GIL
means importing files doesn't get real multi-core parallelism the way the
JS/TS `Promise.allSettled` version does. What `asyncio.gather` below buys us
here is the same *isolation* guarantee (one bad file never aborts the
batch) plus keeping the event loop free for Discord's heartbeat while a
large command tree loads — not wall-clock speedup. That's stated plainly so
this doesn't overclaim vs. the JS/TS loaders.
"""
from __future__ import annotations

import asyncio
from pathlib import Path
from typing import TYPE_CHECKING, Any, Generic, List, Optional, TypeVar

from rich import box
from rich.table import Table

from .errors import LoaderError, ValidationError
from .PluginManager import import_module_from_path

if TYPE_CHECKING:
    from ..Base.baseClient import NexusClient

T = TypeVar("T")


class LoadResult:
    def __init__(self) -> None:
        self.loaded = 0
        self.failed = 0
        self.results: List[dict[str, Any]] = []


class BaseLoader(Generic[T]):
    def __init__(self, client: "NexusClient", *, name: str, directory: Path, table_headings: Optional[List[str]] = None):
        self.client = client
        self.name = name
        self.dir = directory
        self.table_headings = table_headings or ["File", "Status"]

    def validate(self, data: T, file_path: Path) -> None:
        raise NotImplementedError

    def on_load(self, data: T, file_path: Path) -> List[str]:
        raise NotImplementedError

    def should_include(self, file_path: Path) -> bool:
        return file_path.suffix == ".py" and not file_path.name.startswith("_")

    def _walk(self) -> List[Path]:
        if not self.dir.exists():
            return []
        return sorted(p for p in self.dir.rglob("*.py") if self.should_include(p))

    async def _load_one(self, file_path: Path) -> dict[str, Any]:
        module = await asyncio.to_thread(import_module_from_path, file_path)
        data: Optional[T] = getattr(module, "data", None)
        if data is None:
            raise ValidationError(f'{file_path.name} has no top-level "data" export', {"file": str(file_path)})

        self.validate(data, file_path)

        was_loaded = str(file_path) in self.client.statuses
        self.client.statuses.add(str(file_path))
        row = self.on_load(data, file_path) or []
        return {"file_path": file_path, "status": "Reloaded" if was_loaded else "Loaded", "row": row}

    async def load(self) -> LoadResult:
        files = await asyncio.to_thread(self._walk)
        table = Table(title=self.name, box=box.DOUBLE_EDGE, show_lines=False)
        for heading in self.table_headings:
            table.add_column(heading)

        outcomes = await asyncio.gather(*(self._load_one(f) for f in files), return_exceptions=True)

        result = LoadResult()
        for file_path, outcome in zip(files, outcomes):
            if isinstance(outcome, Exception):
                result.failed += 1
                is_known = isinstance(outcome, (ValidationError, LoaderError))
                table.add_row(file_path.name, *(["❌"] * (len(self.table_headings) - 1)))
                detail = str(outcome) if is_known else repr(outcome)
                self.client.logger.error(f"Failed to load {file_path}: {detail}")
            else:
                result.loaded += 1
                table.add_row(file_path.name, *outcome["row"], outcome["status"])
                result.results.append(outcome)

        self.client.logger.console.print(table)
        summary = "Loaded" if result.failed == 0 else f"Loaded ({result.failed} failed)"
        (self.client.logger.info if result.loaded else self.client.logger.warn)(f"{result.loaded} {self.name} {summary}")
        await self.client.hooks.emit("loaderComplete", {"name": self.name, "loaded": result.loaded, "failed": result.failed})

        return result
