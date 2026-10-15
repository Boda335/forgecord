from __future__ import annotations


def format_bytes(num_bytes: float) -> str:
    units = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    n = float(num_bytes)
    level = 0
    while n >= 1024 and level < len(units) - 1:
        n /= 1024
        level += 1
    return f"{n:.1f} {units[level]}" if level > 0 and n < 10 else f"{n:.0f} {units[level]}"


data = format_bytes
