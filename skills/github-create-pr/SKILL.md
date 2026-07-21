---
name: github-create-pr
description: Use when asked to create a GitHub pull request, raise a PR, open a PR, or submit changes for review — triggers on the current repo branch when code is already pushed and checks are complete.
---

# GitHub Create PR

## Workflow

1. Assume the branch is already pushed and required checks are already complete. Do not run `npm` checks, builds, or `git push` unless the user explicitly asks.
2. Resolve the branch and base branch first:

```bash
branch=$(git branch --show-current)
base=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name' 2>/dev/null || git symbolic-ref --quiet refs/remotes/origin/HEAD | sed 's@^origin/@@')
```

3. Stop immediately if `branch` is empty or matches `base`.
4. Check whether the current branch already has a PR before doing anything else:

```bash
gh pr list --head "$branch" --state all --json number,title,url,state,headRefName,baseRefName
```

If the JSON array is non-empty, stop. Report the PR number, state, title, and URL. Do not create or update a PR.

5. Read `.github/pull_request_template.md`.
- If the file exists, use its exact section order and headings.
- If the file is missing, do **not** stop. Build the PR body from memory-backed defaults:
  - First, check Claude memory (`~/.claude/projects/*/memory/`) for known repo PR template conventions.
  - If memory has a known structure, use that structure in the same order.
  - If memory has no repo-specific structure, use this fallback order:
    - `Summary`
    - `Related Ticket`
    - `Changes`
    - `Screenshots / Preview`
    - `How to Test`
    - `Edge Cases Considered`
    - `Checklist`
    - `Additional Notes`
  - Note in `Additional Notes` that `.github/pull_request_template.md` was not found and a memory/default structure was used.

6. Gather only the context needed to fill the template:

```bash
git log --format=%s "origin/$base..HEAD"
git diff --stat "origin/$base...HEAD"
git diff --name-only "origin/$base...HEAD"
```

If `origin/$base` is unavailable locally, fall back to the local `$base` branch for the diff commands.

7. Build the PR title from the branch name first.
- Preserve a leading ticket key like `ABC-123` when present.
- Convert the remaining hyphenated slug into readable words.
- Prefer `TICKET: human readable summary` when a ticket key exists.
- Example: `ABC-123-older-plan-loading-during-new-plan-generation` → `ABC-123: Older plan loading during new plan generation`.
- Use the latest commit subject only as a fallback when the branch name is too generic to turn into a useful title.

8. Fill the template honestly:
- `Summary`: 2-4 bullets covering what changed and why.
- `Related Ticket`: when the branch/commits carry an `ABC-123` style key, ALWAYS link it as a clickable Markdown link whose **visible text is `KEY: <ticket title>`** and whose href is the browse URL — e.g. `[ABC-123: Human readable ticket title](https://<your-domain>.atlassian.net/browse/ABC-123)`. Fetch the title from JIRA (`GET /rest/api/3/issue/<KEY>?fields=summary`; creds + domain from `~/.claude/jira-config.json`, browse URL = `https://<domain>/browse/<KEY>`). If the title fetch fails, fall back to `[KEY](browse URL)` (still a link, never the bare key). If no ticket key exists, write `- None`.
- `Changes`: 3-6 concrete bullets based on the diff.
- `Screenshots / Preview`: use `N/A` unless the user provided screenshots or clearly described a UI change with preview assets.
- `How to Test`: give reviewer steps only. Do not claim commands were run if you did not run them.
- `Edge Cases Considered`: list concrete cases or write `- None beyond the normal flow`.
- `Checklist`: mark `Code builds successfully`, `Coverage requirements met (>=70%)`, and `Lint passes` as done because the user explicitly said to assume checks are complete. Only mark `Tests added/updated`, `No console errors`, and `Documentation updated` when the change actually supports that claim.

9. Write the finished PR body to a temp file:
- If template file exists, preserve its exact section order.
- If template file is missing, preserve the memory/default order selected in step 5.

10. Create the PR with `gh`:

```bash
gh pr create --base "$base" --head "$branch" --title "$title" --body-file "$body_file"
```

Add `--draft` only when the user explicitly asks for a draft PR.

11. Return the PR URL and final title.

## Guardrails

- Prefer JSON-producing `gh` commands so the branch-PR check is deterministic.
- If `gh` fails because the environment blocks network access, request approval and rerun the same command rather than changing the workflow.
- If `.github/pull_request_template.md` is missing, do not abort; fall back to memory-backed template structure as defined above.
- If the branch already has a PR, abort the task. Do not open a duplicate and do not silently switch to updating the existing PR unless the user explicitly asks for that instead.
