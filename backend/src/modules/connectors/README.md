# Focus AI Connector

External intelligence connector for Keel Focus. External LLMs invoke Focus tools through `/connectors/focus/*` while reusing the existing Focus service layer.

## Purpose

The connectors module exposes adapter APIs for outside intelligence such as Codex or ChatGPT. The Focus connector lets an external LLM list, inspect, create, update, and delete Focus nodes and tags through a documented tool-invocation contract.

This module is separate from normal app routes under `/focus/*` and separate from future in-app subagent automation. The frontend should treat emitted events as **Focus automation**, not connector-specific UI.

## Module type

**Infrastructure** — external adapter layer with ephemeral in-memory sessions, bearer-token auth, and SSE event scaffolding.

## HTTP API

**Prefix:** `/connectors/focus`  
**Registered in:** `keel_api/src/main.py` → `connectors_router`

| Area | Endpoints | Auth |
|------|-----------|------|
| Manifest | `GET /connectors/focus/manifest` | None |
| Guide | `GET /connectors/focus/guide` | None |
| Sessions | `POST /connectors/focus/sessions` | Session cookie |
| Sessions | `GET /connectors/focus/sessions/current` | Session cookie |
| Sessions | `DELETE /connectors/focus/sessions/current` | Session cookie |
| Events | `GET /connectors/focus/events` | Session cookie (SSE) |
| Tools | `POST /connectors/focus/tools/{tool_name}/invoke` | Bearer token |

## Directory structure

```
connectors/
├── __init__.py
├── config.py
├── router.py
├── auth.py
├── realtime.py
├── schemas.py
├── service.py
├── test_connectors_auth.py
└── focus/
    ├── __init__.py
    ├── config.py
    ├── router.py
    ├── service.py
    ├── manifest.py
    ├── events.py
    ├── prompt.py
    └── test_focus_manifest.py
```

## Layer responsibilities

| Layer | Responsibility |
|-------|----------------|
| `auth.py` | Ephemeral in-memory connector sessions and bearer-token validation |
| `realtime.py` | SSE broadcaster for Focus automation events |
| `focus/manifest.py` | Tool definitions and runtime manifest |
| `focus/service.py` | Tool invocation adapters over `modules.focus.service` |
| `focus/events.py` | Focus automation event builders |
| `focus/router.py` | Focus connector HTTP routes |

## LLM integration

This module is the external counterpart to internal native Focus tools under `llm/tools/native/focus/`. Future in-app subagents should reuse the same automation event envelope while using native agent/tool-category integration instead of these connector routes.

## Dependencies

- **modules.focus.service** — all Focus CRUD and reference operations
- **modules.auth** — session cookie auth for session creation and SSE
- **core/** — settings, errors

## Related documentation

- [Modules umbrella README](../README.md)
- [PROJECT_TREE.md](../../PROJECT_TREE.md)
- [docs/connectors/focus-ai-connector.md](../../../docs/connectors/focus-ai-connector.md)
- [keel_api/docs/connectors/focus-ai-connector.md](../../../docs/connectors/focus-ai-connector.md)
- [FOCUS_AI_CONNECTOR_HANDOFF.md](../../../FOCUS_AI_CONNECTOR_HANDOFF.md)

## Module changelog

- **2026-06-18** — Added `GET /connectors/focus/guide` and canonical LLM guide at `docs/connectors/focus-ai-connector.md`.
- **2026-06-18** — Initial Focus external connector with ephemeral sessions, tool manifest, invocation API, and SSE automation scaffolding.
- **2026-06-19** — Added constellation layout tools (`get_focus_constellation_layout`, `align_focus_constellation_children`, `place_focus_constellation_node`) and matching SSE events.
