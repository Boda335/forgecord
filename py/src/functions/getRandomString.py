from __future__ import annotations

import random
import string


def get_random_string(length: int) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


data = get_random_string
