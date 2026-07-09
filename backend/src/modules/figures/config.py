# keel_api/src/modules/figures/config.py

"""Figures module settings — route paths and validation constants."""

FEATURE_KEY = "figures"
OPENAPI_TAG = "figures"
ROUTE_PREFIX = f"/{FEATURE_KEY}"

LIST_FIGURES_PATH = ""
FIGURE_BY_ID_PATH = "/{figure_id}"

VALID_FIGURE_STATUSES: frozenset[str] = frozenset({"active", "archived"})

VALID_FIGURE_GENDERS: frozenset[str] = frozenset({"male", "female"})

BIRTH_DATE_UNKNOWN_YEAR = 9999
