# keel_api/src/modules/deleted/handlers/finance.py
"""Trash handlers for finance module entities."""

from __future__ import annotations

from core.errors import AppError
from core.tables import (
    FINANCE_OBLIGATION_TAG_ASSIGNMENTS,
    FINANCE_OBLIGATION_TAGS,
    FINANCE_OBLIGATIONS,
    FINANCE_PAYMENT_METHODS,
    FINANCE_TRANSACTION_TAG_ASSIGNMENTS,
    FINANCE_TRANSACTION_TAGS,
    FINANCE_TRANSACTIONS,
    FINANCE_VENDORS,
    MEDIA_ATTACHMENTS,
)
from modules.deleted import entity_types
from modules.deleted.handlers._protocol import CaptureResult, DeletedEntityHandler
from modules.deleted.handlers._utils import (
    build_label,
    delete_rows,
    fetch_rows,
    record_to_dict,
    restore_table_rows,
)
from modules.finance import (
    obligation_repository,
    obligation_tag_repository,
    payment_method_repository,
    transaction_repository,
    transaction_tag_repository,
    vendor_repository,
)


class FinanceTransactionHandler:
    entity_type = entity_types.FINANCE_TRANSACTION

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        transaction_id = int(entity_id)
        row = await transaction_repository.get_transaction(conn, transaction_id)
        if row is None or row["user_id"] != user_id:
            raise AppError("Transaction not found.", status_code=404)
        tag_assignments = await fetch_rows(
            conn,
            FINANCE_TRANSACTION_TAG_ASSIGNMENTS,
            where_sql="transaction_id = $1",
            params=(transaction_id,),
        )
        attachments = await fetch_rows(
            conn,
            MEDIA_ATTACHMENTS,
            where_sql="entity_type = 'finance_transaction' AND entity_id = $1",
            params=(transaction_id,),
        )
        return CaptureResult(
            display_label=build_label(row, "title", fallback=f"Transaction {transaction_id}"),
            payload={
                "transaction": record_to_dict(row),
                "tag_assignments": [record_to_dict(r) for r in tag_assignments],
                "attachments": [record_to_dict(r) for r in attachments],
            },
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        del user_id
        transaction_id = int(entity_id)
        await delete_rows(
            conn,
            MEDIA_ATTACHMENTS,
            where_sql="entity_type = 'finance_transaction' AND entity_id = $1",
            params=(transaction_id,),
        )
        deleted = await transaction_repository.delete_transaction(
            conn,
            transaction_id=transaction_id,
        )
        if not deleted:
            raise AppError("Transaction not found.", status_code=404)

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        transaction = (
            payload.get("transaction")
            or payload.get("purchase")
            or payload.get("item")
        )
        await restore_table_rows(conn, FINANCE_TRANSACTIONS, [transaction])
        tag_assignments = payload.get("tag_assignments", [])
        normalized_assignments = []
        for assignment in tag_assignments:
            row = dict(assignment)
            if "purchase_id" in row and "transaction_id" not in row:
                row["transaction_id"] = row.pop("purchase_id")
            normalized_assignments.append(row)
        await restore_table_rows(
            conn,
            FINANCE_TRANSACTION_TAG_ASSIGNMENTS,
            normalized_assignments,
        )
        await restore_table_rows(conn, MEDIA_ATTACHMENTS, payload.get("attachments", []))
        return str(transaction["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


class FinanceVendorHandler:
    entity_type = entity_types.FINANCE_VENDOR

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        vendor_id = int(entity_id)
        row = await vendor_repository.get_vendor(conn, vendor_id)
        if row is None or row["user_id"] != user_id:
            raise AppError("Vendor not found.", status_code=404)
        attachments = await fetch_rows(
            conn,
            MEDIA_ATTACHMENTS,
            where_sql="entity_type = 'finance_vendor' AND entity_id = $1",
            params=(vendor_id,),
        )
        return CaptureResult(
            display_label=build_label(row, "name", fallback=f"Vendor {vendor_id}"),
            payload={
                "vendor": record_to_dict(row),
                "attachments": [record_to_dict(r) for r in attachments],
            },
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        del user_id
        vendor_id = int(entity_id)
        await delete_rows(
            conn,
            MEDIA_ATTACHMENTS,
            where_sql="entity_type = 'finance_vendor' AND entity_id = $1",
            params=(vendor_id,),
        )
        deleted = await vendor_repository.delete_vendor(conn, vendor_id=vendor_id)
        if deleted is None:
            raise AppError("Vendor not found.", status_code=404)

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        vendor = payload.get("vendor") or payload.get("merchant")
        await restore_table_rows(conn, FINANCE_VENDORS, [vendor])
        await restore_table_rows(conn, MEDIA_ATTACHMENTS, payload.get("attachments", []))
        return str(vendor["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


class FinanceTransactionTagHandler:
    entity_type = entity_types.FINANCE_TRANSACTION_TAG

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        tag_id = int(entity_id)
        row = await transaction_tag_repository.get_user_tag(
            conn,
            user_id=user_id,
            tag_id=tag_id,
        )
        if row is None:
            raise AppError("Tag not found.", status_code=404)
        return CaptureResult(
            display_label=row["name"],
            payload={"tag": record_to_dict(row)},
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        deleted = await transaction_tag_repository.delete_user_tag(
            conn,
            user_id=user_id,
            tag_id=int(entity_id),
        )
        if not deleted:
            raise AppError("Tag not found.", status_code=404)

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        await restore_table_rows(conn, FINANCE_TRANSACTION_TAGS, [payload["tag"]])
        return str(payload["tag"]["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


class FinanceObligationHandler:
    entity_type = entity_types.FINANCE_OBLIGATION

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        obligation_id = int(entity_id)
        row = await obligation_repository.get_obligation(conn, obligation_id)
        if row is None or row["user_id"] != user_id:
            raise AppError("Obligation not found.", status_code=404)
        tag_assignments = await fetch_rows(
            conn,
            FINANCE_OBLIGATION_TAG_ASSIGNMENTS,
            where_sql="obligation_id = $1",
            params=(obligation_id,),
        )
        attachments = await fetch_rows(
            conn,
            MEDIA_ATTACHMENTS,
            where_sql="entity_type = 'finance_obligation' AND entity_id = $1",
            params=(obligation_id,),
        )
        return CaptureResult(
            display_label=build_label(row, "name", fallback=f"Obligation {obligation_id}"),
            payload={
                "obligation": record_to_dict(row),
                "tag_assignments": [record_to_dict(r) for r in tag_assignments],
                "attachments": [record_to_dict(r) for r in attachments],
            },
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        del user_id
        obligation_id = int(entity_id)
        await delete_rows(
            conn,
            MEDIA_ATTACHMENTS,
            where_sql="entity_type = 'finance_obligation' AND entity_id = $1",
            params=(obligation_id,),
        )
        deleted = await obligation_repository.delete_obligation(
            conn,
            obligation_id=obligation_id,
        )
        if not deleted:
            raise AppError("Obligation not found.", status_code=404)

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        await restore_table_rows(conn, FINANCE_OBLIGATIONS, [payload["obligation"]])
        await restore_table_rows(
            conn,
            FINANCE_OBLIGATION_TAG_ASSIGNMENTS,
            payload.get("tag_assignments", []),
        )
        await restore_table_rows(conn, MEDIA_ATTACHMENTS, payload.get("attachments", []))
        return str(payload["obligation"]["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


class FinancePaymentMethodHandler:
    entity_type = entity_types.FINANCE_PAYMENT_METHOD

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        payment_method_id = int(entity_id)
        row = await payment_method_repository.get_payment_method(conn, payment_method_id)
        if row is None or row["user_id"] != user_id:
            raise AppError("Payment method not found.", status_code=404)
        return CaptureResult(
            display_label=build_label(row, "label", fallback=f"Account {payment_method_id}"),
            payload={"payment_method": record_to_dict(row)},
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        del user_id
        deleted = await payment_method_repository.delete_payment_method(
            conn,
            payment_method_id=int(entity_id),
        )
        if deleted is None:
            raise AppError("Payment method not found.", status_code=404)

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        await restore_table_rows(
            conn,
            FINANCE_PAYMENT_METHODS,
            [payload["payment_method"]],
        )
        return str(payload["payment_method"]["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


class FinanceObligationTagHandler:
    entity_type = entity_types.FINANCE_OBLIGATION_TAG

    async def capture(self, conn, *, user_id: int, entity_id: str) -> CaptureResult:
        tag_id = int(entity_id)
        row = await obligation_tag_repository.get_user_tag(
            conn,
            user_id=user_id,
            tag_id=tag_id,
        )
        if row is None:
            raise AppError("Tag not found.", status_code=404)
        return CaptureResult(
            display_label=row["name"],
            payload={"tag": record_to_dict(row)},
        )

    async def delete_source(self, conn, *, user_id: int, entity_id: str) -> None:
        deleted = await obligation_tag_repository.delete_user_tag(
            conn,
            user_id=user_id,
            tag_id=int(entity_id),
        )
        if not deleted:
            raise AppError("Tag not found.", status_code=404)

    async def restore(self, conn, *, user_id: int, payload: dict) -> str:
        del user_id
        await restore_table_rows(conn, FINANCE_OBLIGATION_TAGS, [payload["tag"]])
        return str(payload["tag"]["id"])

    async def purge(self, conn, *, user_id: int, payload: dict) -> None:
        del conn, user_id, payload


HANDLERS: tuple[DeletedEntityHandler, ...] = (
    FinanceTransactionHandler(),
    FinanceVendorHandler(),
    FinanceTransactionTagHandler(),
    FinanceObligationHandler(),
    FinancePaymentMethodHandler(),
    FinanceObligationTagHandler(),
)
