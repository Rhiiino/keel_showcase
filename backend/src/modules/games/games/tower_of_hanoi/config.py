# keel_api/src/modules/games/games/tower_of_hanoi/config.py

"""Tower of Hanoi level configuration."""

from __future__ import annotations

MAX_LEVEL = 15
TARGET_PEG_INDEX = 2


def disk_count(level: int) -> int:
    """Return the number of disks for a level (level 1 → 3 disks)."""
    return 2 + level


def is_valid_level(level: int) -> bool:
    return 1 <= level <= MAX_LEVEL
