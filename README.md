# dotclaude

Rutvik's shared Claude Code setup, packaged for the team. **Two ways to install** — pick one per item, don't do both:

- **Plugin** (`dotclaude-toolkit`) — managed, all-in-one. The 10 skills + 12 subagents + hooks install as one unit via `/plugin`, with versioning and clean uninstall. Best when you want the whole toolkit.
- **À-la-carte installer** (`install.sh`) — cherry-pick *individual* skills, agents, or rules (plus `CLAUDE.md` / statusline / settings) by copying them straight into `~/.claude/`. Best when you want only specific pieces. This is also the only way to get `CLAUDE.md` and `rules/`, since a plugin can't place files at those paths.

> ⚠️ Don't install the **same** skill/agent via *both* paths — it loads twice. Use the plugin for the bundle, or the installer for à-la-carte, per item.

---

## Install

### Option A — Plugin (everything, managed)

```
/plugin marketplace add RutvikrajsinhChampavat/dotclaude
/plugin install dotclaude-toolkit@dotclaude
```

Restart Claude Code. Confirm it loaded — ask Claude to list skills/agents, or open `/plugin`.

> The plugin carries skills + agents + hooks only. For `CLAUDE.md`, `rules/`, and the statusline, run the installer below with the components you want.

### Option B — À-la-carte installer (pick exactly what you want)

```bash
git clone https://github.com/RutvikrajsinhChampavat/dotclaude.git
cd dotclaude
./install.sh                 # interactive — pick items per category
./install.sh --list          # show every available skill / agent / rule
```

Cherry-pick by name (all flags repeatable, combinable):

```bash
./install.sh --skill rule-audit --skill tdd-workflow
./install.sh --agent code-reviewer --agent planner
./install.sh --rule typescript/security --rule common/code-review
./install.sh --skills --rules                 # whole groups
./install.sh --claude-md --statusline --settings
./install.sh --all                            # the lot
```

| Flag | Installs |
|---|---|
| `--skill NAME` / `--skills` | one named skill / all skills |
| `--agent NAME` / `--agents` | one named agent / all agents |
| `--rule PATH` / `--rules` | one rule (e.g. `python/testing`) / all rules |
| `--claude-md` `--statusline` `--settings` | global instructions / statusline script / settings template |
| `--all` | everything |

The script backs up any existing file before overwriting, and **never** overwrites your `settings.json` (drops `settings.template.json` to merge by hand).

### (optional) Mirror the full plugin ecosystem

`setup/settings.template.json` carries Rutvik's `extraKnownMarketplaces` + `enabledPlugins` (superpowers, caveman, context7, atlassian, figma, …). Merge that block into your `settings.json`, then `/plugin` to install them.

---

## What's inside

### Skills (`skills/`)

| Skill | Trigger | Purpose |
|---|---|---|
| `coding-standards` | auto: new module / convention Q | TS/JS/Py standards — immutability, file org, errors, naming |
| `backend-patterns` | auto: Express/Mongoose/Node | repository pattern, service layer, middleware, caching |
| `frontend-patterns` | auto: React/Next in src/client/app | components, hooks, state, perf |
| `tdd-workflow` | auto: new feature/fn/failing test | Red→Green→Refactor, 80% coverage |
| `security-review` | auto: authn/authz/input/payments | OWASP Top 10 checklist (Node + Py) |
| `rule-audit` | pre + post-write gate (3+ files) | loads project + global rules → checklist; post-scan for `any`/console.log/hardcoded |
| `runtime-trace-debug` | live timing/ordering/state bugs | tagged runtime logs → read trace → fix from evidence |
| `verification-loop` | manual `/verify` only | pre-commit lint/tsc/test/build gate |
| `github-create-pr` | "create PR / raise PR" | PR on current branch when pushed |
| `create-jira-ticket` | "create JIRA ticket / bug" | new Atlassian issue |

> `rule-audit` reads `~/.claude/rules/` and the global `~/.claude/CLAUDE.md` — both placed by `install.sh`. Run step 1 before relying on it.

### Subagents (`agents/`)

`architect`, `planner`, `tdd-guide`, `code-reviewer`, `security-reviewer`, `typescript-reviewer`, `python-reviewer`, `database-reviewer`, `build-error-resolver`, `e2e-runner`, `refactor-cleaner`, `docs-lookup`.

### Hooks (`hooks/hooks.json`)

Session-hygiene nudges: `/context` reminder at session start, `/clear` reminder at session end and after test runs.

### Bootstrap (`setup/`)

`CLAUDE.md` (global engineering instructions), `rules/` (common + typescript + python rule sets), `statusline-command.sh`, `settings.template.json`.

---

## Updating

```bash
cd dotclaude && git pull && ./install.sh   # refresh bootstrap
/plugin marketplace update dotclaude        # refresh plugin
```

## License

MIT — see [LICENSE](LICENSE).
