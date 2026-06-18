#!/usr/bin/env bash
# Installs the path-coupled parts of Rutvik's Claude setup into ~/.claude/.
# Plugin parts (skills, agents, hooks) are NOT handled here — install those via
# the marketplace (see README). This script only places files that must live at
# fixed ~/.claude/ paths: global CLAUDE.md, rules/, statusline, settings template.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$SCRIPT_DIR/setup"
DEST="$HOME/.claude"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$DEST"

backup() {
  # backup <path> — moves an existing file/dir aside before overwrite
  local path="$1"
  if [ -e "$path" ]; then
    mv "$path" "$path.bak.$STAMP"
    echo "  backed up existing $(basename "$path") -> $(basename "$path").bak.$STAMP"
  fi
}

echo "Installing global instructions + rules into $DEST ..."

backup "$DEST/CLAUDE.md"
cp "$SRC/CLAUDE.md" "$DEST/CLAUDE.md"
echo "  + CLAUDE.md"

backup "$DEST/rules"
cp -R "$SRC/rules" "$DEST/rules"
echo "  + rules/ ($(find "$DEST/rules" -type f | wc -l | tr -d ' ') files)"

cp "$SRC/statusline-command.sh" "$DEST/statusline-command.sh"
chmod +x "$DEST/statusline-command.sh"
echo "  + statusline-command.sh"

# Never clobber an existing settings.json — drop the template alongside it.
cp "$SRC/settings.template.json" "$DEST/settings.template.json"
echo "  + settings.template.json (merge by hand — does NOT overwrite settings.json)"

cat <<'EOF'

Done. Next steps (run inside Claude Code):

  1. Add the marketplace and install the plugin (skills + agents + hooks):
       /plugin marketplace add RutvikrajsinhChampavat/dotclaude
       /plugin install dotclaude-toolkit@dotclaude
     Restart Claude Code.

  2. Merge ~/.claude/settings.template.json into your ~/.claude/settings.json
     by hand. Fix the statusLine path (YOUR_USER) and adopt the plugin
     ecosystem block if you want Rutvik's full plugin set.

  3. Verify: ask Claude to list available skills/agents, or run /plugin.
EOF
