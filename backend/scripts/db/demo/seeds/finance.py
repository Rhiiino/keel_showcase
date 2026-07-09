# keel_showcase/backend/scripts/db/demo/seeds/finance.py

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from decimal import Decimal

import asyncpg

from core import tables

from context import DemoContext, fetch_or_insert, upsert_tag


async def _seed_vendor(
    conn: asyncpg.Connection,
    ctx: DemoContext,
    key: str,
    name: str,
    url: str,
    notes: str,
) -> int:
    row = await conn.fetchrow(
        f"""
        INSERT INTO {tables.FINANCE_VENDORS}
            (user_id, name, website_url, notes, default_currency)
        VALUES ($1, $2, $3, $4, 'USD')
        ON CONFLICT (user_id, name) DO UPDATE
        SET website_url = EXCLUDED.website_url,
            notes = EXCLUDED.notes,
            updated_at = NOW()
        RETURNING id, (xmax = 0) AS inserted
        """,
        ctx.user_id,
        name,
        url,
        notes,
    )
    if row["inserted"]:
        ctx.stats.inserted_one(tables.FINANCE_VENDORS)
    else:
        ctx.stats.reused_one(tables.FINANCE_VENDORS)
    ctx.vendors[key] = int(row["id"])
    return ctx.vendors[key]


async def seed_finance(conn: asyncpg.Connection, ctx: DemoContext) -> None:
    vendor_specs = (
        ("studio", "Demo Audio Supply", "https://example.com/audio", "Demo vendor for studio gear."),
        ("desk", "Demo Desk Goods", "https://example.com/desk", "Demo vendor for desk accessories."),
        ("streamflix", "StreamFlix", "https://example.com/streamflix", "Demo streaming subscription vendor."),
        ("cloudhost", "CloudHost Pro", "https://example.com/cloudhost", "Demo cloud hosting vendor."),
        ("cafe", "Bean & Byte", "https://example.com/cafe", "Demo local café vendor."),
    )
    for key, name, url, notes in vendor_specs:
        await _seed_vendor(conn, ctx, key, name, url, notes)

    payment_specs = (
        ("chase", "Chase Visa", "credit_card", "Chase", "4242", 0),
        ("amex", "Amex Gold", "credit_card", "American Express", "1005", 1),
        ("checking", "Primary Checking", "checking", "Chase", "7890", 2),
    )
    for key, label, kind, institution, last_four, sort_order in payment_specs:
        method_id = await fetch_or_insert(
            conn,
            ctx,
            table_key=tables.FINANCE_PAYMENT_METHODS,
            select_sql=f"""
                SELECT id FROM {tables.FINANCE_PAYMENT_METHODS}
                WHERE user_id = $1 AND label = $2
                ORDER BY id LIMIT 1
            """,
            select_args=(ctx.user_id, label),
            insert_sql=f"""
                INSERT INTO {tables.FINANCE_PAYMENT_METHODS}
                    (user_id, kind, label, institution_name, last_four, sort_order, notes)
                VALUES ($1, $2, $3, $4, $5, $6, 'Demo payment method.')
                RETURNING id
            """,
            insert_args=(ctx.user_id, kind, label, institution, last_four, sort_order),
        )
        ctx.payment_methods[key] = method_id

    now = datetime.now(timezone.utc)
    obligation_specs = (
        (
            "streamflix",
            "StreamFlix Standard",
            "streamflix",
            "chase",
            "subscription",
            "active",
            Decimal("15.99"),
            now + timedelta(days=6),
        ),
        (
            "cloudhost",
            "CloudHost Pro",
            "cloudhost",
            "amex",
            "subscription",
            "active",
            Decimal("29.00"),
            now + timedelta(days=11),
        ),
        (
            "gym",
            "Gym Membership",
            "cafe",
            "checking",
            "membership",
            "active",
            Decimal("49.00"),
            now + timedelta(days=18),
        ),
        (
            "news",
            "News Digest",
            "desk",
            "chase",
            "subscription",
            "trial",
            Decimal("8.00"),
            now + timedelta(days=14),
        ),
    )
    for key, name, vendor_key, payment_key, kind, status, amount, next_billing in obligation_specs:
        obligation_id = await fetch_or_insert(
            conn,
            ctx,
            table_key=tables.FINANCE_OBLIGATIONS,
            select_sql=f"""
                SELECT id FROM {tables.FINANCE_OBLIGATIONS}
                WHERE user_id = $1 AND name = $2
                ORDER BY id LIMIT 1
            """,
            select_args=(ctx.user_id, name),
            insert_sql=f"""
                INSERT INTO {tables.FINANCE_OBLIGATIONS}
                    (
                        user_id, vendor_id, payment_method_id, name, kind, status,
                        amount, currency, billing_interval, next_billing_at, notes, sort_order
                    )
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'USD', 'monthly', $8, 'Demo subscription.', 0)
                RETURNING id
            """,
            insert_args=(
                ctx.user_id,
                ctx.vendors[vendor_key],
                ctx.payment_methods[payment_key],
                name,
                kind,
                status,
                amount,
                next_billing,
            ),
        )
        ctx.obligations[key] = obligation_id

    transaction_specs = (
        ("mic", "Demo: USB Microphone", "studio", "physical", "considering", 0, Decimal("89.00")),
        ("lamp", "Demo: Desk Lamp", "desk", "physical", "ordered", 1, Decimal("42.50")),
        ("chair", "Demo: Reading Chair", "desk", "physical", "in_transit", 2, Decimal("240.00")),
        ("cafe", "Demo: Team Coffee Run", "cafe", "expense", "received", 3, Decimal("18.75")),
        ("hosting", "Demo: Extra Storage", "cloudhost", "service", "received", 4, Decimal("12.00")),
    )
    for key, title, vendor_key, kind, status, sort_order, price in transaction_specs:
        item_id = await fetch_or_insert(
            conn,
            ctx,
            table_key=tables.FINANCE_TRANSACTIONS,
            select_sql=f"""
                SELECT id FROM {tables.FINANCE_TRANSACTIONS}
                WHERE user_id = $1 AND title = $2
                ORDER BY id LIMIT 1
            """,
            select_args=(ctx.user_id, title),
            insert_sql=f"""
                INSERT INTO {tables.FINANCE_TRANSACTIONS}
                    (
                        user_id, vendor_id, title, kind, status, sort_order,
                        listing_url, notes, price_amount, currency
                    )
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'Demo purchase.', $8, 'USD')
                RETURNING id
            """,
            insert_args=(
                ctx.user_id,
                ctx.vendors[vendor_key],
                title,
                kind,
                status,
                sort_order,
                f"https://example.com/demo/{key}",
                price,
            ),
        )
        ctx.finance_transactions[key] = item_id

    wishlist_tag = await upsert_tag(
        conn,
        ctx,
        table=tables.FINANCE_TRANSACTION_TAGS,
        user_id=ctx.user_id,
        name="Wishlist",
        color="#8B5CF6",
    )
    office_tag = await upsert_tag(
        conn,
        ctx,
        table=tables.FINANCE_TRANSACTION_TAGS,
        user_id=ctx.user_id,
        name="Home Office",
        color="#06B6D4",
    )
    essential_tag = await upsert_tag(
        conn,
        ctx,
        table=tables.FINANCE_OBLIGATION_TAGS,
        user_id=ctx.user_id,
        name="Essential",
        color="#10B981",
    )
    entertainment_tag = await upsert_tag(
        conn,
        ctx,
        table=tables.FINANCE_OBLIGATION_TAGS,
        user_id=ctx.user_id,
        name="Entertainment",
        color="#F97316",
    )

    for txn_key, tag_id in (("mic", wishlist_tag), ("lamp", office_tag), ("chair", office_tag)):
        await conn.execute(
            f"""
            INSERT INTO {tables.FINANCE_TRANSACTION_TAG_ASSIGNMENTS} (transaction_id, tag_id)
            VALUES ($1, $2)
            ON CONFLICT (transaction_id, tag_id) DO NOTHING
            """,
            ctx.finance_transactions[txn_key],
            tag_id,
        )
    for obl_key, tag_id in (
        ("streamflix", entertainment_tag),
        ("cloudhost", essential_tag),
        ("gym", essential_tag),
        ("news", entertainment_tag),
    ):
        await conn.execute(
            f"""
            INSERT INTO {tables.FINANCE_OBLIGATION_TAG_ASSIGNMENTS} (obligation_id, tag_id)
            VALUES ($1, $2)
            ON CONFLICT (obligation_id, tag_id) DO NOTHING
            """,
            ctx.obligations[obl_key],
            tag_id,
        )
