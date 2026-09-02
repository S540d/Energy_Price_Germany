#!/usr/bin/env bash
#
# Gemeinsamer Energy-Charts-Fetch für alle Länder (Issue #435).
#
# Aufruf:  scripts/fetch-energy-charts.sh <country-code> <output-dir>
# Beispiel: scripts/fetch-energy-charts.sh de public/data
#           scripts/fetch-energy-charts.sh nl public/data/nl
#
# Schreibt <output-dir>/price_raw.json und <output-dir>/renewable_raw.json –
# exakt die Dateinamen, die die nachgelagerten `node -e`-Process-Steps in
# .github/workflows/fetch.yml erwarten.
#
# Semantik (Konvention aus #418, hier unverändert):
#   - price               → required.  Fehlschlag = Exit 1, kein `success=true`.
#   - ren_share_forecast  → non-fatal. Fehlschlag = Datei wird gelöscht,
#                           Exit bleibt 0, der Preis-Pfad läuft weiter.
#
# WARNUNG: Die Retry-Logik gehört an genau diese eine Stelle. Sie war vor #435
# als `CURL_OPTS` siebenfach in die Länder-Blöcke dupliziert – bitte nicht
# dorthin zurückziehen.
#
set -euo pipefail

usage() {
  echo "usage: $0 <country-code> <output-dir>" >&2
  exit 2
}

[ "$#" -eq 2 ] || usage
COUNTRY="$1"
OUT_DIR="$2"
[ -n "$COUNTRY" ] && [ -n "$OUT_DIR" ] || usage

# Basis-URL ist überschreibbar, damit sich die Fehlerpfade (429, leere Arrays,
# 500) lokal gegen einen `python3 -m http.server` provozieren lassen.
API_BASE="${ENERGY_CHARTS_API_BASE:-https://api.energy-charts.info}"
MAX_ATTEMPTS="${FETCH_MAX_ATTEMPTS:-3}"
# Exponentielles Backoff statt des früheren fixen `--retry-delay 5`: gegen ein
# Rate-Limit, das typischerweise minutenlang hält, laufen drei 5-s-Versuche
# wirkungslos ins Leere (beobachtet am 2026-09-02, HTTP 429 auf ren_share_forecast).
# shellcheck disable=SC2206  # bewusstes Word-Splitting der Override-Variable
BACKOFF_DELAYS=(${FETCH_BACKOFF_DELAYS:-5 15 45})
# Obergrenze für einen vom Server vorgegebenen Retry-After-Wert. Schützt davor,
# dass ein grosszuegiger Header den Job bis ins Timeout blockiert.
RETRY_AFTER_CAP="${FETCH_RETRY_AFTER_CAP:-60}"

if ! command -v jq >/dev/null 2>&1; then
  echo "::error::jq wird für die Payload-Validierung benötigt, ist aber nicht installiert." >&2
  exit 1
fi

mkdir -p "$OUT_DIR"

HEADER_FILE="$(mktemp)"
cleanup() { rm -f "$HEADER_FILE"; }
trap cleanup EXIT

# Diagnose-Zeilen, die am Ende nach $GITHUB_STEP_SUMMARY gehen.
DIAG_LINES=()

# fetch_with_backoff <url> <dest> <jq-filter> <label>
#
# Erfolgreich (Exit 0) nur, wenn HTTP 2xx UND die Payload den jq-Filter erfüllt.
# Das deckt den stummen Ausfall ab, bei dem der Endpunkt HTTP 200 mit leeren
# Arrays liefert: `curl -f` meldete dafür Erfolg, der Guard im Process-Step
# griff nicht (`[]` ist truthy) und alle Werte wurden still zu `null`.
#
# Setzt LAST_HTTP_CODE, LAST_ATTEMPTS und LAST_FAIL_REASON für die Diagnose.
fetch_with_backoff() {
  local url="$1" dest="$2" filter="$3" label="$4"
  local attempt=1
  local http_code curl_exit retryable reason wait_s retry_after

  LAST_HTTP_CODE="-"
  LAST_ATTEMPTS=0
  LAST_FAIL_REASON=""

  while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
    LAST_ATTEMPTS="$attempt"
    : > "$HEADER_FILE"

    set +e
    http_code="$(curl -sS --connect-timeout 15 --max-time 60 \
      -o "$dest" -D "$HEADER_FILE" -w '%{http_code}' "$url")"
    curl_exit=$?
    set -e

    [[ "$http_code" =~ ^[0-9]+$ ]] || http_code=0
    LAST_HTTP_CODE="$http_code"

    if [ "$curl_exit" -ne 0 ]; then
      # Transiente Transportfehler:
      #   7  couldn't connect      28 operation timeout
      #   35 TLS handshake         52 empty reply from server
      #   55 send failure          56 recv failure / CONNECT tunnel failed
      # 7 und 28 sind der bekannte Connect-Hang gegen api.energy-charts.info auf
      # frischen Runnern. 35/52/55/56 sind hier bewusst ergaenzt: vorher galt
      # `--retry-all-errors`, das *jeden* Fehler wiederholte – eine Liste aus nur
      # 7 und 28 waere gegenueber dem Ist-Stand eine stille Regression.
      # Alles andere (z. B. 6 DNS, 3 URL-Fehler) ist ein Konfigurationsfehler,
      # den ein Retry nicht heilt – der bricht absichtlich sofort ab.
      case "$curl_exit" in
        7 | 28 | 35 | 52 | 55 | 56) retryable=1 ;;
        *) retryable=0 ;;
      esac
      reason="curl exit ${curl_exit}"
    elif [ "$http_code" -eq 429 ] || [ "$http_code" -ge 500 ]; then
      retryable=1
      reason="HTTP ${http_code}"
    elif [ "$http_code" -ge 400 ]; then
      retryable=0
      reason="HTTP ${http_code}"
    elif jq -e "$filter" "$dest" >/dev/null 2>&1; then
      echo "  ${label}: HTTP ${http_code}, valide (Versuch ${attempt}/${MAX_ATTEMPTS})"
      return 0
    else
      # HTTP 200, aber leere/unbrauchbare Payload. Erfahrungsgemaess erholt sich
      # der Endpunkt, deshalb retry-wuerdig.
      retryable=1
      reason="HTTP ${http_code}, Payload-Validierung fehlgeschlagen"
    fi

    LAST_FAIL_REASON="$reason"
    echo "  ${label}: Versuch ${attempt}/${MAX_ATTEMPTS} fehlgeschlagen (${reason})" >&2

    if [ "$retryable" -ne 1 ] || [ "$attempt" -ge "$MAX_ATTEMPTS" ]; then
      break
    fi

    wait_s="${BACKOFF_DELAYS[$((attempt - 1))]:-${BACKOFF_DELAYS[-1]}}"

    # Retry-After respektieren – das ist der eigentliche Fix für den 429-Fall.
    if [ "$http_code" -eq 429 ] || [ "$http_code" -eq 503 ]; then
      retry_after="$(grep -i '^retry-after:' "$HEADER_FILE" | tail -1 |
        tr -d '\r' | awk '{print $2}')"
      # Nur die Delta-Sekunden-Form wird ausgewertet; die HTTP-Date-Form ist
      # bei diesem Endpunkt nicht beobachtet worden und faellt aufs Backoff zurueck.
      if [[ "$retry_after" =~ ^[0-9]+$ ]]; then
        wait_s="$retry_after"
        if [ "$wait_s" -gt "$RETRY_AFTER_CAP" ]; then
          wait_s="$RETRY_AFTER_CAP"
          echo "  ${label}: Retry-After ${retry_after}s auf ${RETRY_AFTER_CAP}s gedeckelt" >&2
        else
          echo "  ${label}: Retry-After ${retry_after}s wird respektiert" >&2
        fi
      fi
    fi

    echo "  ${label}: warte ${wait_s}s vor dem naechsten Versuch" >&2
    sleep "$wait_s"
    attempt=$((attempt + 1))
  done

  # Datei loeschen, damit der `fs.existsSync(...)`-Guard im Process-Step greift,
  # statt stillschweigend null-Werte zu schreiben.
  rm -f "$dest"
  return 1
}

# jq-Ausdruck robust auswerten (fehlende/kaputte Datei → 0).
count_points() {
  local file="$1" field="$2"
  if [ -f "$file" ]; then
    jq -r "(.${field} // []) | length" "$file" 2>/dev/null || echo 0
  else
    echo 0
  fi
}

PRICE_FILE="${OUT_DIR}/price_raw.json"
RENEWABLE_FILE="${OUT_DIR}/renewable_raw.json"
PRICE_FILTER='(.unix_seconds | length) > 0 and (.price | length) > 0'
RENEWABLE_FILTER='(.unix_seconds | length) > 0 and (.ren_share | length) > 0'

echo "Energy Charts fetch: ${COUNTRY} → ${OUT_DIR}"

# ── Renewable share forecast (non-fatal) ────────────────────────────────────
renewable_ok=0
if fetch_with_backoff \
  "${API_BASE}/ren_share_forecast?country=${COUNTRY}" \
  "$RENEWABLE_FILE" "$RENEWABLE_FILTER" "ren_share_forecast"; then
  renewable_ok=1
  DIAG_LINES+=("- \`ren_share_forecast\`: HTTP ${LAST_HTTP_CODE}, ${LAST_ATTEMPTS} Versuch(e), $(count_points "$RENEWABLE_FILE" ren_share) Punkte")
else
  echo "::warning::${COUNTRY}: ren_share_forecast nicht verfuegbar (${LAST_FAIL_REASON}) – Preise bleiben nutzbar."
  DIAG_LINES+=("- \`ren_share_forecast\`: **fehlgeschlagen** nach ${LAST_ATTEMPTS} Versuch(en) (${LAST_FAIL_REASON}) – Renewable points: 0")
fi

# ── Day-ahead prices (required) ─────────────────────────────────────────────
price_ok=0
if fetch_with_backoff \
  "${API_BASE}/price?country=${COUNTRY}" \
  "$PRICE_FILE" "$PRICE_FILTER" "price"; then
  price_ok=1
  DIAG_LINES+=("- \`price\`: HTTP ${LAST_HTTP_CODE}, ${LAST_ATTEMPTS} Versuch(e), $(count_points "$PRICE_FILE" price) Punkte")
else
  DIAG_LINES+=("- \`price\`: **fehlgeschlagen** nach ${LAST_ATTEMPTS} Versuch(en) (${LAST_FAIL_REASON})")
fi

# ── Diagnose ins Job-Summary ────────────────────────────────────────────────
if [ -n "${GITHUB_STEP_SUMMARY:-}" ]; then
  {
    echo "### Energy Charts – ${COUNTRY^^}"
    printf '%s\n' "${DIAG_LINES[@]}"
    echo ""
  } >> "$GITHUB_STEP_SUMMARY"
fi
printf '%s\n' "${DIAG_LINES[@]}"

if [ "$price_ok" -ne 1 ]; then
  echo "::error::${COUNTRY}: price-Endpunkt nicht verfuegbar – Block faellt auf den Fallback zurueck."
  exit 1
fi

if [ -n "${GITHUB_OUTPUT:-}" ]; then
  echo "success=true" >> "$GITHUB_OUTPUT"
fi

# renewable_ok fliesst bewusst nicht in den Exit-Code ein (#418-Konvention).
echo "Fertig: ${COUNTRY} (price ok, renewable $([ "$renewable_ok" -eq 1 ] && echo ok || echo fehlt))"
