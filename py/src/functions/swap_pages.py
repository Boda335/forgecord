from __future__ import annotations

from typing import Any


def swap_pages(pages: list[Any], index: int, step: int = 1) -> Any:
    """Return the page reached by moving `step` positions with wrap-around."""
    if not pages:
        return None
    return pages[(index + step) % len(pages)]
