from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import pytest

import insights_delta as idl
from records import edit_call, insights_command, plain_user, skill_call, slash_command

RUN_TS = "2026-10-09T08:00:00Z"
T = "2026-09-10T00:00:00Z"
REPO_FILE = "/Users/dev/work/app/src/main.ts"


def ts(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)


def build(usage_dir: Path, projects_dir: Path) -> dict:
    return idl.build_report(usage_dir, projects_dir, ts(RUN_TS), None)


def category(usage_dir: Path, projects_dir: Path, session_id: str) -> str:
    return build(usage_dir, projects_dir)["current"]["categories"][session_id]


@pytest.mark.parametrize(
    "records,expected",
    [
        ([plain_user(T), skill_call(T, "code-review:code-review")], "review"),
        ([slash_command(T, "review")], "review"),
        ([skill_call(T, "pr-review-mechanics"), edit_call(T, REPO_FILE)], "dev"),
        ([edit_call(T, "/Users/dev/.claude/skills/x/SKILL.md")], "setup"),
        ([edit_call(T, "/Users/dev/work/app/CLAUDE.md")], "setup"),
        ([skill_call(T, "review"), edit_call(T, "/private/tmp/claude-1/scratchpad/probe.ts")], "review"),
        ([skill_call(T, "review"), edit_call(T, "/Users/dev/.claude/CLAUDE.md")], "review"),
        ([plain_user(T, "why does the canvas flicker?")], "dev"),
        ([edit_call(T, REPO_FILE)], "dev"),
    ],
)
def test_session_category_follows_review_skills_and_edit_targets(
    usage_dir, projects_dir, write_meta, write_transcript, records, expected
):
    write_meta("s", T)
    write_transcript("s", records)

    assert category(usage_dir, projects_dir, "s") == expected


def test_subagent_product_edit_makes_session_dev(usage_dir, projects_dir, write_meta, write_transcript):
    write_meta("s", T)
    write_transcript("s", [skill_call(T, "review")])
    subagents = projects_dir / "-proj" / "s" / "subagents"
    subagents.mkdir(parents=True)
    (subagents / "agent-1.jsonl").write_text(json.dumps(edit_call(T, REPO_FILE)) + "\n")

    assert category(usage_dir, projects_dir, "s") == "dev"


def test_session_without_transcript_is_unclassified(usage_dir, projects_dir, write_meta):
    write_meta("s", T)

    assert category(usage_dir, projects_dir, "s") == "unclassified"


def test_dev_comparison_excludes_review_sessions(usage_dir, projects_dir, write_meta, write_transcript):
    write_meta("dev", T, tool_counts={"Edit": 10})
    write_transcript("dev", [edit_call(T, REPO_FILE)])
    write_meta("rev", T, tool_counts={"Edit": 0, "Bash": 50})
    write_transcript("rev", [skill_call(T, "review")])

    report = build(usage_dir, projects_dir)

    rows = {r["metric"]: r for r in report["comparison"]}
    assert rows["edit_per_session"]["current"] == pytest.approx(10.0)
    assert rows["edit_per_session"]["n_current"] == 1
    assert report["bucket_counts"]["review"] == {"previous": None, "current": 1}


def test_review_comparison_holds_the_compact_rows(usage_dir, projects_dir, write_meta, write_transcript):
    write_meta("rev", T)
    write_transcript("rev", [skill_call(T, "review")])

    rows = build(usage_dir, projects_dir)["review_comparison"]

    assert [r["metric"] for r in rows] == ["achieved_share", "friction_per_faceted_session", "user_rejected_per_session"]
    assert rows[2]["n_current"] == 1


def test_previous_window_buckets_are_classified_from_transcripts(usage_dir, projects_dir, write_meta, write_transcript):
    write_transcript("r1", [plain_user("2026-07-31T00:00:00Z"), insights_command("2026-08-01T00:00:00Z")])
    write_transcript("r2", [plain_user("2026-08-31T00:00:00Z"), insights_command("2026-09-01T00:00:00Z")])
    write_meta("old-rev", "2026-08-10T00:00:00Z")
    write_transcript("old-rev", [skill_call("2026-08-10T00:00:00Z", "review")])
    write_meta("new-dev", T)
    write_transcript("new-dev", [edit_call(T, REPO_FILE)])

    report = build(usage_dir, projects_dir)

    assert report["previous_buckets_available"] is True
    assert report["bucket_counts"]["review"] == {"previous": 1, "current": 0}
    assert report["bucket_counts"]["dev"] == {"previous": 0, "current": 1}


def test_schema1_snapshot_marks_previous_buckets_unavailable(usage_dir, projects_dir, write_meta, write_transcript):
    snapshot = {
        "schema": 1, "run_ts": "2026-09-01T00:00:00+00:00", "window_start": None,
        "summary": {"n_sessions": 4, "rates": {"edit_per_session": 3.0}, "facets": {"n": 0}},
    }
    (usage_dir / "history" / "old.json").write_text(json.dumps(snapshot))
    write_meta("new-dev", T)
    write_transcript("new-dev", [edit_call(T, REPO_FILE)])

    report = build(usage_dir, projects_dir)

    assert report["previous_buckets_available"] is False
    assert {r["verdict"] for r in report["comparison"]} == {"n/a"}
    assert report["previous"]["n_sessions"] == 4


def test_concentration_counts_dev_sessions_but_credentials_cover_all(
    usage_dir, projects_dir, write_meta, write_facet, write_transcript
):
    write_meta("dev", T)
    write_transcript("dev", [edit_call(T, REPO_FILE)])
    write_facet("dev", friction_counts={"buggy_code": 2})
    write_meta("rev", T)
    write_transcript("rev", [skill_call(T, "review")])
    write_facet("rev", friction_counts={"credential_exposure": 1, "wrong_approach": 9}, friction_detail="leak")

    flags = build(usage_dir, projects_dir)["flags"]

    assert flags["concentration"]["friction_total"] == 2
    assert [c["session_id"] for c in flags["credential_exposure"]] == ["rev"]


def test_snapshot_stores_categories_and_bucket_summaries(usage_dir, projects_dir, write_meta, write_transcript, capsys):
    write_meta("rev", T)
    write_transcript("rev", [skill_call(T, "review")])

    idl.main(["--usage-dir", str(usage_dir), "--projects-dir", str(projects_dir), "--run-ts", RUN_TS, "--write-snapshot"])

    path = json.loads(capsys.readouterr().out)["snapshot_path"]
    saved = json.loads(Path(path).read_text())
    assert saved["schema"] == 2
    assert saved["summary"]["categories"] == {"rev": "review"}
    assert saved["summary"]["buckets"]["review"]["n_sessions"] == 1
