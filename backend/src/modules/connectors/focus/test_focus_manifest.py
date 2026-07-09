# keel_api/src/modules/connectors/focus/test_focus_manifest.py

"""Unit tests for Focus connector manifest and tool registry."""

from __future__ import annotations

from modules.connectors.focus.manifest import (
    FOCUS_CONNECTOR_TOOL_NAMES,
    FOCUS_CONNECTOR_TOOLS,
    build_focus_manifest,
    get_tool_definition,
)
from modules.connectors.focus.service import TOOL_HANDLERS


def test_manifest_lists_all_registered_tools() -> None:
    manifest = build_focus_manifest()
    manifest_names = {tool["name"] for tool in manifest["tools"]}
    assert manifest_names == FOCUS_CONNECTOR_TOOL_NAMES
    assert manifest_names == set(TOOL_HANDLERS.keys())


def test_each_tool_has_scope_and_schema() -> None:
    for tool in FOCUS_CONNECTOR_TOOLS:
        assert tool["name"]
        assert tool["scope"]
        assert "mutates" in tool
        assert tool["parameters"]["type"] == "object"


def test_get_tool_definition_lookup() -> None:
    tool = get_tool_definition("get_focus_node")
    assert tool is not None
    assert tool["name"] == "get_focus_node"
    assert get_tool_definition("missing_tool") is None
