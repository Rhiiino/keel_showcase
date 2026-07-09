# keel_api/src/modules/finance/schemas.py

"""Pydantic models for the finance API."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from modules.media.schemas import MediaAttachmentPublic, MediaPublic


class FinanceVendorPublic(BaseModel):
    id: int
    name: str
    website_url: str | None
    billing_portal_url: str | None
    notes: str
    default_currency: str | None
    logo: MediaPublic | None = None
    created_at: datetime
    updated_at: datetime


class FinanceVendorCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    website_url: str | None = Field(default=None, max_length=2048)
    billing_portal_url: str | None = Field(default=None, max_length=2048)
    notes: str = Field(default="", max_length=8000)
    default_currency: str | None = Field(default=None, max_length=8)


class FinanceVendorUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    website_url: str | None = Field(default=None, max_length=2048)
    billing_portal_url: str | None = Field(default=None, max_length=2048)
    notes: str | None = Field(default=None, max_length=8000)
    default_currency: str | None = Field(default=None, max_length=8)


class FinanceTransactionTagPublic(BaseModel):
    id: int
    name: str
    description: str | None = None
    color_hex: str
    transaction_count: int = 0


class FinanceTransactionTagCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=512)
    color_hex: str | None = None


class FinanceTransactionTagUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=512)
    color_hex: str | None = None


class FinanceTransactionPublic(BaseModel):
    id: int
    user_id: int
    title: str
    kind: str
    status: str
    sort_order: int
    vendor_id: int | None
    vendor_name: str | None
    obligation_id: int | None
    obligation_name: str | None
    listing_url: str | None
    notes: str
    price_amount: Decimal | None
    currency: str
    quantity: int
    ordered_at: datetime | None
    received_at: datetime | None
    cover: MediaPublic | None = None
    gallery: list[MediaAttachmentPublic] = Field(default_factory=list)
    tags: list[FinanceTransactionTagPublic] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class FinanceTransactionCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=512)
    kind: str = Field(default="physical", max_length=32)
    status: str = Field(default="considering", max_length=32)
    vendor_id: int | None = Field(default=None, ge=1)
    vendor_name: str | None = Field(default=None, max_length=120)
    obligation_id: int | None = Field(default=None, ge=1)
    listing_url: str | None = Field(default=None, max_length=2048)
    notes: str = Field(default="", max_length=8000)
    price_amount: Decimal | None = None
    currency: str | None = Field(default=None, max_length=8)
    quantity: int | None = Field(default=None, ge=1)
    ordered_at: datetime | None = None
    received_at: datetime | None = None
    tag_ids: list[int] = Field(default_factory=list)


class FinanceTransactionUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=512)
    kind: str | None = Field(default=None, max_length=32)
    status: str | None = Field(default=None, max_length=32)
    sort_order: int | None = Field(default=None, ge=0)
    vendor_id: int | None = None
    vendor_name: str | None = Field(default=None, max_length=120)
    obligation_id: int | None = None
    listing_url: str | None = Field(default=None, max_length=2048)
    notes: str | None = Field(default=None, max_length=8000)
    price_amount: Decimal | None = None
    currency: str | None = Field(default=None, max_length=8)
    quantity: int | None = Field(default=None, ge=1)
    ordered_at: datetime | None = None
    received_at: datetime | None = None
    tag_ids: list[int] | None = None


class FinanceTransactionReorderEntry(BaseModel):
    id: int = Field(..., ge=1)
    status: str = Field(..., max_length=32)
    sort_order: int = Field(..., ge=0)


class FinanceTransactionReorder(BaseModel):
    items: list[FinanceTransactionReorderEntry] = Field(..., min_length=1)


class FinanceListingProposalPublic(BaseModel):
    id: int
    status: str
    payload: dict
    created_transaction_id: int | None
    created_vendor_id: int | None
    created_at: datetime
    updated_at: datetime


class FinanceListingProposalConfirmResult(BaseModel):
    proposal: FinanceListingProposalPublic
    transaction: FinanceTransactionPublic
    vendor: FinanceVendorPublic | None = None


class FinancePaymentMethodPublic(BaseModel):
    id: int
    kind: str
    label: str
    institution_name: str | None
    last_four: str | None
    notes: str
    is_active: bool
    sort_order: int
    created_at: datetime
    updated_at: datetime


class FinancePaymentMethodCreate(BaseModel):
    kind: str = Field(default="credit_card", max_length=32)
    label: str = Field(..., min_length=1, max_length=120)
    institution_name: str | None = Field(default=None, max_length=120)
    last_four: str | None = Field(default=None, min_length=4, max_length=4)
    notes: str = Field(default="", max_length=8000)
    is_active: bool = True


class FinancePaymentMethodUpdate(BaseModel):
    kind: str | None = Field(default=None, max_length=32)
    label: str | None = Field(default=None, min_length=1, max_length=120)
    institution_name: str | None = Field(default=None, max_length=120)
    last_four: str | None = Field(default=None, min_length=4, max_length=4)
    notes: str | None = Field(default=None, max_length=8000)
    is_active: bool | None = None
    sort_order: int | None = Field(default=None, ge=0)


class FinancePaymentMethodReorderEntry(BaseModel):
    id: int = Field(..., ge=1)
    sort_order: int = Field(..., ge=0)


class FinancePaymentMethodReorder(BaseModel):
    items: list[FinancePaymentMethodReorderEntry] = Field(..., min_length=1)


class FinanceObligationTagPublic(BaseModel):
    id: int
    name: str
    description: str | None = None
    color_hex: str
    obligation_count: int = 0


class FinanceObligationTagCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=512)
    color_hex: str | None = None


class FinanceObligationTagUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=512)
    color_hex: str | None = None


class FinanceObligationPublic(BaseModel):
    id: int
    user_id: int
    vendor_id: int | None
    vendor_name: str | None
    payment_method_id: int | None
    payment_method_label: str | None
    name: str
    kind: str
    status: str
    amount: Decimal | None
    currency: str
    billing_interval: str
    billing_day: int | None
    started_at: datetime | None
    next_billing_at: datetime | None
    cancelled_at: datetime | None
    ends_at: datetime | None
    account_url: str | None
    notes: str
    sort_order: int
    tags: list[FinanceObligationTagPublic] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class FinanceObligationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=512)
    kind: str = Field(default="subscription", max_length=32)
    status: str = Field(default="active", max_length=32)
    vendor_id: int | None = Field(default=None, ge=1)
    vendor_name: str | None = Field(default=None, max_length=120)
    payment_method_id: int | None = Field(default=None, ge=1)
    amount: Decimal | None = None
    currency: str | None = Field(default=None, max_length=8)
    billing_interval: str = Field(default="monthly", max_length=32)
    billing_day: int | None = Field(default=None, ge=1, le=31)
    started_at: datetime | None = None
    next_billing_at: datetime | None = None
    ends_at: datetime | None = None
    account_url: str | None = Field(default=None, max_length=2048)
    notes: str = Field(default="", max_length=8000)
    tag_ids: list[int] = Field(default_factory=list)


class FinanceObligationUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=512)
    kind: str | None = Field(default=None, max_length=32)
    status: str | None = Field(default=None, max_length=32)
    sort_order: int | None = Field(default=None, ge=0)
    vendor_id: int | None = None
    vendor_name: str | None = Field(default=None, max_length=120)
    payment_method_id: int | None = None
    amount: Decimal | None = None
    currency: str | None = Field(default=None, max_length=8)
    billing_interval: str | None = Field(default=None, max_length=32)
    billing_day: int | None = Field(default=None, ge=1, le=31)
    started_at: datetime | None = None
    next_billing_at: datetime | None = None
    cancelled_at: datetime | None = None
    ends_at: datetime | None = None
    account_url: str | None = Field(default=None, max_length=2048)
    notes: str | None = Field(default=None, max_length=8000)
    tag_ids: list[int] | None = None


class FinanceSummaryPublic(BaseModel):
    active_obligation_count: int
    monthly_burn: Decimal
    renewals_next_30_days: int
