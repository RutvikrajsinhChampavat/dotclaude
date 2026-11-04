#!/usr/bin/env bash
# Prints a git tree id for the repo's full working state (tracked + untracked, .gitignore honoured) without touching the real index.
set -euo pipefail

cd "${1:-.}"
idx=$(mktemp -u)
trap 'rm -f "$idx"' EXIT

cp "$(git rev-parse --git-path index)" "$idx" 2>/dev/null || true
GIT_INDEX_FILE=$idx git add -A :/ >/dev/null 2>&1
GIT_INDEX_FILE=$idx git write-tree
