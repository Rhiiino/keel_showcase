# Focus Connector Guide

Instructions for an external LLM operating on Focus through the connector API.

## Connection details

Fill in these values before giving this document to the external LLM.

API root domain:

Session key (bearer token):

Authorization header for all tool calls:

```http
Authorization: Bearer <session-key>
```

The session key is the **only** credential required for connector tool calls. No other login, cookie, or API key is needed.

Tool invoke URL pattern:

```text
{API root domain}/connectors/focus/tools/{tool_name}/invoke
```

Manifest URL:

```text
{API root domain}/connectors/focus/manifest
```

## What is Focus

Focus is a personal productivity system organized as a graph of **nodes**.

- Nodes can represent tasks, containers, and linked external records
- Nodes can have parent/child relationships, forming trees and nested structures
- Nodes carry properties such as title, notes, status, ordering, colors, and tags

### Node kinds

- `item` — a task or actionable entry
- `list` — a container that holds other nodes
- `record` — a node linked to an external record reference

### Relationships and structure

- `parent_id` defines which container a node lives under
- Sibling order is controlled by `sort_order` and `work_order`
- Tags label nodes across the graph
- Record nodes point at external entities via `reference_target_type` and `reference_target_id`

### How to think about edits

- Read the graph before mutating it
- Make small, explicit changes to specific nodes
- Preserve existing notes and properties unless asked to replace them
- Use returned node ids for follow-up operations
- Never invent node ids, tag ids, or reference ids

## Tool invocation

Send a `POST` request to the tool invoke URL with the authorization header above.

Request body:

```json
{
  "arguments": {},
  "idempotency_key": "optional-key",
  "dry_run": false
}
```

Response body:

```json
{
  "tool_name": "get_focus_node",
  "call_id": "generated-id",
  "duration_ms": 42,
  "dry_run": false,
  "result": {},
  "changed_node_ids": [],
  "should_refetch_focus": false
}
```

## Available tools

- `list_focus_nodes`
- `get_focus_node`
- `create_focus_node`
- `update_focus_node`
- `delete_focus_node`
- `complete_focus_node`
- `reorder_focus_nodes`
- `list_focus_tags`
- `create_focus_tag`
- `update_focus_tag`
- `delete_focus_tag`
- `search_focus_references`
- `get_focus_reference_detail`
- `highlight_focus_nodes` — highlight multiple nodes on the user's canvas and frame them in view
- `set_focus_constellation_node_expanded` — fold (`expanded: false`) or unfold (`expanded: true`) one node
- `get_focus_constellation_layout` — read visible canvas nodes, edges, and stored positions
- `align_focus_constellation_children` — evenly redistribute one container's children on the canvas
- `place_focus_constellation_node` — move one node using semantic placement relative to its parent

The live manifest at the manifest URL is the source of truth for tool JSON schemas and the domain prompt.

## Canvas control tools

Use these when the user asks to see, show, or highlight nodes on their constellation view:

- `highlight_focus_nodes` with `{ "node_ids": [1, 5, 9] }` — validates the nodes, highlights them in purple, and zooms the canvas to fit all of them
- `set_focus_constellation_node_expanded` with `{ "node_id": 12, "expanded": true }` — unfolds a container node so its children appear
- `set_focus_constellation_node_expanded` with `{ "node_id": 12, "expanded": false }` — folds a container node and hides its expanded descendants

These visibility tools do not change Focus node data. They control the live constellation canvas while the user's LLM session is active.

## Constellation layout tools

Tree edits (`create_focus_node`, `parent_id`) do not directly set canvas coordinates. New nodes get automatic edge-aware placement on the frontend. Use layout tools when the user asks for a specific arrangement:

- `get_focus_constellation_layout` with `{}` — returns visible nodes (`node_id`, `title`, `parent_id`, `position_key`, `x`, `y`), visible edges, and `expanded_ids`
- `align_focus_constellation_children` with `{ "parent_id": 12 }` — redistributes that container's children evenly around it (same effect as the canvas context-menu align action)
- `place_focus_constellation_node` with semantic placement, for example:

```json
{
  "node_id": 42,
  "placement": { "mode": "away_from_grandparent" }
}
```

```json
{
  "node_id": 42,
  "placement": { "mode": "relative_to_parent", "angle_degrees": 135, "distance": "default" }
}
```

Placement modes:

- `away_from_grandparent` — fan the node outward, away from the line back to the grandparent (use when a child sits on a parent connection)
- `relative_to_parent` — place at `angle_degrees` from the parent center (`0` = east, `90` = south); `distance` is `"default"` or a positive pixel radius

Recommended workflow when adding a child:

1. `set_focus_constellation_node_expanded` on the parent (`expanded: true`)
2. `create_focus_node` with the desired `parent_id`
3. If spacing is uneven or the user asked for explicit placement, call `align_focus_constellation_children` or `place_focus_constellation_node`

User preference: nodes must not overlap connection lines. Automatic placement enforces this by default.

## Safety rules

- Read before writing
- Never invent ids
- Preserve existing notes and properties unless explicitly replacing them
- Avoid destructive operations unless explicitly requested
- Use list, get, or search tools before update or delete operations

## Example workflow

1. Confirm the API root domain and session key are filled in above
2. `POST .../tools/list_focus_nodes/invoke` with `{}` arguments
3. `POST .../tools/get_focus_node/invoke` with `{ "node_id": 42 }`
4. `POST .../tools/update_focus_node/invoke` with the smallest required patch

## Error handling

- `401` — missing, invalid, expired, or revoked session key
- `403` — missing required scope
- `404` — unknown tool or Focus record
- `400` — invalid tool arguments or Focus validation failure

