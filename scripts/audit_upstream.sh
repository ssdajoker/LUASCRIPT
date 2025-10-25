#!/usr/bin/env bash
set -euo pipefail

# Clone upstream into ../luascript_upstream and run Phase‑A audit writing to audit_upstream/

UPSTREAM_URL="${LUASCRIPT_GH_URL:-https://github.com/ssdajoker/LUASCRIPT.git}"

ROOT_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
UP_DIR="$(dirname "$ROOT_DIR")"
TARGET_DIR="$UP_DIR/luascript_upstream"

echo "== Upstream: cloning $UPSTREAM_URL -> $TARGET_DIR =="
rm -rf "$TARGET_DIR"
git clone "$UPSTREAM_URL" "$TARGET_DIR"

# Copy local audit tooling into upstream repo (tooling-only)
echo "== Upstream: syncing local audit tooling =="
rsync -a --delete "$ROOT_DIR/audit/" "$TARGET_DIR/audit/"

cd "$TARGET_DIR"

# Prepare upstream audit folder and script
mkdir -p audit_upstream
cp audit/run_all.sh audit/run_all_upstream.sh
sed -i "s|AUDIT_DIR=\"\$ROOT_DIR/audit\"|AUDIT_DIR=\"\$ROOT_DIR/audit_upstream\"|" audit/run_all_upstream.sh
chmod +x audit/run_all_upstream.sh

echo "== Upstream: running Phase‑A audit =="
export AUDIT_DIR="$TARGET_DIR/audit_upstream"
bash audit/run_all_upstream.sh

echo "== Upstream audit complete: $TARGET_DIR/audit_upstream =="
