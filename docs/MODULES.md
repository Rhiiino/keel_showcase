# Included modules

Keel Showcase ships production feature modules with showcase-specific exclusions.

## Core and shell

| Module | Description |
|--------|-------------|
| **auth** | Enter-button login, session cookies, route guards (shared demo user) |
| **home** | Authenticated dashboard with configurable home cards |
| **settings** | Theme, page transitions, nav layout preferences |
| **deleted** | Recently deleted trash (Settings tab) |
| **catalog** | Shared intelligence catalog API (models, tools, agents) |

## AI

| Module | Description |
|--------|-------------|
| **chat** | Conversations with SSE streaming and tool orchestration |
| **agents** | Agent catalog and editor (**Keel orchestrator only**) |
| **intelligence** | Models and tools browser |

## Productivity

| Module | Description |
|--------|-------------|
| **projects** | Project tracker with kanban gallery and workspace canvas |
| **focus** | Tasks and lists with card hub and constellation graph |
| **media** | File library with Garage-backed storage |
| **jobs** | Background job runs and recurring schedules |

## Personal data modules

| Module | Description |
|--------|-------------|
| **finance** | Transactions, subscriptions, vendors, accounts |
| **people** | Contacts (CRM), figures, family tree |
| **timeline** | Life events and calendar views |
| **journal** | Dated journal entries and tags |
| **services** | External URL health monitoring |

## Creative

| Module | Description |
|--------|-------------|
| **games** | In-app games (Tower of Hanoi) |
| **coak** | 3D knowledge graph experiment |

## Excluded from showcase

| Item | Reason |
|------|--------|
| **dev** | Internal front-end sandbox |
| **email** | Requires separate Gmail OAuth |
| **Recall, Baysic, Haul agents** | Specialist agents removed; Keel orchestrator handles tools directly |
| **Google OAuth login** | Replaced by Enter button + shared demo session |
