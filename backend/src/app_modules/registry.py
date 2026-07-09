# keel_api/src/app_modules/registry.py
"""Ordered backend module registry — add new modules here."""

from __future__ import annotations

from modules.agents.router import router as agents_router
from modules.auth.router import router as auth_router
from modules.catalog.router import router as catalog_router
from modules.chat.router import router as chat_router
from modules.coak.router import router as coak_router
from modules.connectors.router import router as connectors_router
from modules.contacts.router import router as contacts_router
from modules.figures.router import router as figures_router
from modules.games.router import router as games_router
from modules.deleted.router import router as deleted_router
from modules.finance.router import router as finance_router
from modules.focus.router import router as focus_router
from modules.home.router import router as home_router
from modules.journal.router import router as journal_router
from modules.jobs.router import router as jobs_router
from modules.media.router import router as media_router
from modules.projects.router import router as projects_router
from modules.services.router import router as services_router
from modules.settings.router import router as settings_router
from modules.timeline.router import router as timeline_router

from app_modules.types import ModuleRegistration

MODULE_REGISTRY: tuple[ModuleRegistration, ...] = (
    ModuleRegistration(key="auth", router=auth_router),
    ModuleRegistration(key="settings", router=settings_router),
    ModuleRegistration(key="deleted", router=deleted_router),
    ModuleRegistration(key="catalog", router=catalog_router),
    ModuleRegistration(key="media", router=media_router),
    ModuleRegistration(key="chat", router=chat_router),
    ModuleRegistration(key="agents", router=agents_router),
    ModuleRegistration(key="projects", router=projects_router),
    ModuleRegistration(key="focus", router=focus_router),
    ModuleRegistration(key="connectors", router=connectors_router),
    ModuleRegistration(key="contacts", router=contacts_router),
    ModuleRegistration(key="figures", router=figures_router),
    ModuleRegistration(key="home", router=home_router),
    ModuleRegistration(key="finance", router=finance_router),
    ModuleRegistration(key="timeline", router=timeline_router),
    ModuleRegistration(key="journal", router=journal_router),
    ModuleRegistration(key="jobs", router=jobs_router),
    ModuleRegistration(key="coak", router=coak_router),
    ModuleRegistration(key="games", router=games_router),
    ModuleRegistration(key="services", router=services_router),
)


def enabled_modules() -> tuple[ModuleRegistration, ...]:
    """Return registry entries whose enabled check passes."""
    return tuple(
        registration for registration in MODULE_REGISTRY if registration.enabled()
    )
