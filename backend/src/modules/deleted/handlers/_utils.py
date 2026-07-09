# keel_api/src/modules/deleted/handlers/_utils.py
"""Shared SQL helpers for trash capture and restore."""

from __future__ import annotations

import json
from datetime import date, datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

import asyncpg
from asyncpg.exceptions import UniqueViolationError

from core.errors import AppError


def record_to_dict(row: asyncpg.Record) -> dict[str, Any]:
    return {key: _serialize_value(row[key]) for key in row.keys()}


def _serialize_value(value: Any) -> Any:
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, dict):
        return {k: _serialize_value(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_serialize_value(v) for v in value]
    return value


def _deserialize_value(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, dict):
        return {k: _deserialize_value(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_deserialize_value(v) for v in value]
    return value


async def fetch_row(
    conn: asyncpg.Connection,
    table: str,
    *,
    where_sql: str,
    params: tuple[Any, ...],
) -> asyncpg.Record | None:
    return await conn.fetchrow(
        f"SELECT * FROM {table} WHERE {where_sql}",
        *params,
    )


async def fetch_rows(
    conn: asyncpg.Connection,
    table: str,
    *,
    where_sql: str,
    params: tuple[Any, ...],
    order_by: str | None = None,
) -> list[asyncpg.Record]:
    query = f"SELECT * FROM {table} WHERE {where_sql}"
    if order_by:
        query += f" ORDER BY {order_by}"
    return await conn.fetch(query, *params)


def build_label(row: asyncpg.Record | None, *fields: str, fallback: str) -> str:
    if row is None:
        return fallback
    parts = [str(row[field]).strip() for field in fields if row.get(field)]
    label = " ".join(part for part in parts if part)
    return label or fallback


async def restore_table_rows(
    conn: asyncpg.Connection,
    table: str,
    rows: list[dict[str, Any]],
    *,
    pk: str = "id",
) -> None:
    if not rows:
        return
    for row in rows:
        await _insert_row_overriding_pk(conn, table, row, pk=pk)
    if pk == "id" and rows and isinstance(rows[0].get("id"), int):
        await _sync_serial_sequence(conn, table, pk)


async def _insert_row_overriding_pk(
    conn: asyncpg.Connection,
    table: str,
    row: dict[str, Any],
    *,
    pk: str,
) -> None:
    columns = list(row.keys())
    placeholders: list[str] = []
    values: list[Any] = []
    for index, column in enumerate(columns, start=1):
        placeholders.append(f"${index}")
        values.append(_prepare_db_value(row[column]))
    column_sql = ", ".join(columns)
    placeholder_sql = ", ".join(placeholders)
    try:
        await conn.execute(
            f"""
            INSERT INTO {table} ({column_sql})
            OVERRIDING SYSTEM VALUE
            VALUES ({placeholder_sql})
            """,
            *values,
        )
    except UniqueViolationError as exc:
        raise AppError(
            f"Cannot restore {table}: a row with the same {pk} already exists.",
            status_code=409,
        ) from exc


def _maybe_parse_temporal(value: str) -> datetime | date | None:
    if len(value) < 10 or value[4] != "-" or value[7] != "-":
        return None
    try:
        if "T" in value:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        return date.fromisoformat(value)
    except ValueError:
        return None


def _prepare_db_value(value: Any) -> Any:
    value = _deserialize_value(value)
    if isinstance(value, str):
        parsed = _maybe_parse_temporal(value)
        if parsed is not None:
            return parsed
    if isinstance(value, dict):
        return json.dumps(value)
    if isinstance(value, list) and value and isinstance(value[0], dict):
        return json.dumps(value)
    return value


async def _sync_serial_sequence(
    conn: asyncpg.Connection,
    table: str,
    pk: str,
) -> None:
    await conn.execute(
        f"""
        SELECT setval(
            pg_get_serial_sequence('{table}', '{pk}'),
            COALESCE((SELECT MAX({pk}) FROM {table}), 1)
        )
        """
    )


async def delete_rows(
    conn: asyncpg.Connection,
    table: str,
    *,
    where_sql: str,
    params: tuple[Any, ...],
) -> None:
    await conn.execute(
        f"DELETE FROM {table} WHERE {where_sql}",
        *params,
    )
