from __future__ import annotations

from rich.console import Console
from rich.panel import Panel
from rich.text import Text

_ASCII = r"""
 ______ ____  _____   _____ ______ _____ ____  _____  _____  
|  ____/ __ \|  __ \ / ____|  ____/ ____/ __ \|  __ \|  __ \ 
| |__ | |  | | |__) | |  __| |__ | |   | |  | | |__) | |  | |
|  __|| |  | |  _  /| | |_ |  __|| |   | |  | |  _  /| |  | |
| |   | |__| | | \ \| |__| | |___| |___| |__| | | \ \| |__| |
|_|    \____/|_|  \_\\_____|______\_____\____/|_|  \_\_____/ 
                                                             
                                                             
"""


def show() -> None:
    console = Console()
    body = Text(_ASCII, style="bold cyan")
    body.append("\nForgecord v1.0.0 (Python) | The Ultimate Discord Bot toolkit!", style="bold white")
    console.print(Panel(body, border_style="green", padding=(1, 2)))
