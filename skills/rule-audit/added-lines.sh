#!/usr/bin/env bash
# Prints path:line:text for every line in scope: lines the branch adds over its base, plus lines this session changed.
# Usage: added-lines.sh [repo] [base-ref]   base defaults to merge-base(HEAD, origin default branch).
# Set AUDIT_SESSION=<session id> to include the session's edits (snapshot taken by hooks/audit-session-mark.sh).
set -euo pipefail

repo=${1:-.}
cd "$repo"
top=$(git rev-parse --show-toplevel)

default=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null || echo origin/main)
base=${2:-$(git merge-base HEAD "$default" 2>/dev/null || git rev-parse HEAD)}

plus_lines() {
  awk '
    /^\+\+\+ \/dev\/null/ { f = ""; next }
    /^\+\+\+ / { f = substr($0, 7); next }
    /^@@/ { match($0, /\+[0-9]+/); n = substr($0, RSTART + 1, RLENGTH - 1) + 0; next }
    /^\+/ { if (f != "") print f ":" n ":" substr($0, 2); n++ }
  '
}

now=$("$(dirname "$0")/snapshot-tree.sh" "$top")

{
  git diff -U0 --no-color --no-ext-diff "$base" "$now" | plus_lines

  mark="$HOME/.claude/state/audit-base/${AUDIT_SESSION:-none}/$(printf '%s' "$top" | shasum | cut -c1-12)"
  if [ -f "$mark" ]; then
    git diff -U0 --no-color --no-ext-diff "$(cut -d' ' -f1 "$mark")" "$now" | plus_lines
  elif [ -n "${AUDIT_SESSION:-}" ]; then
    echo "added-lines: no session snapshot for $top; branch lines only" >&2
  fi
} | sort -t: -k1,1 -k2,2n -u
