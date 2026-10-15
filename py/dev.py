from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def main() -> int:
    env = os.environ.copy()
    env.setdefault('DASHBOARD_ENABLED', 'true')
    processes = [
        subprocess.Popen([sys.executable, 'bot.py'], cwd=ROOT, env=env),
        subprocess.Popen(['npm', '--prefix', 'dashboard', 'run', 'dev'], cwd=ROOT, env=env),
    ]
    try:
        return processes[0].wait()
    except KeyboardInterrupt:
        return 130
    finally:
        for process in processes:
            if process.poll() is None:
                process.terminate()
        for process in processes:
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()

if __name__ == '__main__':
    raise SystemExit(main())
