#!/usr/bin/env bash
# Builds macOS host-side binaries for launcher development (host bridge + viewer).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cmake -S "$ROOT" -B "$ROOT/build-macos" -G Ninja -DCMAKE_BUILD_TYPE=Release \
  -DREFRACT_BUILD_GPU_LAYER=OFF -DREFRACT_BUILD_TESTS=ON
cmake --build "$ROOT/build-macos"
ctest --test-dir "$ROOT/build-macos" --output-on-failure
