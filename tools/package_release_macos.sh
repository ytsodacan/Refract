#!/usr/bin/env bash
# Packages the macOS launcher-only build as dist/Refract-<version>-macos-<arch>.tar.gz.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="$ROOT/dist"
SKIP_BUILD=0
while [[ $# -gt 0 ]]; do
    case "$1" in
        --skip-build) SKIP_BUILD=1 ;;
        --out) OUT="$2"; shift ;;
        *) echo "usage: $0 [--skip-build] [--out DIR]" >&2; exit 2 ;;
    esac
    shift
done
VERSION="$(node -p "require('$ROOT/launcher/src-tauri/tauri.conf.json').version")"
ARCH="$(uname -m)"; [[ "$ARCH" == "x86_64" ]] && ARCH="x64"; [[ "$ARCH" == "arm64" ]] && ARCH="arm64"
NAME="Refract-$VERSION-macos-$ARCH"
STAGE="$OUT/$NAME"
LAUNCHER_TARGET="${CARGO_TARGET_DIR:-$ROOT/build-launcher-package}"

if [[ $SKIP_BUILD == 0 ]]; then
    echo "Building the launcher"
    (cd "$ROOT/launcher" && npm ci --no-audit --no-fund && CARGO_TARGET_DIR="$LAUNCHER_TARGET" npm run tauri -- build --no-bundle)
fi

echo "Staging $STAGE"
rm -rf "$STAGE"
mkdir -p "$STAGE"
add() {
    local source="$1" target="${2:-$1}"
    [[ -e "$ROOT/$source" ]] || { echo "Missing $source. Build it first." >&2; exit 1; }
    mkdir -p "$(dirname "$STAGE/$target")"
    cp -a "$ROOT/$source" "$STAGE/$target"
}

cp "$LAUNCHER_TARGET/release/refract-launcher" "$STAGE/Refract"
for file in "$ROOT"/launcher/backend/*.mjs "$ROOT"/launcher/core/*.mjs; do add "${file#"$ROOT/"}"; done
add launcher/inspect_apk.py
add launcher/package.json
add scripts/owned_games.example.txt
add tools/android_app_label.py
add LICENSE
add CREDITS.md
add docs/macos_launcher.md

NODE="$(command -v node)"
mkdir -p "$STAGE/node"
if [[ "$(uname)" == "Darwin" ]] && otool -L "$NODE" | tail -n +2 | awk '{print $1}' | grep -qvE '^(/usr/lib/|/System/)'; then
    echo "$NODE links against non-system libraries (Homebrew build?). Use the static nodejs.org binary." >&2; exit 1
fi
cp "$NODE" "$STAGE/node/node"
curl -fsSL "https://raw.githubusercontent.com/nodejs/node/$(node --version)/LICENSE" -o "$STAGE/node/LICENSE"

cp "$ROOT/tools/package_readme_macos.txt" "$STAGE/README.txt"

echo "Packing $OUT/$NAME.tar.gz"
mkdir -p "$OUT"
COPYFILE_DISABLE=1 tar -C "$OUT" -czf "$OUT/$NAME.tar.gz" "$NAME"
echo "Done: $OUT/$NAME.tar.gz ($(du -m "$OUT/$NAME.tar.gz" | cut -f1) MB)"
