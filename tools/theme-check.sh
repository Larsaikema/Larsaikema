#!/usr/bin/env bash
# Shopify theme validation, offline: Shopify's own theme-check (the engine of `shopify theme check`, recommended config)
# plus the extra upload checks in tools/theme-check/extra.rb (strict Liquid parse, schema names <= 25 characters).
# Usage: tools/theme-check.sh [theme dir] [--json]     exit 1 on any error (theme-check severity error, or an extra check)
# First run builds theme-check from GitHub sources into $SCRATCH/vendor/tc-build (tools/theme-check/build.mjs, ~10 s).
set -uo pipefail
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export SCRATCH="${SCRATCH:-/tmp/claude-0/-home-user-Larsaikema/d03b1b71-234c-55f6-a22b-89a9ff74abc4/scratchpad}"
THEME="${1:-$REPO/theme}"
[[ "$THEME" == --* ]] && THEME="$REPO/theme"
BUILD="$SCRATCH/vendor/tc-build"
if [[ ! -f "$BUILD/run.cjs" || "$REPO/tools/theme-check/build.mjs" -nt "$BUILD/run.cjs" || "$REPO/tools/theme-check/run.cjs" -nt "$BUILD/run.cjs" ]]; then
  node "$REPO/tools/theme-check/build.mjs" || exit 2
fi
echo "== Shopify theme-check ($(head -1 "$BUILD/SOURCES.txt" 2>/dev/null))"
node "$BUILD/run.cjs" "$THEME" "${@:2}"
tc=$?
echo "== extra upload checks"
ruby "$REPO/tools/theme-check/extra.rb" "$THEME"
ex=$?
if [[ $tc -ne 0 || $ex -ne 0 ]]; then echo "RESULT: FAIL"; exit 1; fi
echo "RESULT: PASS"
