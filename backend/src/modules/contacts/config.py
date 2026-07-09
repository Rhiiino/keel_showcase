# keel_api/src/modules/contacts/config.py

"""Contacts module settings — route paths and validation constants."""

FEATURE_KEY = "contacts"
OPENAPI_TAG = "contacts"
ROUTE_PREFIX = f"/{FEATURE_KEY}"

LIST_CONTACTS_PATH = ""
CONTACT_SELF_PATH = "/self"
CONTACT_BY_ID_PATH = "/{contact_id}"

RELATIONSHIP_LIST_PATH = "/relationships"
RELATIONSHIP_BY_ID_PATH = "/relationships/{relationship_id}"

FAMILY_GROUP_LIST_PATH = "/family-groups"
FAMILY_GROUP_MERGED_TREE_PATH = "/family-groups/merged/tree"
FAMILY_GROUP_BY_ID_PATH = "/family-groups/{family_key}"
FAMILY_GROUP_TREE_PATH = "/family-groups/{family_key}/tree"

TAG_LIST_PATH = "/tags"
TAG_BY_ID_PATH = "/tags/{tag_id}"

DEFAULT_TAG_COLOR_HEX = "#06B6D4"

VALID_RELATIONSHIP_TYPES: frozenset[str] = frozenset(
    {"spouse", "parent", "sibling", "friend"}
)

VALID_CONTACT_STATUSES: frozenset[str] = frozenset({"active", "archived"})

VALID_CONTACT_GENDERS: frozenset[str] = frozenset({"male", "female"})

# Placeholder year stored in birth_date when only month and day are known.
BIRTH_DATE_UNKNOWN_YEAR = 9999

GENEALOGICAL_RELATIONSHIP_TYPES: frozenset[str] = frozenset(
    {"spouse", "parent", "sibling"}
)
