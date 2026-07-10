#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
destination=$(mktemp -d)
trap 'rm -rf "$destination"' EXIT

hugo --minify --gc --destination "$destination"
node "$repo_root/scripts/audit.mjs" "$destination" "$repo_root"
