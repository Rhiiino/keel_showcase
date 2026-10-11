#!/usr/bin/env bash
# Recompress catalog agent turntable GLBs for fast web loading.
#
# Requires Node.js. Installs @gltf-transform/cli into a temp dir if needed.
# Writes meshopt-compressed, simplified models in place under assets/catalog/agents.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AGENTS_DIR="$ROOT/assets/catalog/agents"
WORK_DIR="${TMPDIR:-/tmp}/keel-agent-glb-optimize"
GT="$WORK_DIR/node_modules/.bin/gltf-transform"

mkdir -p "$WORK_DIR"
if [[ ! -x "$GT" ]]; then
  echo "Installing @gltf-transform/cli into $WORK_DIR …"
  (cd "$WORK_DIR" && npm install --no-save @gltf-transform/cli@4.2.1 meshoptimizer)
fi

shopt -s nullglob
models=("$AGENTS_DIR"/*/model.glb)
if ((${#models[@]} == 0)); then
  echo "No agent GLBs found under $AGENTS_DIR" >&2
  exit 1
fi

for src in "${models[@]}"; do
  agent="$(basename "$(dirname "$src")")"
  tmp="$WORK_DIR/${agent}.glb"
  echo "=== optimizing $agent ==="
  "$GT" optimize "$src" "$tmp" \
    --simplify true \
    --simplify-ratio 0.12 \
    --simplify-error 0.001 \
    --compress false \
    --texture-compress false \
    --texture-size 1024 \
    --join false \
    --palette false
  # Drop KHR_mesh_quantization so the browser needs no extensions/WASM decoders.
  "$GT" dequantize "$tmp" "$tmp"
  cp -f "$tmp" "$src"
  ls -lh "$src"
done

echo "Done. Bump catalog_media.updated_at for model_3d rows so ?v= cache-busts:"
echo "  UPDATE catalog_media SET updated_at = NOW() WHERE media_kind = 'model_3d';"
