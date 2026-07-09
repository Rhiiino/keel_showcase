# keel_api/src/modules/connectors/router.py

"""Connector module router."""

from fastapi import APIRouter

from modules.connectors import config
from modules.connectors.focus.router import router as focus_connector_router

router = APIRouter(prefix=config.ROUTE_PREFIX, tags=[config.OPENAPI_TAG])
router.include_router(focus_connector_router)
