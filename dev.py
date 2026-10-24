"""Run the Jobnex API and frontend under one VS Code task."""
from __future__ import annotations

import signal
import subprocess
import sys
import time
from pathlib import Path
from threading import Event
from urllib.error import URLError
from urllib.request import urlopen


ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"
BACKEND_URL = "http://127.0.0.1:8000/api/health"
FRONTEND_URL = "http://127.0.0.1:3000/login.html"
shutdown = Event()
children: list[tuple[str, subprocess.Popen]] = []


def is_ready(url: str) -> bool:
    try:
        with urlopen(url, timeout=2) as response:
            return response.status == 200
    except (OSError, URLError):
        return False


def ensure_service(label: str, url: str, command: list[str], cwd: Path) -> None:
    if is_ready(url):
        print(f"{label} already running: {url}", flush=True)
        return

    process = subprocess.Popen(
        command,
        cwd=cwd,
        creationflags=getattr(subprocess, "CREATE_NEW_PROCESS_GROUP", 0),
    )
    children.append((label, process))
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError(f"{label} exited with code {process.returncode}")
        if is_ready(url):
            print(f"{label} started: {url}", flush=True)
            return
        shutdown.wait(0.25)
    raise RuntimeError(f"Timed out waiting for {label} at {url}")


def stop_children() -> None:
    for _, process in reversed(children):
        if process.poll() is None:
            process.terminate()
    for _, process in reversed(children):
        if process.poll() is None:
            process.wait(timeout=5)


def main() -> None:
    signal.signal(signal.SIGINT, lambda *_: shutdown.set())
    signal.signal(signal.SIGTERM, lambda *_: shutdown.set())

    backend_python = BACKEND / "job" / "Scripts" / "python.exe"
    if not backend_python.exists():
        backend_python = Path(sys.executable)

    try:
        ensure_service(
            "Backend",
            BACKEND_URL,
            [str(backend_python), "-m", "uvicorn", "main:app", "--reload", "--host", "127.0.0.1", "--port", "8000"],
            BACKEND,
        )
        ensure_service(
            "Frontend",
            FRONTEND_URL,
            [sys.executable, "-m", "http.server", "3000", "--bind", "127.0.0.1", "--directory", str(FRONTEND)],
            ROOT,
        )
        print("Jobnex is ready at http://localhost:3000/login.html", flush=True)
        print("Press Ctrl+C to stop services started by this task.", flush=True)
        while not shutdown.wait(1):
            for label, process in children:
                if process.poll() is not None:
                    raise RuntimeError(f"{label} exited with code {process.returncode}")
    finally:
        stop_children()


if __name__ == "__main__":
    try:
        main()
    except (OSError, RuntimeError, subprocess.TimeoutExpired) as error:
        print(f"Jobnex launcher error: {error}", file=sys.stderr, flush=True)
        sys.exit(1)