# keel_showcase/backend/scripts/db/demo/seeds/contacts.py

from __future__ import annotations

from datetime import date

import asyncpg

from core import tables

from context import DemoContext, demo_note, fetch_or_insert, upsert_tag


async def seed_contacts(conn: asyncpg.Connection, ctx: DemoContext) -> None:
    specs: tuple[tuple[str, str, str, str | None, date | None, bool], ...] = (
        ("alex", "Alex", "Rivera", "male", date(1990, 3, 15), True),
        ("morgan", "Morgan", "Rivera", "female", date(1992, 7, 22), False),
        ("jamie", "Jamie", "Rivera", None, date(2015, 11, 8), False),
        ("riley", "Riley", "Rivera", None, date(2018, 4, 30), False),
        ("pat", "Pat", "Rivera", None, date(1962, 1, 10), False),
        ("sam", "Sam", "Rivera", None, date(1964, 9, 3), False),
        ("casey", "Casey", "Patel", None, date(1991, 6, 18), False),
        ("dana", "Dana", "Chen", None, date(1988, 12, 5), False),
    )
    for key, first_name, last_name, gender, birth_date, is_self in specs:
        notes = demo_note(key)
        contact_id = await fetch_or_insert(
            conn,
            ctx,
            table_key=tables.CONTACTS,
            select_sql=f"""
                SELECT id FROM {tables.CONTACTS}
                WHERE user_id = $1 AND notes = $2
                ORDER BY id LIMIT 1
            """,
            select_args=(ctx.user_id, notes),
            insert_sql=f"""
                INSERT INTO {tables.CONTACTS}
                    (user_id, first_name, last_name, gender, birth_date, notes, is_self)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            """,
            insert_args=(ctx.user_id, first_name, last_name, gender, birth_date, notes, is_self),
        )
        ctx.contacts[key] = contact_id

    await conn.execute(
        f"""
        UPDATE {tables.USERS}
        SET contact_id = $2, updated_at = NOW()
        WHERE id = $1 AND (contact_id IS NULL OR contact_id = $2)
        """,
        ctx.user_id,
        ctx.contacts["alex"],
    )

    for from_key, to_key, rel_type in (
        ("alex", "morgan", "spouse"),
        ("morgan", "alex", "spouse"),
        ("pat", "sam", "spouse"),
        ("sam", "pat", "spouse"),
        ("alex", "jamie", "parent"),
        ("morgan", "jamie", "parent"),
        ("alex", "riley", "parent"),
        ("morgan", "riley", "parent"),
        ("pat", "alex", "parent"),
        ("sam", "alex", "parent"),
        ("alex", "casey", "friend"),
        ("alex", "dana", "friend"),
    ):
        await conn.execute(
            f"""
            INSERT INTO {tables.CONTACT_RELATIONSHIPS}
                (user_id, from_contact_id, to_contact_id, relationship_type)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (from_contact_id, to_contact_id, relationship_type) DO NOTHING
            """,
            ctx.user_id,
            ctx.contacts[from_key],
            ctx.contacts[to_key],
            rel_type,
        )

    family_tag = await upsert_tag(
        conn, ctx, table=tables.CONTACT_TAGS, user_id=ctx.user_id, name="Family", color="#8B5CF6"
    )
    friends_tag = await upsert_tag(
        conn, ctx, table=tables.CONTACT_TAGS, user_id=ctx.user_id, name="Friends", color="#06B6D4"
    )
    work_tag = await upsert_tag(
        conn, ctx, table=tables.CONTACT_TAGS, user_id=ctx.user_id, name="Work", color="#F97316"
    )
    tag_assignments = (
        (("alex", "morgan", "jamie", "riley", "pat", "sam"), family_tag),
        (("casey",), friends_tag),
        (("dana",), work_tag),
    )
    for keys, tag_id in tag_assignments:
        for key in keys:
            await conn.execute(
                f"""
                INSERT INTO {tables.CONTACT_TAG_ASSIGNMENTS} (contact_id, tag_id)
                VALUES ($1, $2)
                ON CONFLICT (contact_id, tag_id) DO NOTHING
                """,
                ctx.contacts[key],
                tag_id,
            )
