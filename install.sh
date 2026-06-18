#!/usr/bin/env bash
# Cherry-pick installer for Rutvik's Claude setup — copies selected items into ~/.claude/.
# Skills, agents and rules are personal-scope files; they work the moment they land in
# ~/.claude/{skills,agents,rules}. (The bundled plugin is an ALTERNATIVE all-in-one path —
# don't install the same skill/agent both ways, or it loads twice.)
#
# Usage:
#   ./install.sh                       # interactive — pick items per category
#   ./install.sh --list                # show everything available, then exit
#   ./install.sh --all                 # install everything
#   ./install.sh --skill rule-audit --skill tdd-workflow
#   ./install.sh --agent code-reviewer --agent planner
#   ./install.sh --rule typescript/security --rule common/code-review
#   ./install.sh --skills --rules      # whole groups
#   ./install.sh --claude-md --statusline --settings
#
# Flags:
#   --all
#   --skills | --skill NAME        (repeatable)
#   --agents | --agent NAME        (repeatable)
#   --rules  | --rule  PATH        (repeatable, e.g. common/code-review)
#   --claude-md  --statusline  --settings
#   --list  -h|--help
set -eo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_SRC="$SCRIPT_DIR/skills"
AGENTS_SRC="$SCRIPT_DIR/agents"
SETUP_SRC="$SCRIPT_DIR/setup"
RULES_SRC="$SETUP_SRC/rules"
DEST="$HOME/.claude"
STAMP="$(date +%Y%m%d-%H%M%S)"

# --- discover available items (bash 3.2 friendly: no mapfile) ---
AVAIL_SKILLS=(); AVAIL_AGENTS=(); AVAIL_RULES=()
while IFS= read -r x; do AVAIL_SKILLS+=("$x"); done < <(cd "$SKILLS_SRC" && for d in */; do printf '%s\n' "${d%/}"; done | sort)
while IFS= read -r x; do AVAIL_AGENTS+=("$x"); done < <(cd "$AGENTS_SRC" && for f in *.md; do printf '%s\n' "${f%.md}"; done | sort)
while IFS= read -r x; do AVAIL_RULES+=("$x"); done < <(cd "$RULES_SRC" && find . -name '*.md' | sed 's|^\./||; s|\.md$||' | sort)

# --- selection state ---
SEL_SKILLS=(); SEL_AGENTS=(); SEL_RULES=()
ALL_SKILLS=0; ALL_AGENTS=0; ALL_RULES=0
DO_CLAUDE_MD=0; DO_STATUSLINE=0; DO_SETTINGS=0
INTERACTIVE=1

usage() { awk 'NR>1 { if (/^#/) { sub(/^# ?/, ""); print } else { exit } }' "${BASH_SOURCE[0]}"; }

contains() { local x="$1"; shift; local a; for a in "$@"; do [ "$a" = "$x" ] && return 0; done; return 1; }

list_avail() {
  echo "Skills:"; printf '  %s\n' "${AVAIL_SKILLS[@]}"
  echo "Agents:"; printf '  %s\n' "${AVAIL_AGENTS[@]}"
  echo "Rules:";  printf '  %s\n' "${AVAIL_RULES[@]}"
}

if [ "$#" -gt 0 ]; then
  INTERACTIVE=0
  while [ "$#" -gt 0 ]; do
    case "$1" in
      --all)        ALL_SKILLS=1; ALL_AGENTS=1; ALL_RULES=1; DO_CLAUDE_MD=1; DO_STATUSLINE=1; DO_SETTINGS=1 ;;
      --skills)     ALL_SKILLS=1 ;;
      --agents)     ALL_AGENTS=1 ;;
      --rules)      ALL_RULES=1 ;;
      --claude-md)  DO_CLAUDE_MD=1 ;;
      --statusline) DO_STATUSLINE=1 ;;
      --settings)   DO_SETTINGS=1 ;;
      --skill)      shift; [ -n "$1" ] || { echo "--skill needs a name" >&2; exit 1; }
                    contains "$1" "${AVAIL_SKILLS[@]}" || { echo "unknown skill: $1 (see --list)" >&2; exit 1; }
                    SEL_SKILLS+=("$1") ;;
      --agent)      shift; [ -n "$1" ] || { echo "--agent needs a name" >&2; exit 1; }
                    contains "$1" "${AVAIL_AGENTS[@]}" || { echo "unknown agent: $1 (see --list)" >&2; exit 1; }
                    SEL_AGENTS+=("$1") ;;
      --rule)       shift; [ -n "$1" ] || { echo "--rule needs a path" >&2; exit 1; }
                    r="${1%.md}"
                    contains "$r" "${AVAIL_RULES[@]}" || { echo "unknown rule: $1 (see --list)" >&2; exit 1; }
                    SEL_RULES+=("$r") ;;
      --list)       list_avail; exit 0 ;;
      -h|--help)    usage; exit 0 ;;
      *) echo "unknown option: $1" >&2; usage; exit 1 ;;
    esac
    shift
  done
fi

confirm() { local a; read -r -p "$1 [y/N] " a </dev/tty || return 1; [[ "$a" =~ ^[Yy] ]]; }

PICKED=()
pick() {
  # pick <label> <item...> -> fills global PICKED
  local label="$1"; shift
  PICKED=()
  [ "$#" -eq 0 ] && return 0
  local items=("$@") i=1 it ans n
  echo "$label:"
  for it in "${items[@]}"; do printf "  %2d) %s\n" "$i" "$it"; i=$((i+1)); done
  read -r -p "  numbers (space-sep), 'a'=all, enter=none: " ans </dev/tty || ans=""
  if [ "$ans" = "a" ] || [ "$ans" = "A" ]; then PICKED=("${items[@]}"); echo; return 0; fi
  for n in $ans; do
    case "$n" in ''|*[!0-9]*) continue ;; esac
    if [ "$n" -ge 1 ] && [ "$n" -le "${#items[@]}" ]; then PICKED+=("${items[$((n-1))]}"); fi
  done
  echo
}

if [ "$INTERACTIVE" -eq 1 ]; then
  echo "Pick items to install into $DEST"
  echo "(or use flags — run with --help)"; echo
  pick "Skills" "${AVAIL_SKILLS[@]}"; SEL_SKILLS=("${PICKED[@]}")
  pick "Agents" "${AVAIL_AGENTS[@]}"; SEL_AGENTS=("${PICKED[@]}")
  pick "Rules"  "${AVAIL_RULES[@]}";  SEL_RULES=("${PICKED[@]}")
  confirm "global CLAUDE.md?"                          && DO_CLAUDE_MD=1
  confirm "statusline-command.sh?"                     && DO_STATUSLINE=1
  confirm "settings.template.json (never overwrites)?" && DO_SETTINGS=1
  echo
fi

[ "$ALL_SKILLS" -eq 1 ] && SEL_SKILLS=("${AVAIL_SKILLS[@]}")
[ "$ALL_AGENTS" -eq 1 ] && SEL_AGENTS=("${AVAIL_AGENTS[@]}")
[ "$ALL_RULES"  -eq 1 ] && SEL_RULES=("${AVAIL_RULES[@]}")

TOTAL=$(( ${#SEL_SKILLS[@]} + ${#SEL_AGENTS[@]} + ${#SEL_RULES[@]} + DO_CLAUDE_MD + DO_STATUSLINE + DO_SETTINGS ))
if [ "$TOTAL" -eq 0 ]; then
  echo "Nothing selected — see --list and --help." >&2
  exit 0
fi

mkdir -p "$DEST"
backup() { [ -e "$1" ] && { mv "$1" "$1.bak.$STAMP"; echo "  backed up $(basename "$1") -> $(basename "$1").bak.$STAMP"; }; return 0; }

for s in "${SEL_SKILLS[@]}"; do
  backup "$DEST/skills/$s"; mkdir -p "$DEST/skills"
  cp -R "$SKILLS_SRC/$s" "$DEST/skills/$s"; echo "  + skill: $s"
done
for a in "${SEL_AGENTS[@]}"; do
  mkdir -p "$DEST/agents"; backup "$DEST/agents/$a.md"
  cp "$AGENTS_SRC/$a.md" "$DEST/agents/$a.md"; echo "  + agent: $a"
done
for r in "${SEL_RULES[@]}"; do
  mkdir -p "$DEST/rules/$(dirname "$r")"; backup "$DEST/rules/$r.md"
  cp "$RULES_SRC/$r.md" "$DEST/rules/$r.md"; echo "  + rule: $r"
done
if [ "$DO_CLAUDE_MD" -eq 1 ]; then backup "$DEST/CLAUDE.md"; cp "$SETUP_SRC/CLAUDE.md" "$DEST/CLAUDE.md"; echo "  + CLAUDE.md"; fi
if [ "$DO_STATUSLINE" -eq 1 ]; then cp "$SETUP_SRC/statusline-command.sh" "$DEST/statusline-command.sh"; chmod +x "$DEST/statusline-command.sh"; echo "  + statusline-command.sh"; fi
if [ "$DO_SETTINGS" -eq 1 ]; then cp "$SETUP_SRC/settings.template.json" "$DEST/settings.template.json"; echo "  + settings.template.json (merge by hand)"; fi

echo
echo "Done. Restart Claude Code to pick up new skills/agents."
echo "Prefer the managed all-in-one path instead? Skip this script and use:"
echo "    /plugin marketplace add RutvikrajsinhChampavat/dotclaude"
echo "    /plugin install dotclaude-toolkit@dotclaude"
