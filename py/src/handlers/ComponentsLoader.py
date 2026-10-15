from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, List

from ..Base.baseComponent import ComponentData
from ..core.BaseLoader import BaseLoader, LoadResult
from ..core.errors import ValidationError
from ..core.paths import COMPONENTS_DIR

if TYPE_CHECKING:
    from ..Base.baseClient import NexusClient


class ComponentsLoader(BaseLoader[ComponentData]):
    def __init__(self, client: "NexusClient"):
        super().__init__(client, name="Interaction Handlers", directory=COMPONENTS_DIR, table_headings=["File", "Status"])

    def validate(self, data: ComponentData, file_path: Path) -> None:
        if not isinstance(data, ComponentData):
            raise ValidationError(f"{file_path.name}: `data` must be a ComponentData instance", {"file": str(file_path)})
        if not data.name:
            raise ValidationError(f"{file_path.name}: component is missing a name", {"file": str(file_path)})
        if not callable(data.action):
            raise ValidationError(f'Component "{data.name}" is missing an action() coroutine', {"file": str(file_path)})

    def on_load(self, data: ComponentData, file_path: Path) -> List[str]:
        self.client.components_action[data.name] = data
        return []


async def load(client: "NexusClient") -> LoadResult:
    client.components_action.clear()
    return await ComponentsLoader(client).load()
