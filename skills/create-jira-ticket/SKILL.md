---
name: create-jira-ticket
description: Use when user wants to create a new JIRA ticket, issue, task, bug report, or feature request in Atlassian JIRA.
---

# Create JIRA Ticket

## Overview

Interactive workflow to create Feature (Task) or Bug tickets in JIRA via REST API. Collects requirements through targeted questions, derives a branch-friendly title, fetches labels live, shows a draft for confirmation, then creates the ticket.

---

## Step 1 — Load or Collect Config

Read `~/.claude/jira-config.json`. For any missing field, ask the user:

| Field | Prompt |
|-------|--------|
| `domain` | "What is your Atlassian domain? (e.g. yourorg.atlassian.net)" |
| `email` | "What is your Atlassian account email?" |
| `token` | "What is your JIRA API token?" → if missing, show Token Setup below |
| `projectKey` | "What is the JIRA project key? (e.g. AP, PROJ)" |

Save collected values to `~/.claude/jira-config.json` before continuing.

If `accountId` is missing from the config, fetch it automatically (no user prompt needed):

```bash
curl -s -u "{email}:{token}" \
  -H "Accept: application/json" \
  "https://{domain}/rest/api/3/myself" | python3 -c "import sys,json; print(json.load(sys.stdin)['accountId'])"
```

Save the returned `accountId` to `~/.claude/jira-config.json`.

### Token Setup (if user has no token)

```
1. Go to: https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Name it (e.g. "Claude Code")
4. Copy and paste the token here
```

---

## Step 2 — Understand the Requirement

Ask the user to describe what the ticket is for. Then ask targeted clarifying questions — **2–3 max**. Focus on gaps that affect the title, description, or acceptance criteria. Do not run through a form.

---

## Step 3 — Determine Ticket Type

Infer Feature or Bug from context. If unclear:

> "Is this a new feature/enhancement or a bug fix?"

- **Feature** → JIRA issue type: `Task`
- **Bug** → JIRA issue type: `Bug`

---

## Step 4 — Draft the Title

Generate a concise title (max 60 chars, Title Case). Show it to the user and confirm before proceeding.

**Branch name preview** (JIRA auto-generates this from the title):
```
{PROJECT_KEY}-???-kebab-case-title
```
Replace `???` with the real ticket number after creation. Explain this to the user.

---

## Step 5 — Fetch Labels

```bash
curl -s -u "{email}:{token}" \
  -H "Accept: application/json" \
  "https://{domain}/rest/api/3/label"
```

Response is paginated — use the `values` array. Display as a numbered list. Ask user to pick by number or name, or type "skip".

---

## Step 6 — Build Description

Use the template matching the ticket type. Fill all sections from information gathered in Step 2.

### Feature Template (Option E)

```
As a user, I want [goal] so that [benefit].

Background:
[Why this is needed — 1–2 sentences]

Acceptance Criteria:
- [ ] ...

Out of Scope:
- ...

Notes:
- ...
```

**ADF structure:**
- `paragraph` → user story sentence
- `heading(3)` → "Background" + `paragraph`
- `heading(3)` → "Acceptance Criteria" + `taskList` (state: "TODO")
- `heading(3)` → "Out of Scope" + `bulletList`
- `heading(3)` → "Notes" + `bulletList`

### Bug Template (Option A)

```
Description:
[What is broken and where]

Steps to Reproduce:
1. ...
2. ...

Expected Behaviour:
[What should happen]

Actual Behaviour:
[What happens instead]
```

**ADF structure:**
- `heading(3)` → "Description" + `paragraph`
- `heading(3)` → "Steps to Reproduce" + `orderedList`
- `heading(3)` → "Expected Behaviour" + `paragraph`
- `heading(3)` → "Actual Behaviour" + `paragraph`

---

## Step 7 — Confirm Title and Description

Show the full draft before creating:

```
Title:       [title]
Type:        Task / Bug
Labels:      [label1, label2] or None
Assignee:    {email} (you)
Branch:      {PROJECT_KEY}-???-kebab-case-title (final number assigned by JIRA)

Description:
─────────────────────────────────────
[rendered description sections]
─────────────────────────────────────

Does this look correct?
  1. Yes — create ticket
  2. Edit title
  3. Edit description
  4. Cancel
```

Loop on edits until user confirms with option 1.

---

## Step 8 — Create the Ticket

```bash
curl -s -u "{email}:{token}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  "https://{domain}/rest/api/3/issue" \
  -d '{
    "fields": {
      "project":     { "key": "{projectKey}" },
      "summary":     "{title}",
      "issuetype":   { "name": "Task" },
      "description": { ...ADF... },
      "labels":      ["{label1}", "{label2}"],
      "assignee":    { "accountId": "{accountId}" }
    }
  }'
```

On success, output:
```
✓ Ticket created: {PROJECT_KEY}-{number}
  URL:    https://{domain}/browse/{PROJECT_KEY}-{number}
  Branch: {PROJECT_KEY}-{number}-kebab-case-title
```

---

## ADF Node Reference

**taskList item:**
```json
{
  "type": "taskItem",
  "attrs": { "localId": "unique-id", "state": "TODO" },
  "content": [{ "type": "text", "text": "Criteria text" }]
}
```

**orderedList item:**
```json
{
  "type": "listItem",
  "content": [{
    "type": "paragraph",
    "content": [{ "type": "text", "text": "Step text" }]
  }]
}
```

**bulletList item:** same structure as orderedList item but parent type is `bulletList`.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Token URL uses `.net` | Always use `id.atlassian.com` (not `.net`) |
| `taskList` items not wrapped in `taskList` node | Wrap all `taskItem` nodes inside a `taskList` |
| Labels field missing from payload | Omit `labels` key entirely if user skips — don't send `[]` |
| Branch preview shows `???` | Explain to user: JIRA assigns the number on creation |
| Label API returns paginated response | Read `values` array, not root array |
| `assignee` missing from payload | Always include `"assignee": {"accountId": "..."}` — fetch from `/rest/api/3/myself` if not in config |
| Creation fails with `INVALID_INPUT` | Create ticket without description first, then `PUT` to update — avoids ADF validation errors |
