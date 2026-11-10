"""Compute-environment helpers shared by the training engines."""
import os
import sys
from typing import Optional

WORKERS_ENV = "VF_DATALOADER_WORKERS"


def dataloader_workers(env_value: Optional[str] = None, platform: Optional[str] = None,
                       cpu_count: Optional[int] = None) -> int:
    """
    How many DataLoader worker processes to use.

    - ``VF_DATALOADER_WORKERS`` (an int >= 0) always wins.
    - Windows: 0. Workers are started with *spawn*, so every worker re-imports torch and maps its
      CUDA DLLs (~1-2 GB of commit each). With Ultralytics' default of 8 that exhausts the page
      file ("WinError 1455 分頁檔太小") and training dies with "DataLoader worker exited
      unexpectedly". Loading in the main process is slower per epoch but always works.
    - Linux / Jetson: workers are forked (cheap), so up to 4, bounded by the CPU count.
    """
    raw = os.environ.get(WORKERS_ENV) if env_value is None else env_value
    if raw is not None and raw.strip() != "":
        try:
            return max(0, int(raw))
        except ValueError:
            pass
    plat = sys.platform if platform is None else platform
    if plat.startswith("win"):
        return 0
    cpus = (os.cpu_count() or 1) if cpu_count is None else cpu_count
    return max(0, min(4, cpus - 1))
