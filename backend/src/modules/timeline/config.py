# keel_api/src/modules/timeline/config.py

"""Timeline module settings — route paths and constants."""

FEATURE_KEY = "timeline"
OPENAPI_TAG = "timeline"
ROUTE_PREFIX = f"/{FEATURE_KEY}"

EVENTS_PATH = "/events"
EVENT_BY_ID_PATH = "/events/{event_id}"
PLANS_PATH = "/plans"
PLAN_BY_ID_PATH = "/plans/{plan_id}"
PLAN_ITEMS_PATH = "/plans/{plan_id}/items"
PLAN_ITEM_BY_ID_PATH = "/plan-items/{plan_item_id}"
PLAN_ITEM_REORDER_PATH = "/plan-items/{plan_item_id}/reorder"
PLAN_ITEM_PROMOTE_PATH = "/plan-items/{plan_item_id}/promote"
PLAN_ITEM_LINK_EVENT_PATH = "/plan-items/{plan_item_id}/link-event"
CALENDAR_PATH = "/calendar"
TAG_LIST_PATH = "/tags"
TAG_BY_ID_PATH = "/tags/{tag_id}"

DEFAULT_TAG_COLOR_HEX = "#06B6D4"
