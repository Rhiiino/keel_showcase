# stack_sandbox/backend/src/modules/projects/workspace_state.py
"""Normalize persisted workspace canvas JSON (edges, colors) on read/write."""

from __future__ import annotations

import re
from typing import Any

_EDGE_COLOR_ALIASES: dict[str, str] = {
    "blue": "#2563eb",
    "green": "#16a34a",
    "red": "#ef4444",
    "orange": "#ea580c",
    "yellow": "#ca8a04",
    "purple": "#9333ea",
    "stone": "#57534e",
    "slate": "#64748b",
}

_HEX_COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")


def _normalize_edge_color_value(raw: Any) -> str | None:
    """Normalize a workspace edge color hex value."""
    if not isinstance(raw, str):
        return None
    trimmed = raw.strip()
    if not trimmed:
        return None
    lower = trimmed.lower()
    if lower in _EDGE_COLOR_ALIASES:
        return _EDGE_COLOR_ALIASES[lower]
    if _HEX_COLOR.match(trimmed):
        return lower
    return trimmed


def _normalize_workspace_edge(edge: dict[str, Any]) -> dict[str, Any]:
    """Normalize one workspace edge dict for persistence."""
    normalized = dict(edge)
    normalized["type"] = "workspace"

    data = normalized.get("data")
    if not isinstance(data, dict):
        data = {}
    else:
        data = dict(data)

    from_data = _normalize_edge_color_value(data.get("color"))
    style = normalized.get("style")
    from_style = None
    if isinstance(style, dict):
        from_style = _normalize_edge_color_value(style.get("stroke"))

    color = from_data or from_style
    if color:
        data["color"] = color

    path_style = data.get("pathStyle")
    if path_style not in ("smooth", "straight", "orthogonal"):
        data["pathStyle"] = "smooth"

    normalized["data"] = data
    return normalized


def normalize_workspace_state(state: dict[str, Any]) -> dict[str, Any]:
    """Return state with normalized edges (type, data.color, pathStyle)."""
    edges = state.get("edges")
    if not isinstance(edges, list):
        return state

    normalized_edges: list[Any] = []
    for edge in edges:
        if isinstance(edge, dict):
            normalized_edges.append(_normalize_workspace_edge(edge))
        else:
            normalized_edges.append(edge)

    return {**state, "edges": normalized_edges}
