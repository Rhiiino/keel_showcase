# keel_api/src/modules/finance/router.py

"""HTTP routes for finance transactions, vendors, obligations, and payment methods."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query, status

from modules.auth.schemas import CurrentUserResponse
from modules.auth.service import get_current_user
from modules.finance import config
from modules.finance import service
from modules.finance.schemas import (
    FinanceListingProposalConfirmResult,
    FinanceListingProposalPublic,
    FinanceObligationCreate,
    FinanceObligationPublic,
    FinanceObligationTagCreate,
    FinanceObligationTagPublic,
    FinanceObligationTagUpdate,
    FinanceObligationUpdate,
    FinancePaymentMethodCreate,
    FinancePaymentMethodPublic,
    FinancePaymentMethodReorder,
    FinancePaymentMethodUpdate,
    FinanceSummaryPublic,
    FinanceTransactionCreate,
    FinanceTransactionPublic,
    FinanceTransactionReorder,
    FinanceTransactionTagCreate,
    FinanceTransactionTagPublic,
    FinanceTransactionTagUpdate,
    FinanceTransactionUpdate,
    FinanceVendorCreate,
    FinanceVendorPublic,
    FinanceVendorUpdate,
)

router = APIRouter(prefix=config.ROUTE_PREFIX, tags=[config.OPENAPI_TAG])

CurrentUser = Annotated[CurrentUserResponse, Depends(get_current_user)]



# ----- Summary
@router.get(config.SUMMARY_PATH, response_model=FinanceSummaryPublic)
async def get_summary(user: CurrentUser) -> FinanceSummaryPublic:
    """Return active obligation count, monthly burn, and renewals in the next 30 days."""
    return await service.get_finance_summary(user.id)



# ----- Vendors
@router.get(config.VENDOR_LIST_PATH, response_model=list[FinanceVendorPublic])
async def list_vendors(
    user: CurrentUser,
    query: str | None = Query(default=None),
) -> list[FinanceVendorPublic]:
    return await service.list_vendors(user.id, query=query)


@router.post(
    config.VENDOR_LIST_PATH,
    response_model=FinanceVendorPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_vendor(
    payload: FinanceVendorCreate,
    user: CurrentUser,
) -> FinanceVendorPublic:
    return await service.create_vendor(user.id, payload)


@router.patch(config.VENDOR_BY_ID_PATH, response_model=FinanceVendorPublic)
async def update_vendor(
    vendor_id: int,
    payload: FinanceVendorUpdate,
    user: CurrentUser,
) -> FinanceVendorPublic:
    return await service.update_vendor(user.id, vendor_id, payload)


@router.delete(config.VENDOR_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_vendor(vendor_id: int, user: CurrentUser) -> None:
    await service.delete_vendor(user.id, vendor_id)



# ----- Transaction tags
@router.get(config.TRANSACTION_TAG_LIST_PATH, response_model=list[FinanceTransactionTagPublic])
async def list_transaction_tags(user: CurrentUser) -> list[FinanceTransactionTagPublic]:
    return await service.list_transaction_tags(user.id)


@router.post(
    config.TRANSACTION_TAG_LIST_PATH,
    response_model=FinanceTransactionTagPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_transaction_tag(
    payload: FinanceTransactionTagCreate,
    user: CurrentUser,
) -> FinanceTransactionTagPublic:
    return await service.create_transaction_tag(user.id, payload)


@router.patch(config.TRANSACTION_TAG_BY_ID_PATH, response_model=FinanceTransactionTagPublic)
async def update_transaction_tag(
    tag_id: int,
    payload: FinanceTransactionTagUpdate,
    user: CurrentUser,
) -> FinanceTransactionTagPublic:
    return await service.update_transaction_tag(user.id, tag_id, payload)


@router.delete(config.TRANSACTION_TAG_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction_tag(tag_id: int, user: CurrentUser) -> None:
    await service.delete_transaction_tag(user.id, tag_id)



# ----- Transactions
@router.get(config.TRANSACTION_LIST_PATH, response_model=list[FinanceTransactionPublic])
async def list_transactions(
    user: CurrentUser,
    status_filter: str | None = Query(default=None, alias="status"),
    kind: str | None = Query(default=None),
    vendor_id: int | None = Query(default=None),
    query: str | None = Query(default=None),
) -> list[FinanceTransactionPublic]:
    return await service.list_transactions(
        user.id,
        status=status_filter,
        kind=kind,
        vendor_id=vendor_id,
        query=query,
    )


@router.post(config.TRANSACTION_REORDER_PATH, response_model=list[FinanceTransactionPublic])
async def reorder_transactions(
    payload: FinanceTransactionReorder,
    user: CurrentUser,
) -> list[FinanceTransactionPublic]:
    return await service.reorder_transactions(user.id, payload)


@router.post(
    config.TRANSACTION_LIST_PATH,
    response_model=FinanceTransactionPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_transaction(
    payload: FinanceTransactionCreate,
    user: CurrentUser,
) -> FinanceTransactionPublic:
    return await service.create_transaction(user.id, payload)


@router.get(config.TRANSACTION_BY_ID_PATH, response_model=FinanceTransactionPublic)
async def get_transaction(transaction_id: int, user: CurrentUser) -> FinanceTransactionPublic:
    return await service.get_transaction(user.id, transaction_id)


@router.patch(config.TRANSACTION_BY_ID_PATH, response_model=FinanceTransactionPublic)
async def update_transaction(
    transaction_id: int,
    payload: FinanceTransactionUpdate,
    user: CurrentUser,
) -> FinanceTransactionPublic:
    return await service.update_transaction(user.id, transaction_id, payload)


@router.delete(config.TRANSACTION_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(transaction_id: int, user: CurrentUser) -> None:
    await service.delete_transaction(user.id, transaction_id)



# ----- Listing proposals
@router.get(config.PROPOSAL_BY_ID_PATH, response_model=FinanceListingProposalPublic)
async def get_listing_proposal(
    proposal_id: int,
    user: CurrentUser,
) -> FinanceListingProposalPublic:
    return await service.get_listing_proposal(user.id, proposal_id)


@router.post(
    config.PROPOSAL_CONFIRM_PATH,
    response_model=FinanceListingProposalConfirmResult,
)
async def confirm_listing_proposal(
    proposal_id: int,
    user: CurrentUser,
) -> FinanceListingProposalConfirmResult:
    return await service.confirm_listing_proposal(user.id, proposal_id)


@router.post(config.PROPOSAL_DECLINE_PATH, response_model=FinanceListingProposalPublic)
async def decline_listing_proposal(
    proposal_id: int,
    user: CurrentUser,
) -> FinanceListingProposalPublic:
    return await service.decline_listing_proposal(user.id, proposal_id)



# ----- Obligations
@router.get(config.OBLIGATION_LIST_PATH, response_model=list[FinanceObligationPublic])
async def list_obligations(
    user: CurrentUser,
    status_filter: str | None = Query(default=None, alias="status"),
    kind: str | None = Query(default=None),
    vendor_id: int | None = Query(default=None),
    payment_method_id: int | None = Query(default=None),
    tag_ids: list[int] | None = Query(default=None),
    next_billing_before: str | None = Query(default=None),
    query: str | None = Query(default=None),
) -> list[FinanceObligationPublic]:
    from datetime import datetime

    parsed_before = (
        datetime.fromisoformat(next_billing_before.replace("Z", "+00:00"))
        if next_billing_before
        else None
    )
    return await service.list_obligations(
        user.id,
        status=status_filter,
        kind=kind,
        vendor_id=vendor_id,
        payment_method_id=payment_method_id,
        tag_ids=tag_ids,
        next_billing_before=parsed_before,
        query=query,
    )


@router.post(
    config.OBLIGATION_LIST_PATH,
    response_model=FinanceObligationPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_obligation(
    payload: FinanceObligationCreate,
    user: CurrentUser,
) -> FinanceObligationPublic:
    return await service.create_obligation(user.id, payload)


@router.get(config.OBLIGATION_BY_ID_PATH, response_model=FinanceObligationPublic)
async def get_obligation(obligation_id: int, user: CurrentUser) -> FinanceObligationPublic:
    return await service.get_obligation(user.id, obligation_id)


@router.patch(config.OBLIGATION_BY_ID_PATH, response_model=FinanceObligationPublic)
async def update_obligation(
    obligation_id: int,
    payload: FinanceObligationUpdate,
    user: CurrentUser,
) -> FinanceObligationPublic:
    return await service.update_obligation(user.id, obligation_id, payload)


@router.delete(config.OBLIGATION_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_obligation(obligation_id: int, user: CurrentUser) -> None:
    await service.delete_obligation(user.id, obligation_id)



# ----- Payment methods
@router.get(config.PAYMENT_METHOD_LIST_PATH, response_model=list[FinancePaymentMethodPublic])
async def list_payment_methods(user: CurrentUser) -> list[FinancePaymentMethodPublic]:
    return await service.list_payment_methods(user.id)


@router.post(
    config.PAYMENT_METHOD_LIST_PATH,
    response_model=FinancePaymentMethodPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_payment_method(
    payload: FinancePaymentMethodCreate,
    user: CurrentUser,
) -> FinancePaymentMethodPublic:
    return await service.create_payment_method(user.id, payload)


@router.get(config.PAYMENT_METHOD_BY_ID_PATH, response_model=FinancePaymentMethodPublic)
async def get_payment_method(
    payment_method_id: int,
    user: CurrentUser,
) -> FinancePaymentMethodPublic:
    return await service.get_payment_method(user.id, payment_method_id)


@router.patch(config.PAYMENT_METHOD_BY_ID_PATH, response_model=FinancePaymentMethodPublic)
async def update_payment_method(
    payment_method_id: int,
    payload: FinancePaymentMethodUpdate,
    user: CurrentUser,
) -> FinancePaymentMethodPublic:
    return await service.update_payment_method(user.id, payment_method_id, payload)


@router.delete(config.PAYMENT_METHOD_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment_method(payment_method_id: int, user: CurrentUser) -> None:
    await service.delete_payment_method(user.id, payment_method_id)


@router.post(
    config.PAYMENT_METHOD_REORDER_PATH,
    response_model=list[FinancePaymentMethodPublic],
)
async def reorder_payment_methods(
    payload: FinancePaymentMethodReorder,
    user: CurrentUser,
) -> list[FinancePaymentMethodPublic]:
    return await service.reorder_payment_methods(user.id, payload)



# ----- Obligation tags
@router.get(config.OBLIGATION_TAG_LIST_PATH, response_model=list[FinanceObligationTagPublic])
async def list_obligation_tags(user: CurrentUser) -> list[FinanceObligationTagPublic]:
    return await service.list_obligation_tags(user.id)


@router.post(
    config.OBLIGATION_TAG_LIST_PATH,
    response_model=FinanceObligationTagPublic,
    status_code=status.HTTP_201_CREATED,
)
async def create_obligation_tag(
    payload: FinanceObligationTagCreate,
    user: CurrentUser,
) -> FinanceObligationTagPublic:
    return await service.create_obligation_tag(user.id, payload)


@router.patch(config.OBLIGATION_TAG_BY_ID_PATH, response_model=FinanceObligationTagPublic)
async def update_obligation_tag(
    tag_id: int,
    payload: FinanceObligationTagUpdate,
    user: CurrentUser,
) -> FinanceObligationTagPublic:
    return await service.update_obligation_tag(user.id, tag_id, payload)


@router.delete(config.OBLIGATION_TAG_BY_ID_PATH, status_code=status.HTTP_204_NO_CONTENT)
async def delete_obligation_tag(tag_id: int, user: CurrentUser) -> None:
    await service.delete_obligation_tag(user.id, tag_id)
