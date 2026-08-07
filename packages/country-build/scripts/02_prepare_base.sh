#!/usr/bin/env bash
set -euo pipefail

mkdir -p build

./tools/tippecanoe-decode -c -l geolines upstream/maplibre.mbtiles 0 0 0 > build/base_geolines_z0.geojson
./tools/tippecanoe-decode -c -l centroids upstream/maplibre.mbtiles 0 0 0 > build/base_centroids_z0.geojson

bash scripts/02b_dump_base_country_tiles.sh
node scripts/02c_merge_base_countries.mjs
