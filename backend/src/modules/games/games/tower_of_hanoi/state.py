# keel_api/src/modules/games/games/tower_of_hanoi/state.py

"""Tower of Hanoi initial state and win validation."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from modules.games.games.tower_of_hanoi import config

STATE_VERSION = 1


def build_initial_state(level: int) -> dict[str, Any]:
    """Build the starting peg layout for a level."""
    count = config.disk_count(level)
    disks = list(range(1, count + 1))
    return {
        "version": STATE_VERSION,
        "pegs": [disks, [], []],
        "timerStartedAt": "",
        "elapsedMs": 0,
    }


def parse_pegs(raw: object) -> list[list[int]] | None:
    if not isinstance(raw, list) or len(raw) != 3:
        return None
    pegs: list[list[int]] = []
    for peg in raw:
        if not isinstance(peg, list):
            return None
        parsed: list[int] = []
        for disk in peg:
            if not isinstance(disk, int) or disk < 1:
                return None
            parsed.append(disk)
        pegs.append(parsed)
    return pegs


def is_winning_state(state: dict[str, Any], *, level: int) -> bool:
    pegs = parse_pegs(state.get("pegs"))
    if pegs is None:
        return False
    expected_count = config.disk_count(level)
    target = pegs[config.TARGET_PEG_INDEX]
    if len(target) != expected_count:
        return False
    return target == list(range(1, expected_count + 1))


def compute_duration_ms(state: dict[str, Any], *, completed_at: datetime) -> int:
    elapsed = state.get("elapsedMs")
    started_raw = state.get("timerStartedAt")
    base_elapsed = int(elapsed) if isinstance(elapsed, int) and elapsed >= 0 else 0

    if isinstance(started_raw, str):
        try:
            started_at = datetime.fromisoformat(started_raw.replace("Z", "+00:00"))
            if started_at.tzinfo is None:
                started_at = started_at.replace(tzinfo=UTC)
            running_ms = int((completed_at - started_at.astimezone(UTC)).total_seconds() * 1000)
            return max(0, base_elapsed + running_ms)
        except ValueError:
            pass

    return base_elapsed
