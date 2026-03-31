#!/usr/bin/env bash
set -euo pipefail
HOST_DIR="$(cygpath -w "$PWD")"

mkdir -p build/tmp_base_country_tiles
rm -f build/tmp_base_country_tiles/*.geojson

MSYS2_ARG_CONV_EXCL='*' docker run --rm \
  -v "$HOST_DIR:/work" \
  -w /work \
  tippecanoe:latest \
  sh -lc '
    mkdir -p build/tmp_base_country_tiles

    tippecanoe-enumerate upstream/maplibre.mbtiles |
    while read -r file z x y; do
      [ "$z" = "6" ] || continue
      tippecanoe-decode -c -l countries "$file" "$z" "$x" "$y" > "build/tmp_base_country_tiles/${z}_${x}_${y}.geojson" || true
    done
  '