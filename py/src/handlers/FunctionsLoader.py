from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, Any, Callable, List

from ..core.BaseLoader import BaseLoader, LoadResult
from ..core.errors import ValidationError
from ..core.paths import FUNCTIONS_DIR

if TYPE_CHECKING:
    from ..Base.baseClient import NexusClient


class FunctionsLoader(BaseLoader[Callable[..., Any]]):
    def __init__(self, client: "NexusClient"):
        super().__init__(client, name="Functions", directory=FUNCTIONS_DIR, table_headings=["Function File", "Status"])

    def validate(self, data: Callable[..., Any], file_path: Path) -> None:
        if not callable(data):
            raise ValidationError(f"{file_path.name}: `data` must export a callable", {"file": str(file_path)})

    def on_load(self, data: Callable[..., Any], file_path: Path) -> List[str]:
        self.client.functions[file_path.stem] = data
        return []


async def load(client: "NexusClient") -> LoadResult:
    return await FunctionsLoader(client).load()
