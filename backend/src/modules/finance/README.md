# Finance

Unified spending — transactions, subscriptions, vendors, payment methods, and listing proposals.

## Purpose

Finance tracks physical purchase wishlists/orders, one-off expenses and services, subscription billings, recurring obligations, vendors, and payment methods. It supports vendor logos, transaction cover/gallery media, obligation tagging, monthly burn summary, and HAUL listing import proposals. Media bytes live in **`modules/media`**; `listing/` implements fetch/extract without its own HTTP router.

## Module type

**Feature** — session auth, user-owned rows, frontend counterpart, native HAUL tools (category key `haul`).

## HTTP API

**Prefix:** `/finance`  
**Auth:** Session required on all routes.  
**Registered in:** `keel_api/src/main.py` → `finance_router`.

| Area | Endpoints |
|------|-----------|
| Summary | `GET /finance/summary` |
| Transactions | `GET/POST /finance/transactions`, `GET/PATCH/DELETE /finance/transactions/{id}`, `POST /finance/transactions/reorder` |
| Vendors | `GET/POST /finance/vendors`, `PATCH/DELETE /finance/vendors/{id}` |
| Transaction tags | `GET/POST /finance/transaction-tags`, `PATCH/DELETE /finance/transaction-tags/{id}` |
| Obligations | `GET/POST /finance/obligations`, `GET/PATCH/DELETE /finance/obligations/{id}` |
| Payment methods | `GET/POST /finance/payment-methods`, `PATCH/DELETE /finance/payment-methods/{id}`, `POST /finance/payment-methods/reorder` |
| Obligation tags | `GET/POST /finance/obligation-tags`, `PATCH/DELETE /finance/obligation-tags/{id}` |
| Proposals | `GET /finance/proposals/{id}`, `POST .../confirm`, `POST .../decline` |

Cover, logo, and gallery use **`/media`**, not finance routes.

## Public API

| Surface | Cross-module use | Key symbols |
|---------|------------------|-------------|
| `router.py` | Shell only | All `/finance/*` routes — mounted via `app_modules/registry.py` |
| `service/__init__.py` | Native tools, internal callers | `create_transaction`, `update_transaction`, `list_vendors`, `create_vendor`, `create_listing_proposal`, `confirm_listing_proposal`, `get_finance_summary`, obligation/payment-method/tag CRUD |
| `schemas.py` | HAUL native tools | `FinanceTransactionCreate`, `FinanceTransactionUpdate`, `FinanceVendorCreate`, `FinanceVendorUpdate`, `*Public` response models |
| `listing/` subpackage | Finance service only | Fetch/extract pipeline — not imported by other modules |
| `*_repository.py` | **Private** | SQL only — never import cross-module |

**Known cross-module consumers:**

| Consumer | Imports |
|----------|---------|
| `llm/tools/native/haul/*` | `schemas.py` create/update payloads; calls service functions |
| `modules/focus/reference_registry` | Reads `finance_transactions` table directly (no service import) |
| `modules/deleted/handlers` | Trash restore handlers for finance entity types |

## Media integration

| Role | Entity | Attachment role |
|------|--------|-----------------|
| Transaction cover | `finance_transaction` | `cover` |
| Transaction gallery | `finance_transaction` | `gallery` |
| Vendor logo | `finance_vendor` | `logo` |

## Frontend integration

**Frontend counterpart:** [keel_web/src/modules/finance/README.md](../../../../keel_web/src/modules/finance/README.md)

## Database

| Table | Purpose |
|-------|---------|
| `finance_vendors` | Vendor name, URLs, billing portal, notes |
| `finance_transactions` | Transaction records (`kind`, status workflow, vendor/obligation links) |
| `finance_transaction_tags` | Colored labels for transactions |
| `finance_transaction_tag_assignments` | Transaction ↔ tag junction |
| `finance_listing_proposals` | Pending listing import previews |
| `finance_payment_methods` | Cards and bank accounts (kind enum) |
| `finance_obligations` | Subscriptions, memberships, bills (`ends_at` for service end date) |
| `finance_obligation_tags` | Colored labels for obligations |
| `finance_obligation_tag_assignments` | Obligation ↔ tag junction |

Schema: `scripts/db/init/001_schema.sql` (finance tables, transactions, obligations).

## Directory structure

```
finance/
├── config.py
├── router.py
├── schemas.py
├── transaction_repository.py
├── vendor_repository.py
├── transaction_tag_repository.py
├── proposal_repository.py
├── obligation_repository.py
├── payment_method_repository.py
├── obligation_tag_repository.py
├── service/
│   ├── __init__.py
│   ├── transactions.py
│   ├── vendors.py
│   ├── proposals.py
│   ├── transaction_tags.py
│   ├── obligations.py
│   └── payment_methods.py
└── listing/
```

## Dependencies

- **`modules/media`** — cover, gallery, logo attachments
- **`modules/deleted`** — trash handlers for finance entity types
- **`modules/focus/reference_registry`** — `finance_transaction` reference type

## Module changelog

**2026-07-12** — Added **Public API** section (modularity Phase 4).

**2026-07-07** — Renamed purchases to transactions; added `kind` and `obligation_id`; migration `2026_07_07_finance_transactions`.

**2026-07-06** — Renamed from Shop; added obligations, payment methods, obligation tags, summary endpoint.
