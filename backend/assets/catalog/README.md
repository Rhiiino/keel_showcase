# Catalog media assets

Committed app assets for the global intelligence catalog (agents, tool categories, providers).

## Layout

- `agents/{agent_key}/image.png` — tile/avatar portrait
- `agents/{agent_key}/model.glb` — optional 3D turntable preview (Keel and sub-agents)
- `providers/{provider_key}/image.png` — provider logo (`.jpg` for moonshot)
- `tool_categories/{category_key}/image.png` — category icon

Rows in `catalog_media` reference paths relative to this directory (`storage_key`).

Served read-only at `GET /catalog/media/{storage_key}`.
