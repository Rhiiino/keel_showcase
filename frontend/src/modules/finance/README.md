# Finance

Personal finance tracker — transactions, subscriptions, vendors, payment methods, and AI listing proposals.

## Routes and navigation

| Path | Page | Purpose |
|------|------|---------|
| `/finance` | redirect | Redirects to `/finance/transactions` |
| `/finance/transactions` | `FinanceTransactionsPage` | Transaction list (card/kanban or list) |
| `/finance/transactions/new` | `FinanceTransactionCreatePage` | New transaction |
| `/finance/transactions/:transactionId` | `FinanceTransactionPage` | Transaction detail |
| `/finance/subscriptions` | `FinanceSubscriptionsPage` | Subscriptions + summary header |
| `/finance/subscriptions/new` | `FinanceSubscriptionCreatePage` | New subscription |
| `/finance/subscriptions/:obligationId` | `FinanceSubscriptionPage` | Subscription detail |
| `/finance/vendors` | `FinanceVendorsPage` | Vendor list (card grid or list table) |
| `/finance/vendors/new` | `FinanceVendorCreatePage` | New vendor |
| `/finance/vendors/:vendorId` | `FinanceVendorPage` | Vendor detail + linked records |
| `/finance/accounts` | `FinanceAccountsPage` | Payment methods |
| `/finance/accounts/new` | `FinanceAccountCreatePage` | New payment method |
| `/finance/accounts/:paymentMethodId` | `FinanceAccountPage` | Payment method detail |
| `/finance/tags` | `FinanceTagsPage` | Redirects to transaction tags tab |
| `/finance/tags/transactions` | `FinanceTransactionTagsPage` | Transaction tag catalog |
| `/finance/tags/obligations` | `FinanceObligationTagsPage` | Obligation tag catalog |

**Nav:** id `finance`, title Finance, href `/finance`, accent blue.

**Registered in:** `manifest.ts` → [`app/modules/registry.ts`](../../app/modules/registry.ts).

**Module sub-nav:** Transactions | Subscriptions | Vendors | Accounts | Tags via `FinanceModuleLayout` + `subNav.tsx`.

## Public exports

| Surface | Exported for | Key symbols |
|---------|--------------|-------------|
| `manifest.ts` | App shell only | `financeManifest` |
| `api.ts` | Cross-module HTTP client + types | `financeQueryKeys`; types `FinanceTransaction`, `FinanceVendor`, `FinanceObligation`, `FinancePaymentMethod`, `FinanceSummary`; fetch/create/update/delete helpers; `financeTransactionCoverUrl` |
| `components/`, `hooks/`, `pages/`, `lib/` | **Finance module only** | Not imported by other modules |

**Documented imports from other modules (consumer side):**

| Module | Surface | Purpose |
|--------|---------|---------|
| `media` | `api.ts` — `buildMediaContentUrl`, `uploadMedia`, attachment helpers, `MediaObject` type | Transaction cover/gallery, vendor logos, obligation attachments |
| `media` | `components/pickers`, `EntityMediaCarousel` *(boundary debt — Phase 4b)* | Media library picker UI on vendor/transaction forms |
| Platform | `src/components/`, `src/hooks/` | `CardMenu`, `ModuleTabBar`, `MediaCardMenu`, `MediaLightbox`, `useConfirmDeleteAction`, `usePageFileDrop` |

**Shell consumers:** [`buildNavigationLabelContext.ts`](../../app/navigation/buildNavigationLabelContext.ts) imports `financeQueryKeys` and finance entity types from `api.ts`.

## Backend integration

Prefix: `/finance` — see `keel_api/src/modules/finance/`.

| Area | Endpoints |
|------|-----------|
| Summary | `GET /finance/summary` |
| Transactions | `GET/POST /finance/transactions`, `GET/PATCH/DELETE /finance/transactions/:id` |
| Vendors | `GET/POST /finance/vendors`, `PATCH/DELETE .../:id` |
| Obligations | `GET/POST /finance/obligations`, `GET/PATCH/DELETE .../:id` |
| Payment methods | `GET/POST /finance/payment-methods`, `GET/PATCH/DELETE .../:id` |
| Transaction tags | `GET/POST /finance/transaction-tags`, `PATCH/DELETE .../:id` |
| Obligation tags | `GET/POST /finance/obligation-tags`, `PATCH/DELETE .../:id` |
| Proposals | `GET /finance/proposals/:id`, confirm/decline |

Query keys: `financeQueryKeys` in `api.ts`.

Media entity types: `finance_transaction` (cover/gallery), `finance_vendor` (logo).

Transaction `kind` values: `physical`, `expense`, `subscription`, `service`. Subscription billings link to an obligation via `obligation_id`.

## Dependencies

- **media** — attachments and upload pipeline
- **focus** — references `finance_transaction`
- **chat** — HAUL listing proposal cards
- **Platform** — `CardMenu`, `useConfirmDeleteAction`, `usePageFileDrop`, `ModuleTabBar`, `MediaCardMenu`, `MediaLightbox` from `src/components/` and `src/hooks/`

## Module changelog

- **2026-07-12** — Added **Public exports** section (modularity Phase 4).
- **2026-07-08** — Subscriptions: optional service end date (`ends_at`) on create/edit forms.
- **2026-07-07** — Purchases renamed to transactions; routes at `/finance/transactions`; list Kind column; detail kind picker and subscription link via `ObligationSelect`.
- **2026-07-06** — List views: purchases, subscriptions, accounts, and vendors use shared `ListView` with pagination and sortable columns; vendors page adds card/list toggle and `IconPlusButton` header.
- **2026-07-06** — Renamed shop module to finance; added subscriptions, accounts, obligation tags, summary header, vendor linked records hub.
- **2026-07-06** — Subscriptions list row navigates to edit form; vendor icon column; CardMenu delete with two-step confirm.
- **2026-07-06** — Accounts list: institution column, clickable rows, CardMenu delete with two-step confirm.
- **2026-07-06** — Subscriptions: obligation tag picker on forms; tags column on list view.
- **2026-07-06** — Purchases: ordered/received dates on forms; read-only ordered date on list; subscription vendor picker opens vendor detail; status filter buttons removed from purchases list.
- **2026-07-06** — Subscriptions: file attachments on create/edit forms (shared media carousel; no cover image).
