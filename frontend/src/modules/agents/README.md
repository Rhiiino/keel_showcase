# Agents

Browse and edit Keel orchestrator and sub-agents — prompts, tools, models, and context usage.

## Purpose

The agents module is the admin surface for Keel’s agent catalog. Users inspect orchestrator and sub-agent tiles, edit system prompts and tool category assignments, configure per-agent LLM overrides, and view context token estimates. Agents can be launched into chat from here.

## Module type

**Feature** — routes, nav, and API.

## Routes and navigation

| Path | Page | Notes |
|------|------|-------|
| `/agents` | `AgentsPage` | Catalog + detail editor |

**Nav:** registered — id `agents`, title Agents, href `/agents`, accent lime.

**Registered in:** `manifest.ts` → [`app/modules/registry.ts`](../../app/modules/registry.ts).

**Auth:** shell route inside `RequireAuth` → `AppShell`.

## Backend integration

| Endpoints | Purpose |
|-----------|---------|
| `GET /agents` | List catalog |
| `GET/PATCH /agents/:id` | Agent detail |
| `GET/PATCH /agents/:id/system-prompt` | System prompt |
| `GET /agents/:id/context-usage` | Token estimate |
| `GET/PATCH/DELETE /agents/:id/preferences` | Per-agent prefs |

**Backend counterpart:** `keel_api/src/modules/agents/`

## Directory structure

```
agents/
├── api.ts
├── navItem.tsx
├── routes.tsx
├── components/     # Catalog tiles, editor panels, model viewer, tool category editor
├── context/        # AgentEditorContext — shared editor state
├── hooks/          # useAgentEditor, useAgentContextUsage
├── lib/            # agentDisplay helpers
└── pages/          # AgentsPage
```

## Key concepts

- **Orchestrator vs sub-agents** — catalog distinguishes Keel orchestrator from configurable sub-agents.
- **Editor context** — `AgentEditorContext` coordinates detail panel, dirty state, and save actions.
- **3D model viewer** — optional STL preview for agent avatars (shared stl-viewer).

## Dependencies

- **catalog** — providers, models, tool categories
- **chat** — model select, preferences patterns, start-chat navigation
- Consumed by **auth** (login decorative model), **settings** (EditableText), **chat** (avatars, rules)

## Maintenance guidelines

- Editor state belongs in `context/` and `hooks/`; display helpers in `lib/`.
- Update this README when adding agent fields or editor sections; update [PROJECT_TREE.md](../../PROJECT_TREE.md) for new files.

## Related documentation

- [Modules umbrella README](../README.md)
- [PROJECT_TREE.md](../../PROJECT_TREE.md)
- Backend: `keel_api/src/modules/agents/`

## Module changelog

- **2026-06-15** — Initial module manifest.
