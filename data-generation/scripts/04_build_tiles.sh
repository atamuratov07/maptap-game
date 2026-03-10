#!/usr/bin/env bash
set -euo pipefail

rm -f \
  build/base_geolines_patched.mbtiles \
  build/base_attrs_patched.mbtiles \
  build/base_core.mbtiles \
  build/centroids.mbtiles \
  build/capitals.mbtiles \
  build/countries_extra.mbtiles \
  build/world_complete.mbtiles

rm -rf dist/tiles

# 1) Patch original geolines with name_ru
./tools/tile-join -f -o build/base_geolines_patched.mbtiles \
  -c build/geolines_join.csv \
  upstream/maplibre.mbtiles

# 2) Patch original countries with added attributes
./tools/tile-join -f -o build/base_attrs_patched.mbtiles \
  -c build/join_adm0.csv \
  build/base_geolines_patched.mbtiles

# 3) Keep only countries + geolines from the patched base
./tools/tile-join -f -o build/base_core.mbtiles \
  -l countries -l geolines \
  build/base_attrs_patched.mbtiles

# 4) Build rebuilt centroids
./tools/tippecanoe -f -o build/centroids.mbtiles \
  -l centroids -Z0 -z6 -r1 -pf -pk \
  build/centroids.geojson

# 5) Build capitals
./tools/tippecanoe -f -o build/capitals.mbtiles \
  -l capitals -Z0 -z6 -r1 -pf -pk \
  build/capitals.geojson

# 6) Optional: build supplemental countries only if needed
SUPP_COUNT=$(node -e "const fs=require('fs');const fc=JSON.parse(fs.readFileSync('build/supplemental_countries.geojson','utf8'));process.stdout.write(String((fc.features||[]).length));")

if [ "$SUPP_COUNT" -gt 0 ]; then
  ./tools/tippecanoe -f -o build/countries_extra.mbtiles \
    -l countries -Z0 -z6 -pf -pk \
    build/supplemental_countries.geojson

  ./tools/tile-join -f -o build/world_complete.mbtiles \
    build/base_core.mbtiles \
    build/centroids.mbtiles \
    build/capitals.mbtiles \
    build/countries_extra.mbtiles
else
  ./tools/tile-join -f -o build/world_complete.mbtiles \
    build/base_core.mbtiles \
    build/centroids.mbtiles \
    build/capitals.mbtiles
fi

# 7) Export static pbf directory
./tools/tile-join -f -e dist/tiles build/world_complete.mbtiles

# 8) Generate tiles.json file
node scripts/05_make_tilesjson.mjs
