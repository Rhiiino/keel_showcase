# keel_api/src/modules/focus/test_time_entries.py

"""Unit tests for focus node timer persistence helpers."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from pathlib import Path

from modules.focus.schemas import FocusNodeTimeEntryPublic
from modules.focus.service.time_entries import compute_elapsed_seconds


def _entry(
    *,
    status: str,
    started_at: datetime,
    last_paused_at: datetime | None = None,
    accumulated_paused_seconds: int = 0,
    duration_seconds: int | None = None,
) -> FocusNodeTimeEntryPublic:
    return FocusNodeTimeEntryPublic(
        id=1,
        user_id=10,
        node_id=20,
        status=status,
        started_at=started_at,
        last_paused_at=last_paused_at,
        ended_at=None,
        accumulated_paused_seconds=accumulated_paused_seconds,
        duration_seconds=duration_seconds,
        created_at=started_at,
        updated_at=started_at,
    )


def test_running_timer_counts_active_seconds() -> None:
    entry = _entry(
        status="running",
        started_at=datetime.now(timezone.utc) - timedelta(seconds=65),
        accumulated_paused_seconds=5,
    )

    elapsed = compute_elapsed_seconds(entry)

    assert 60 <= elapsed <= 70


def test_paused_timer_freezes_at_pause_time() -> None:
    started_at = datetime(2026, 6, 19, 10, 0, tzinfo=timezone.utc)
    entry = _entry(
        status="paused",
        started_at=started_at,
        last_paused_at=started_at + timedelta(seconds=125),
        accumulated_paused_seconds=20,
    )

    assert compute_elapsed_seconds(entry) == 105


def test_ended_timer_uses_stored_duration() -> None:
    entry = _entry(
        status="ended",
        started_at=datetime(2026, 6, 19, 10, 0, tzinfo=timezone.utc),
        duration_seconds=240,
    )

    assert compute_elapsed_seconds(entry) == 240


def test_schema_enforces_timer_lifecycle_guards() -> None:
    schema_path = (
        Path(__file__).parents[3]
        / "scripts/db/init/001_schema.sql"
    )
    schema = schema_path.read_text()

    assert "focus_node_time_entries_node_user_fkey" in schema
    assert "FOREIGN KEY (node_id, user_id)" in schema
    assert "status IN ('running', 'paused', 'ended')" in schema
    assert "idx_focus_node_time_entries_one_open_per_node" in schema
    assert "WHERE status IN ('running', 'paused')" in schema


if __name__ == "__main__":
    test_running_timer_counts_active_seconds()
    test_paused_timer_freezes_at_pause_time()
    test_ended_timer_uses_stored_duration()
    test_schema_enforces_timer_lifecycle_guards()
    print("focus time entry tests passed")
