#!/usr/bin/env bash
set -euo pipefail

# The registry depends on build_data output.
if [ ! -f build/country_seed.json ]; then
  echo "Missing build/country_seed.json"
  echo "Run your build_data step first."
  exit 1
fi

node scripts/06_build_registry.mjs