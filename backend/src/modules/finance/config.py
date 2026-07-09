# keel_api/src/modules/finance/config.py

"""Finance module settings — route paths and business constants."""

FEATURE_KEY = "finance"
OPENAPI_TAG = "finance"
ROUTE_PREFIX = f"/{FEATURE_KEY}"

TRANSACTION_LIST_PATH = "/transactions"
TRANSACTION_REORDER_PATH = "/transactions/reorder"
TRANSACTION_BY_ID_PATH = "/transactions/{transaction_id}"
VENDOR_LIST_PATH = "/vendors"
VENDOR_BY_ID_PATH = "/vendors/{vendor_id}"
TRANSACTION_TAG_LIST_PATH = "/transaction-tags"
TRANSACTION_TAG_BY_ID_PATH = "/transaction-tags/{tag_id}"
PROPOSAL_BY_ID_PATH = "/proposals/{proposal_id}"
PROPOSAL_CONFIRM_PATH = "/proposals/{proposal_id}/confirm"
PROPOSAL_DECLINE_PATH = "/proposals/{proposal_id}/decline"
OBLIGATION_LIST_PATH = "/obligations"
OBLIGATION_BY_ID_PATH = "/obligations/{obligation_id}"
PAYMENT_METHOD_LIST_PATH = "/payment-methods"
PAYMENT_METHOD_BY_ID_PATH = "/payment-methods/{payment_method_id}"
PAYMENT_METHOD_REORDER_PATH = "/payment-methods/reorder"
OBLIGATION_TAG_LIST_PATH = "/obligation-tags"
OBLIGATION_TAG_BY_ID_PATH = "/obligation-tags/{tag_id}"
SUMMARY_PATH = "/summary"

DEFAULT_TAG_COLOR_HEX = "#06B6D4"

VALID_TRANSACTION_KINDS: frozenset[str] = frozenset(
    {
        "physical",
        "expense",
        "subscription",
        "service",
    }
)

VALID_TRANSACTION_STATUSES: frozenset[str] = frozenset(
    {
        "considering",
        "ordered",
        "in_transit",
        "received",
        "cancelled",
        "returned",
    }
)

VALID_OBLIGATION_STATUSES: frozenset[str] = frozenset(
    {
        "active",
        "trial",
        "paused",
        "cancelled",
    }
)

VALID_OBLIGATION_KINDS: frozenset[str] = frozenset(
    {
        "subscription",
        "membership",
        "bill",
    }
)

VALID_BILLING_INTERVALS: frozenset[str] = frozenset(
    {
        "monthly",
        "annual",
        "weekly",
        "quarterly",
    }
)

VALID_PAYMENT_METHOD_KINDS: frozenset[str] = frozenset(
    {
        "credit_card",
        "debit_card",
        "checking",
        "savings",
        "prepaid",
        "other",
    }
)
