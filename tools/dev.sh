#!/usr/bin/env bash
# Starts/stops the local Shopify preview servers.
#   :4100  ours    (theme/)
#   :4200  bar     (Shopify Horizon, scratch copy — never committed)
#   :4300  dawn    (Shopify Dawn, scratch copy — renderer regression testing)
# Usage: tools/dev.sh start|stop|status|restart [ours|bar|dawn]
# Env: PREVIEW_DATA (fixture json), PREVIEW_IMAGES (images dir), PREVIEW_BIND (default 127.0.0.1),
#      BAR_STOCK=1 serves Horizon without the merchant overlay (fresh-install look).
# The bar is "Horizon set up by a skilled merchant": tools/preview/bar/merchant_setup.py writes the Klapklaar
# theme-editor setup (brand, colours, fonts, home page, menus, PDP, cart drawer, nl copy) into
# $SCRATCH/bar/horizon-merchant (overlay, Horizon untouched).
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRATCH="${SCRATCH:-/tmp/claude-0/-home-user-Larsaikema/d03b1b71-234c-55f6-a22b-89a9ff74abc4/scratchpad}"
LOGS="$SCRATCH/logs"
mkdir -p "$LOGS"

if [[ -n "${PREVIEW_DATA:-}" ]]; then
  DATA="$PREVIEW_DATA"
elif [[ -f "$REPO/catalog/preview-data.json" ]]; then
  DATA="$REPO/catalog/preview-data.json"
else
  DATA="$REPO/tools/preview/fixtures/sample.json"
fi
BIND="${PREVIEW_BIND:-127.0.0.1}"

declare -A THEME=( [ours]="$REPO/theme" [bar]="$SCRATCH/bar/horizon" [dawn]="$SCRATCH/bar/dawn-stock" )
declare -A PORT=( [ours]=4100 [bar]=4200 [dawn]=4300 )
ALL=(ours bar dawn)

pidfile() { echo "$LOGS/preview-$1.pid"; }
logfile() { echo "$LOGS/preview-$1.log"; }

running() {
  local pf; pf="$(pidfile "$1")"
  [[ -f "$pf" ]] && kill -0 "$(cat "$pf")" 2>/dev/null
}

responding() {
  curl -s -o /dev/null -m 5 -w '%{http_code}' "http://127.0.0.1:${PORT[$1]}/cart.js" | grep -q '^200$'
}

start_one() {
  local n="$1"
  if running "$n"; then
    echo "$n: already running (pid $(cat "$(pidfile "$n")"), :${PORT[$n]})"
    return 0
  fi
  # free the port if a stray server holds it
  local stray; stray="$( (lsof -t -iTCP:"${PORT[$n]}" -sTCP:LISTEN 2>/dev/null || ss -ltnp 2>/dev/null | awk -v p=":${PORT[$n]}" '$4 ~ p"$"' | grep -o 'pid=[0-9]*' | cut -d= -f2) | head -1 || true)"
  if [[ -n "$stray" ]]; then kill "$stray" 2>/dev/null || true; sleep 0.5; fi
  local args=(--theme "${THEME[$n]}" --data "$DATA" --port "${PORT[$n]}" --bind "$BIND")
  [[ -n "${PREVIEW_IMAGES:-}" ]] && args+=(--images "$PREVIEW_IMAGES")
  if [[ "$n" == bar && "${BAR_STOCK:-0}" != 1 && -d "${THEME[bar]}" ]]; then
    local overlay="$SCRATCH/bar/horizon-merchant"
    local margs=(--horizon "${THEME[bar]}" --data "$DATA" --out "$overlay")
    [[ -n "${PREVIEW_IMAGES:-}" ]] && margs+=(--images "$PREVIEW_IMAGES")
    python3 "$REPO/tools/preview/bar/merchant_setup.py" "${margs[@]}" >>"$(logfile "$n")" 2>&1 \
      && args+=(--overlay "$overlay") \
      || echo "bar: merchant overlay failed (serving stock Horizon) — see $(logfile "$n")" >&2
  fi
  nohup ruby "$REPO/tools/preview/server.rb" "${args[@]}" >>"$(logfile "$n")" 2>&1 &
  echo $! >"$(pidfile "$n")"
  for _ in $(seq 1 40); do
    if responding "$n"; then
      echo "$n: started on http://127.0.0.1:${PORT[$n]} (pid $(cat "$(pidfile "$n")"), theme ${THEME[$n]}, data $DATA)"
      return 0
    fi
    sleep 0.25
  done
  echo "$n: FAILED to start — see $(logfile "$n")" >&2
  tail -20 "$(logfile "$n")" >&2 || true
  return 1
}

stop_one() {
  local n="$1" pf; pf="$(pidfile "$n")"
  if running "$n"; then
    kill "$(cat "$pf")" 2>/dev/null || true
    for _ in $(seq 1 20); do running "$n" || break; sleep 0.1; done
    running "$n" && kill -9 "$(cat "$pf")" 2>/dev/null || true
    echo "$n: stopped"
  else
    echo "$n: not running"
  fi
  rm -f "$pf"
}

status_one() {
  local n="$1"
  if running "$n"; then
    if responding "$n"; then echo "$n: up   :${PORT[$n]} pid $(cat "$(pidfile "$n")") theme ${THEME[$n]}$(ps -o args= -p "$(cat "$(pidfile "$n")")" | grep -o -- '--overlay [^ ]*' | sed 's/^/ /')";
    else echo "$n: pid alive but :${PORT[$n]} not responding (log: $(logfile "$n"))"; fi
  else
    echo "$n: down (:${PORT[$n]})"
  fi
}

cmd="${1:-status}"
shift || true
targets=("$@")
[[ ${#targets[@]} -eq 0 ]] && targets=("${ALL[@]}")

case "$cmd" in
  start) for t in "${targets[@]}"; do start_one "$t"; done ;;
  stop) for t in "${targets[@]}"; do stop_one "$t"; done ;;
  restart) for t in "${targets[@]}"; do stop_one "$t"; start_one "$t"; done ;;
  status) echo "data: $DATA"; for t in "${targets[@]}"; do status_one "$t"; done ;;
  *) echo "usage: $0 start|stop|status|restart [ours|bar|dawn]" >&2; exit 2 ;;
esac
