# keel_api/src/modules/deleted/handlers/registry.py
"""Registry of entity-type trash handlers."""

from __future__ import annotations

from core.errors import AppError
from modules.deleted.handlers._protocol import DeletedEntityHandler
from modules.deleted.handlers.chat import HANDLERS as CHAT_HANDLERS
from modules.deleted.handlers.coak import HANDLERS as COAK_HANDLERS
from modules.deleted.handlers.contacts import HANDLERS as CONTACT_HANDLERS
from modules.deleted.handlers.figures import HANDLERS as FIGURE_HANDLERS
from modules.deleted.handlers.focus import HANDLERS as FOCUS_HANDLERS
from modules.deleted.handlers.journal import HANDLERS as JOURNAL_HANDLERS
from modules.deleted.handlers.media import HANDLERS as MEDIA_HANDLERS
from modules.deleted.handlers.projects import HANDLERS as PROJECT_HANDLERS
from modules.deleted.handlers.finance import HANDLERS as FINANCE_HANDLERS
from modules.deleted.handlers.timeline import HANDLERS as TIMELINE_HANDLERS

_ALL_HANDLERS: tuple[DeletedEntityHandler, ...] = (
    *CONTACT_HANDLERS,
    *FIGURE_HANDLERS,
    *TIMELINE_HANDLERS,
    *JOURNAL_HANDLERS,
    *FINANCE_HANDLERS,
    *FOCUS_HANDLERS,
    *MEDIA_HANDLERS,
    *PROJECT_HANDLERS,
    *COAK_HANDLERS,
    *CHAT_HANDLERS,
)

handlers_by_type: dict[str, DeletedEntityHandler] = {
    handler.entity_type: handler for handler in _ALL_HANDLERS
}


def get_handler(entity_type: str) -> DeletedEntityHandler:
    handler = handlers_by_type.get(entity_type)
    if handler is None:
        raise AppError(f"Unsupported deleted entity type: {entity_type}", status_code=400)
    return handler
