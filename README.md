# dotclaude

Rutvik's shared Claude Code setup, packaged for the team. Two halves:

- **Plugin** (`dotclaude-toolkit`) — 10 skills + 12 subagents + session-hygiene hooks. Installed via the marketplace.
- **Bootstrap** (`setup/`) — global `CLAUDE.md`, `rules/`, statusline, and a settings template. These must live at fixed `~/.claude/` paths, so `install.sh` copies them (a plugin cannot place files there).

---

## Install

### 1. Bootstrap (CLAUDE.md, rules, statusline, settings template)

```bash
git clone https://github.com/RutvikrajsinhChampavat/dotclaude.git
cd dotclaude
./install.sh
```

`install.sh` backs up any existing `~/.claude/CLAUDE.md` and `~/.claude/rules/` before copying, and **never** overwrites your `settings.json` (drops a `settings.template.json` to merge by hand).

### 2. Plugin (skills + agents + hooks)

Inside Claude Code:

```
/plugin marketplace add RutvikrajsinhChampavat/dotclaude
/plugin install dotclaude-toolkit@dotclaude
```

Restart Claude Code. Confirm it loaded — ask Claude to list available skills/agents, or open `/plugin`.

### 3. (optional) Mirror the full plugin ecosystem

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
