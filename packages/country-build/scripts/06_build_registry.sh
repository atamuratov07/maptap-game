#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="dist"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --out-dir)
      OUT_DIR="$2"
      shift 2
      ;;
    --out-dir=*)
      OUT_DIR="${1#*=}"
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

# The registry depends on build_data output.
if [ ! -f build/country_seed.json ]; then
  echo "Missing build/country_seed.json"
  echo "Run your build_data step first."
  exit 1
fi

node scripts/06_build_registry.mjs --out-dir "$OUT_DIR"
