#!/usr/bin/env bash
set -u
ENV_FILE="${ENV_FILE:-.env.local}"
[ -f "$ENV_FILE" ] && { set -a; . "./$ENV_FILE"; set +a; echo "→ wczytano $ENV_FILE"; }

MEDUSA="${NEXT_PUBLIC_MEDUSA_BACKEND_URL:?brak NEXT_PUBLIC_MEDUSA_BACKEND_URL}"
PK="${NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY:-}"
MEILI="${NEXT_PUBLIC_MEILISEARCH_HOST:?brak NEXT_PUBLIC_MEILISEARCH_HOST}"
MKEY="${NEXT_PUBLIC_MEILISEARCH_API_KEY:-}"
INDEX="products"
FULLPATH="hodowla-i-zootechnika/instalacje-udojowe-i-rurociagi"
LEAF="instalacje-udojowe-i-rurociagi"
PARENT="hodowla-i-zootechnika"
SITE="https://centrumrolnictwa.com/kategoria/${FULLPATH}"
FACETS_REAL='["Pasuje do marki","Producent","Kategoria","Typ produktu"]'
FMT='    TTFB %{time_starttransfer}s | total %{time_total}s | http %{http_code} | %{size_download}B\n'

run(){ local d="$1"; shift; echo "── $d"; curl -s -o /dev/null -w "  [1]$FMT" "$@"; curl -s -o /dev/null -w "  [2]$FMT" "$@"; echo; }

echo "MEDUSA=$MEDUSA"; echo "MEILI =$MEILI"; echo

run "MEILI facets:['*']  (obecny kod)" -X POST "$MEILI/indexes/$INDEX/search" -H "Authorization: Bearer $MKEY" -H "Content-Type: application/json" --data "{\"q\":\"\",\"filter\":\"category_handles = \\\"$LEAF\\\"\",\"facets\":[\"*\"],\"limit\":48}"
run "MEILI facets:REAL   (tylko pokazywane)" -X POST "$MEILI/indexes/$INDEX/search" -H "Authorization: Bearer $MKEY" -H "Content-Type: application/json" --data "{\"q\":\"\",\"filter\":\"category_handles = \\\"$LEAF\\\"\",\"facets\":$FACETS_REAL,\"limit\":48}"
run "MEILI bez facetów   (baseline)" -X POST "$MEILI/indexes/$INDEX/search" -H "Authorization: Bearer $MKEY" -H "Content-Type: application/json" --data "{\"q\":\"\",\"filter\":\"category_handles = \\\"$LEAF\\\"\",\"limit\":48}"
run "MEDUSA + include_descendants_tree=true" -g -G "$MEDUSA/store/product-categories" -H "x-publishable-api-key: $PK" --data-urlencode "handle=$FULLPATH" --data "include_descendants_tree=true"
run "MEDUSA bez drzewa (fields=*category_children)" -g -G "$MEDUSA/store/product-categories" -H "x-publishable-api-key: $PK" --data-urlencode "handle=$FULLPATH" --data-urlencode "fields=*category_children,metadata,name,handle,description"
run "MEDUSA breadcrumbs" -g -G "$MEDUSA/store/product-categories" -H "x-publishable-api-key: $PK" --data-urlencode "handle[]=$PARENT" --data-urlencode "handle[]=$LEAF"
run "NEXT dokument SSR" "$SITE?nocache=$RANDOM$RANDOM"
