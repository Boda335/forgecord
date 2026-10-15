from __future__ import annotations

from pathlib import Path
from typing import TYPE_CHECKING, List

from ..Base.baseEvents import EventData
from ..core.BaseLoader import BaseLoader, LoadResult
from ..core.errors import ValidationError
from ..core.paths import EVENTS_DIR

if TYPE_CHECKING:
    from ..Base.baseClient import NexusClient


class EventsLoader(BaseLoader[EventData]):
    def __init__(self, client: "NexusClient"):
        super().__init__(client, name="Events", directory=EVENTS_DIR, table_headings=["File", "Event", "Status"])

    def validate(self, data: EventData, file_path: Path) -> None:
        if not isinstance(data, EventData):
            raise ValidationError(f"{file_path.name}: `data` must be an EventData instance", {"file": str(file_path)})
        if not data.name or not data.name.startswith("on_"):
            raise ValidationError(f'{file_path.name}: event name must be a discord.py event, e.g. "on_ready"', {"file": str(file_path)})
        if not callable(data.execute):
            raise ValidationError(f'Event "{data.name}" is missing an execute() coroutine', {"file": str(file_path)})

    def on_load(self, data: EventData, file_path: Path) -> List[str]:
        fired = {"done": False}

        async def listener(*args, **kwargs) -> None:
            if data.once and fired["done"]:
                return
            fired["done"] = True

            await self.client.errorHandler.safe_execute(
                lambda: data.execute(self.client, *args, **kwargs), kind="event", name=data.name
            )

        self.client.add_listener(listener, data.name)
        self.client.event_listeners.append((data.name, listener))

        return [data.name]

    async def load(self) -> LoadResult:
        # Hot reload: drop every listener we previously attached before re-scanning.
        for name, listener in self.client.event_listeners:
            self.client.remove_listener(listener, name)
        self.client.event_listeners.clear()

        return await super().load()


async def load(client: "NexusClient") -> LoadResult:
    return await EventsLoader(client).load()
