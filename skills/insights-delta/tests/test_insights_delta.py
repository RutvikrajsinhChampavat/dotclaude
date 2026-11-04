from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import pytest

import insights_delta as idl
from records import insights_command, plain_user, tool_result_mentioning_marker

RUN_TS = "2026-10-09T08:00:00Z"


def ts(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)


def build(usage_dir: Path, projects_dir: Path, current: str | None = "current") -> dict:
    return idl.build_report(usage_dir, projects_dir, ts(RUN_TS), current)


def test_window_covers_sessions_since_last_run_only(usage_dir, projects_dir, write_meta, write_transcript):
    write_transcript("old", [insights_command("2026-09-01T00:00:00Z")])
    write_meta("before", "2026-08-20T00:00:00Z")
    write_meta("inside", "2026-09-15T00:00:00Z")
    write_meta("future", "2026-10-10T00:00:00Z")

    report = build(usage_dir, projects_dir)

    assert report["window"]["start"] == "2026-09-01T00:00:00+00:00"
    assert report["window"]["source"] == "transcripts"
    assert report["current"]["n_sessions"] == 1


def test_no_baseline_uses_all_history_and_no_previous(usage_dir, projects_dir, write_meta):
    write_meta("a", "2026-08-20T00:00:00Z")
    write_meta("b", "2026-09-20T00:00:00Z")

    report = build(usage_dir, projects_dir)

    assert report["window"]["start"] is None
    assert report["window"]["source"] == "none"
    assert report["previous"] is None
    assert report["current"]["n_sessions"] == 2


def test_snapshot_baseline_wins_over_transcripts(usage_dir, projects_dir, write_meta, write_transcript):
    write_transcript("old", [insights_command("2026-09-20T00:00:00Z")])
    snapshot = {
        "schema": 1,
        "run_ts": "2026-09-01T00:00:00+00:00",
        "window_start": "2026-08-01T00:00:00+00:00",
        "summary": {"n_sessions": 7, "rates": {"edit_per_session": 2.0}, "facets": {"n": 0}},
    }
    (usage_dir / "history" / "2026-09-01T000000Z.json").write_text(json.dumps(snapshot))
    write_meta("inside", "2026-09-10T00:00:00Z")

    report = build(usage_dir, projects_dir)

    assert report["window"]["source"] == "snapshot"
    assert report["window"]["start"] == "2026-09-01T00:00:00+00:00"
    assert report["previous_window"] == {"start": "2026-08-01T00:00:00+00:00", "end": "2026-09-01T00:00:00+00:00"}
    assert report["previous"]["n_sessions"] == 7


def test_snapshot_at_or_after_run_ts_is_ignored(usage_dir, projects_dir):
    snapshot = {"schema": 1, "run_ts": RUN_TS.replace("Z", "+00:00"), "window_start": None, "summary": {}}
    (usage_dir / "history" / "same.json").write_text(json.dumps(snapshot))

    report = build(usage_dir, projects_dir)

    assert report["window"]["source"] == "none"


def test_transcript_baseline_skips_current_session(usage_dir, projects_dir, write_transcript):
    write_transcript("current", [insights_command("2026-10-01T00:00:00Z")])
    write_transcript("older", [insights_command("2026-09-01T00:00:00Z")])

    report = build(usage_dir, projects_dir, current="current")

    assert report["window"]["start"] == "2026-09-01T00:00:00+00:00"


def test_transcript_baseline_ignores_runs_at_or_after_run_ts(usage_dir, projects_dir, write_transcript):
    write_transcript("later", [insights_command("2026-10-09T08:00:00Z"), insights_command("2026-10-09T09:00:00Z")])

    report = build(usage_dir, projects_dir)

    assert report["window"]["source"] == "none"


def test_tool_result_quoting_the_marker_is_not_a_run(usage_dir, projects_dir, write_transcript):
    write_transcript("grepper", [plain_user("2026-09-01T00:00:00Z"), tool_result_mentioning_marker("2026-09-02T00:00:00Z")])

    report = build(usage_dir, projects_dir)

    assert report["window"]["source"] == "none"


def test_previous_window_spans_the_two_prior_runs(usage_dir, projects_dir, write_meta, write_transcript):
    write_transcript("r1", [insights_command("2026-08-01T00:00:00Z")])
    write_transcript("r2", [insights_command("2026-09-01T00:00:00Z")])
    write_meta("too-old", "2026-07-01T00:00:00Z")
    write_meta("prev", "2026-08-15T00:00:00Z")
    write_meta("curr", "2026-09-15T00:00:00Z")

    report = build(usage_dir, projects_dir)

    assert report["previous_window"] == {"start": "2026-08-01T00:00:00+00:00", "end": "2026-09-01T00:00:00+00:00"}
    assert report["previous"]["n_sessions"] == 1


def test_rates_are_per_session_when_window_lengths_differ(usage_dir, projects_dir, write_meta, write_transcript):
    write_transcript("r1", [insights_command("2026-08-01T00:00:00Z")])
    write_transcript("r2", [insights_command("2026-09-01T00:00:00Z")])
    write_meta("p1", "2026-08-10T00:00:00Z", tool_counts={"Edit": 10, "Bash": 4})
    for i in range(4):
        write_meta(f"c{i}", "2026-09-10T00:00:00Z", tool_counts={"Edit": 1, "Bash": 4})

    report = build(usage_dir, projects_dir)

    assert report["previous"]["rates"]["edit_per_session"] == pytest.approx(10.0)
    assert report["current"]["rates"]["edit_per_session"] == pytest.approx(1.0)


def test_error_rates_use_category_counts(usage_dir, projects_dir, write_meta):
    write_meta(
        "a", "2026-09-10T00:00:00Z", tool_counts={"Bash": 10},
        tool_error_categories={"Command Failed": 2, "User Rejected": 1}, user_interruptions=3,
    )

    rates = build(usage_dir, projects_dir)["current"]["rates"]

    assert rates["command_failed_per_bash"] == pytest.approx(0.2)
    assert rates["user_rejected_per_session"] == pytest.approx(1.0)
    assert rates["interruptions_per_session"] == pytest.approx(3.0)


def test_empty_window_yields_none_rates_not_division_error(usage_dir, projects_dir, write_transcript):
    write_transcript("r1", [insights_command("2026-09-01T00:00:00Z")])

    report = build(usage_dir, projects_dir)

    assert report["current"]["n_sessions"] == 0
    assert report["current"]["rates"]["edit_per_session"] is None
    assert report["current"]["rates"]["command_failed_per_bash"] is None


@pytest.mark.parametrize(
    "metric,prev,curr,expected",
    [
        ("user_rejected_per_session", 0.4, 0.1, "better"),
        ("user_rejected_per_session", 0.1, 0.4, "worse"),
        ("achieved_share", 0.6, 0.8, "better"),
        ("achieved_share", 0.8, 0.6, "worse"),
        ("edit_per_session", 17.0, 3.5, "shift"),
        ("command_failed_per_bash", 0.03, 0.03, "flat"),
        ("friction_per_faceted_session", None, 1.1, "n/a"),
    ],
)
def test_verdict_follows_metric_direction(metric, prev, curr, expected):
    assert idl.verdict(metric, prev, curr) == expected


def test_previous_window_without_facets_marks_quality_metrics_na(
    usage_dir, projects_dir, write_meta, write_facet, write_transcript
):
    write_transcript("r1", [insights_command("2026-08-01T00:00:00Z")])
    write_transcript("r2", [insights_command("2026-09-01T00:00:00Z")])
    write_meta("prev", "2026-08-10T00:00:00Z")
    write_transcript("prev", [plain_user("2026-08-10T00:00:00Z")])
    write_meta("curr", "2026-09-10T00:00:00Z")
    write_transcript("curr", [plain_user("2026-09-10T00:00:00Z")])
    write_facet("curr", friction_counts={"buggy_code": 2})

    rows = {r["metric"]: r for r in build(usage_dir, projects_dir)["comparison"]}

    assert rows["friction_per_faceted_session"]["verdict"] == "n/a"
    assert rows["friction_per_faceted_session"]["n_previous"] == 0
    assert rows["friction_per_faceted_session"]["n_current"] == 1


def test_facet_aggregates_count_outcomes_friction_and_bad_signals(usage_dir, projects_dir, write_meta, write_facet):
    write_meta("a", "2026-09-10T00:00:00Z")
    write_meta("b", "2026-09-11T00:00:00Z")
    write_facet("a", outcome="fully_achieved", friction_counts={"wrong_approach": 2},
                user_satisfaction_counts={"dissatisfied": 2, "likely_satisfied": 1})
    write_facet("b", outcome="partially_achieved", user_satisfaction_counts={"frustrated": 1})

    facets = build(usage_dir, projects_dir)["current"]["facets"]

    assert facets["n"] == 2
    assert facets["achieved_share"] == pytest.approx(0.5)
    assert facets["friction"] == {"wrong_approach": 2}
    assert facets["friction_per_faceted_session"] == pytest.approx(1.0)
    assert facets["bad_signals_per_faceted_session"] == pytest.approx(1.5)
    assert facets["first"] == "2026-09-10T00:00:00+00:00"
    assert facets["last"] == "2026-09-11T00:00:00+00:00"


def test_facet_outside_window_is_ignored(usage_dir, projects_dir, write_meta, write_facet, write_transcript):
    write_transcript("r1", [insights_command("2026-09-01T00:00:00Z")])
    write_meta("old", "2026-08-10T00:00:00Z")
    write_facet("old", friction_counts={"buggy_code": 5})

    facets = build(usage_dir, projects_dir)["current"]["facets"]

    assert facets["n"] == 0
    assert facets["friction_per_faceted_session"] is None


def test_credential_exposure_is_flagged(usage_dir, projects_dir, write_meta, write_facet):
    write_meta("leak", "2026-09-10T00:00:00Z")
    write_facet("leak", friction_counts={"credential_exposure": 1}, friction_detail="token printed")

    flags = build(usage_dir, projects_dir)["flags"]

    assert flags["credential_exposure"] == [
        {"session_id": "leak", "start_time": "2026-09-10T00:00:00+00:00", "detail": "token printed"}
    ]


def test_concentration_reports_top_five_share(usage_dir, projects_dir, write_meta, write_facet, write_transcript):
    for i in range(7):
        write_meta(f"s{i}", "2026-09-10T00:00:00Z")
        write_transcript(f"s{i}", [plain_user("2026-09-10T00:00:00Z")])
        write_facet(f"s{i}", friction_counts={"buggy_code": 10 if i == 0 else 1})

    concentration = build(usage_dir, projects_dir)["flags"]["concentration"]

    assert concentration["top_share"] == pytest.approx(14 / 16)
    assert [s["session_id"] for s in concentration["top_sessions"]][0] == "s0"
    assert len(concentration["top_sessions"]) == 5


def test_malformed_meta_is_skipped_and_counted(usage_dir, projects_dir, write_meta):
    write_meta("good", "2026-09-10T00:00:00Z")
    (usage_dir / "session-meta" / "broken.json").write_text("{not json")
    write_meta("no-start", "not-a-timestamp")

    report = build(usage_dir, projects_dir)

    assert report["current"]["n_sessions"] == 1
    assert report["skipped_files"] == 2


def test_coverage_counts_transcripts_started_in_window(usage_dir, projects_dir, write_meta, write_transcript):
    write_transcript("r1", [plain_user("2026-08-31T23:00:00Z"), insights_command("2026-09-01T00:00:00Z")])
    write_transcript("inside", [plain_user("2026-09-05T00:00:00Z")])
    write_transcript("before", [plain_user("2026-08-05T00:00:00Z"), plain_user("2026-09-06T00:00:00Z")])
    write_meta("m", "2026-09-05T00:00:00Z")

    coverage = build(usage_dir, projects_dir)["coverage"]

    assert coverage == {"sessions_with_meta": 1, "transcripts_started": 1}


def test_write_snapshot_creates_file_and_refuses_overwrite(usage_dir):
    summary = {"n_sessions": 3}

    path = idl.write_snapshot(usage_dir / "history", ts(RUN_TS), ts("2026-09-01T00:00:00Z"), summary, "/r.html")

    saved = json.loads(path.read_text())
    assert saved["run_ts"] == "2026-10-09T08:00:00+00:00"
    assert saved["window_start"] == "2026-09-01T00:00:00+00:00"
    assert saved["summary"] == summary
    with pytest.raises(FileExistsError):
        idl.write_snapshot(usage_dir / "history", ts(RUN_TS), None, summary, None)


def test_cli_prints_report_and_writes_snapshot(usage_dir, projects_dir, write_meta, capsys):
    write_meta("a", "2026-09-10T00:00:00Z")

    code = idl.main([
        "--usage-dir", str(usage_dir), "--projects-dir", str(projects_dir),
        "--run-ts", RUN_TS, "--write-snapshot", "--report-path", "/r.html",
    ])

    out = json.loads(capsys.readouterr().out)
    assert code == 0
    assert out["current"]["n_sessions"] == 1
    assert Path(out["snapshot_path"]).exists()


def test_cli_rejects_bad_run_ts(usage_dir, projects_dir):
    with pytest.raises(SystemExit):
        idl.main(["--usage-dir", str(usage_dir), "--projects-dir", str(projects_dir), "--run-ts", "yesterday"])


def test_cli_reports_existing_snapshot_without_overwriting(usage_dir, projects_dir, capsys):
    argv = ["--usage-dir", str(usage_dir), "--projects-dir", str(projects_dir), "--run-ts", RUN_TS, "--write-snapshot"]
    idl.main(argv)
    capsys.readouterr()

    code = idl.main(argv)

    out = json.loads(capsys.readouterr().out)
    assert code == 1
    assert "exists" in out["snapshot_error"]
    assert len(list((usage_dir / "history").glob("*.json"))) == 1


def test_default_run_ts_is_the_newest_insights_command(usage_dir, projects_dir, write_transcript, capsys):
    write_transcript("r1", [plain_user("2026-08-31T00:00:00Z"), insights_command("2026-09-01T00:00:00Z")])
    write_transcript("r2", [plain_user("2026-09-30T00:00:00Z"), insights_command("2026-10-01T00:00:00Z")])

    idl.main(["--usage-dir", str(usage_dir), "--projects-dir", str(projects_dir)])

    out = json.loads(capsys.readouterr().out)
    assert out["window"] == {"start": "2026-09-01T00:00:00+00:00", "end": "2026-10-01T00:00:00+00:00", "source": "transcripts"}


def test_window_bounds_are_start_inclusive_end_exclusive(usage_dir, projects_dir, write_meta, write_transcript):
    write_transcript("r1", [plain_user("2026-08-31T00:00:00Z"), insights_command("2026-09-01T00:00:00Z")])
    write_meta("at-start", "2026-09-01T00:00:00Z")
    write_meta("at-end", RUN_TS)

    report = build(usage_dir, projects_dir)

    assert report["current"]["n_sessions"] == 1
    assert report["previous"]["n_sessions"] == 0


def test_transcript_without_timestamps_is_not_counted_as_started(usage_dir, projects_dir, write_transcript):
    write_transcript("no-ts", [{"type": "summary", "summary": "x"}])

    assert build(usage_dir, projects_dir)["coverage"]["transcripts_started"] == 0


def test_malformed_count_maps_read_as_empty(usage_dir, projects_dir, write_meta):
    write_meta("a", "2026-09-10T00:00:00Z", tool_counts=["Edit"], tool_error_categories="oops")

    rates = build(usage_dir, projects_dir)["current"]["rates"]

    assert rates["edit_per_session"] == 0.0
    assert rates["user_rejected_per_session"] == 0.0


def test_assistant_message_quoting_the_marker_is_not_a_run(usage_dir, projects_dir, write_transcript):
    quote = {"type": "assistant", "timestamp": "2026-09-01T00:00:00Z", "message": {"content": "<command-name>/insights</command-name>"}}
    write_transcript("quoter", [quote])

    assert build(usage_dir, projects_dir)["window"]["source"] == "none"


def test_command_in_text_block_counts_but_odd_content_does_not(usage_dir, projects_dir, write_transcript):
    block = {"type": "text", "text": "<command-name>/insights</command-name>"}
    as_block = {"type": "user", "timestamp": "2026-09-01T00:00:00Z", "message": {"content": [block]}}
    odd = {"type": "user", "timestamp": "2026-09-20T00:00:00Z", "message": {"content": None}, "note": "<command-name>/insights</command-name>"}
    write_transcript("blocks", [as_block, odd])

    assert build(usage_dir, projects_dir)["window"]["start"] == "2026-09-01T00:00:00+00:00"


def test_unparseable_and_non_object_lines_are_skipped(usage_dir, projects_dir):
    path = projects_dir / "-proj" / "messy.jsonl"
    marker_line = json.dumps(insights_command("2026-09-01T00:00:00Z"))
    path.write_text("{broken <command-name>/insights</command-name>\n[\"<command-name>/insights</command-name>\"]\n" + marker_line + "\n")

    assert build(usage_dir, projects_dir)["window"]["start"] == "2026-09-01T00:00:00+00:00"


def test_unreadable_transcript_is_skipped(usage_dir, projects_dir, write_transcript):
    (projects_dir / "-proj" / "dir.jsonl").mkdir()
    write_transcript("ok", [insights_command("2026-09-01T00:00:00Z")])

    assert build(usage_dir, projects_dir)["window"]["start"] == "2026-09-01T00:00:00+00:00"


def test_default_run_ts_refuses_a_run_that_already_has_a_snapshot(usage_dir, projects_dir, write_transcript, capsys):
    write_transcript("r1", [plain_user("2026-08-31T00:00:00Z"), insights_command("2026-09-01T00:00:00Z")])
    snapshot = {"schema": 1, "run_ts": "2026-09-01T00:00:00+00:00", "window_start": None, "summary": {}}
    (usage_dir / "history" / "2026-09-01T000000Z.json").write_text(json.dumps(snapshot))

    code = idl.main(["--usage-dir", str(usage_dir), "--projects-dir", str(projects_dir)])

    captured = capsys.readouterr()
    assert code == 2
    assert captured.out == ""
    assert "--run-ts" in captured.err


def test_duplicate_run_timestamps_do_not_collapse_the_previous_window(usage_dir, projects_dir, write_transcript):
    write_transcript("r0", [insights_command("2026-08-01T00:00:00Z")])
    write_transcript("r1", [insights_command("2026-09-01T00:00:00Z")])
    write_transcript("r1-fork", [insights_command("2026-09-01T00:00:00Z")])

    report = build(usage_dir, projects_dir)

    assert report["previous_window"] == {"start": "2026-08-01T00:00:00+00:00", "end": "2026-09-01T00:00:00+00:00"}


def test_script_runs_isolated_the_way_the_skill_invokes_it(usage_dir, projects_dir):
    import subprocess
    import sys

    script = Path(idl.__file__).resolve()
    argv = [sys.executable, "-I", str(script), "--usage-dir", str(usage_dir), "--projects-dir", str(projects_dir), "--run-ts", RUN_TS]

    result = subprocess.run(argv, capture_output=True, text=True, cwd=str(usage_dir))

    assert result.returncode == 0, result.stderr
    assert json.loads(result.stdout)["window"]["source"] == "none"
