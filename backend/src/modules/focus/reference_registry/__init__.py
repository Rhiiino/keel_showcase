# keel_api/src/modules/focus/reference_registry/__init__.py

"""Code-defined registry for external record reference types."""

from modules.focus.reference_registry.detail import get_reference_detail
from modules.focus.reference_registry.hydrate import (
    hydrate_reference_target,
    reference_target_exists,
)
from modules.focus.reference_registry.search import search_reference_targets
from modules.focus.reference_registry.types import (
    DEFAULT_REFERENCE_ENABLED_TYPES,
    ReferencePropertyDef,
    ReferenceTypeMeta,
    all_reference_type_metas,
    get_reference_type_meta,
    normalize_enabled_types,
    reference_property_manifest,
)

__all__ = [
    "DEFAULT_REFERENCE_ENABLED_TYPES",
    "ReferencePropertyDef",
    "ReferenceTypeMeta",
    "all_reference_type_metas",
    "get_reference_detail",
    "get_reference_type_meta",
    "hydrate_reference_target",
    "normalize_enabled_types",
    "reference_property_manifest",
    "reference_target_exists",
    "search_reference_targets",
]
