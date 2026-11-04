"""Scope /insights data to the window since the previous run and compare it with the window before."""
from __future__ import annotations

import argparse
import json
import sys
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

# python3 -I drops the script's directory from sys.path; restore only that, never the cwd.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from transcripts import (  # noqa: E402
    BUCKET_DEV, BUCKET_REVIEW, BUCKETS, KEY_TYPE, RECORD_USER, TRANSCRIPT_GLOB, classify_session, iter_records,
    record_content, session_transcripts, transcript_index,
)

INSIGHTS_MARKER = "<command-name>/insights</command-name>"
SNAPSHOT_SCHEMA = 2
TOP_SESSIONS = 5
SUMMARY_PREVIEW_CHARS = 140
JSON_GLOB = "*.json"
SESSION_META_DIR = "session-meta"
FACETS_DIR = "facets"
HISTORY_DIR = "history"
KEY_SESSION_ID = "session_id"
KEY_START_TIME = "start_time"
KEY_TIMESTAMP = "timestamp"
KEY_FRICTION_COUNTS = "friction_counts"
KEY_BRIEF_SUMMARY = "brief_summary"
KEY_RUN_TS = "run_ts"
KEY_WINDOW_START = "window_start"
KEY_SUMMARY = "summary"
KEY_FACETS = "facets"
KEY_RATES = "rates"
KEY_N_SESSIONS = "n_sessions"
KEY_BUCKETS = "buckets"
KEY_CATEGORIES = "categories"
KEY_WINDOW = "window"
KEY_CURRENT = "current"
KEY_PREVIOUS = "previous"
KEY_START = "start"
KEY_END = "end"
BASH_TOOL = "Bash"
USER_REJECTED = "User Rejected"
COMMAND_FAILED = "Command Failed"
CREDENTIAL_FRICTION = "credential_exposure"
ACHIEVED_OUTCOMES = ("fully_achieved", "mostly_achieved")
BAD_SIGNALS = ("dissatisfied", "frustrated")
SOURCE_SNAPSHOT = "snapshot"
SOURCE_TRANSCRIPTS = "transcripts"
SOURCE_NONE = "none"
PER_SESSION_TOOLS = {
    "edit_per_session": "Edit", "read_per_session": "Read", "bash_per_session": BASH_TOOL,
    "skill_per_session": "Skill", "agent_per_session": "Agent", "ask_user_question_per_session": "AskUserQuestion",
}
RATE_METRICS = tuple(PER_SESSION_TOOLS) + (
    "user_messages_per_session", "user_rejected_per_session", "command_failed_per_bash", "interruptions_per_session",
)
QUALITY_METRICS = ("achieved_share", "friction_per_faceted_session", "bad_signals_per_faceted_session")
REVIEW_METRICS = ("achieved_share", "friction_per_faceted_session", "user_rejected_per_session")
LOWER_IS_BETTER = frozenset({
    "user_rejected_per_session", "command_failed_per_bash", "interruptions_per_session",
    "friction_per_faceted_session", "bad_signals_per_faceted_session",
})
HIGHER_IS_BETTER = frozenset({"achieved_share"})
DEFAULT_USAGE_DIR = Path.home() / ".claude" / "usage-data"
DEFAULT_PROJECTS_DIR = Path.home() / ".claude" / "projects"


@dataclass(frozen=True)
class Session:
    session_id: str
    start: datetime
    meta: dict


@dataclass(frozen=True)
class Baseline:
    start: datetime | None
    source: str
    previous_start: datetime | None
    previous_end: datetime | None
    previous_summary: dict | None


def parse_ts(value: object) -> datetime | None:
    """Parse an ISO-8601 timestamp (trailing Z allowed) as aware UTC; None when invalid."""
    if not isinstance(value, str):
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return (parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)).astimezone(timezone.utc)


def iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


def window_bounds(start: datetime | None, end: datetime | None) -> dict:
    return {KEY_START: iso(start), KEY_END: iso(end)}


def in_window(stamp: datetime | None, start: datetime | None, end: datetime | None) -> bool:
    if stamp is None:
        return False
    return (start is None or stamp >= start) and (end is None or stamp < end)


def ratio(numerator: float, denominator: float) -> float | None:
    return numerator / denominator if denominator else None


def counts(value: object) -> dict[str, int]:
    """Numeric entries of a {name: count} mapping; anything malformed reads as empty."""
    if not isinstance(value, dict):
        return {}
    return {str(k): int(v) for k, v in value.items() if isinstance(v, (int, float))}


def read_json(path: Path) -> dict | None:
    try:
        data = json.loads(path.read_text())
    except (OSError, ValueError):
        return None
    return data if isinstance(data, dict) else None


def load_sessions(usage_dir: Path) -> tuple[list[Session], dict[str, dict], int]:
    metas = [(path, read_json(path)) for path in sorted((usage_dir / SESSION_META_DIR).glob(JSON_GLOB))]
    sessions = [
        Session(str(meta.get(KEY_SESSION_ID, path.stem)), parse_ts(meta.get(KEY_START_TIME)), meta)
        for path, meta in metas
        if meta is not None and parse_ts(meta.get(KEY_START_TIME)) is not None
    ]
    raw_facets = [(path, read_json(path)) for path in (usage_dir / FACETS_DIR).glob(JSON_GLOB)]
    facets = {str(f.get(KEY_SESSION_ID, path.stem)): f for path, f in raw_facets if f is not None}
    skipped = (len(metas) - len(sessions)) + (len(raw_facets) - len(facets))
    return sessions, facets, skipped


def is_insights_command(record: dict) -> bool:
    """True only for a user-typed /insights command, never a tool result quoting the marker."""
    if record.get(KEY_TYPE) != RECORD_USER:
        return False
    content = record_content(record)
    if isinstance(content, str):
        return INSIGHTS_MARKER in content
    if not isinstance(content, list):
        return False
    return any(isinstance(block, dict) and INSIGHTS_MARKER in str(block.get("text", "")) for block in content)


def command_timestamps(path: Path) -> list[datetime]:
    records = iter_records(path, (INSIGHTS_MARKER,))
    stamps = (parse_ts(r.get(KEY_TIMESTAMP)) for r in records if is_insights_command(r))
    return [stamp for stamp in stamps if stamp is not None]


def find_insights_runs(projects_dir: Path, current_session: str | None, before: datetime | None) -> list[datetime]:
    runs = (
        stamp
        for path in projects_dir.glob(TRANSCRIPT_GLOB)
        if path.stem != current_session
        for stamp in command_timestamps(path)
    )
    return sorted({stamp for stamp in runs if before is None or stamp < before})


def first_timestamp(path: Path) -> datetime | None:
    stamps = (parse_ts(r.get(KEY_TIMESTAMP)) for r in iter_records(path))
    return next((stamp for stamp in stamps if stamp is not None), None)


def count_transcripts_started(projects_dir: Path, start: datetime | None, end: datetime) -> int:
    return sum(1 for path in projects_dir.glob(TRANSCRIPT_GLOB) if in_window(first_timestamp(path), start, end))


def load_snapshots(history_dir: Path, before: datetime) -> list[dict]:
    snapshots = (read_json(path) for path in history_dir.glob(JSON_GLOB))
    valid = [s for s in snapshots if s is not None and in_window(parse_ts(s.get(KEY_RUN_TS)), None, before)]
    return sorted(valid, key=lambda s: parse_ts(s[KEY_RUN_TS]))


def has_snapshot_at_or_after(history_dir: Path, run_ts: datetime) -> bool:
    stamps = (parse_ts(s.get(KEY_RUN_TS)) for s in (read_json(p) for p in history_dir.glob(JSON_GLOB)) if s)
    return any(stamp is not None and stamp >= run_ts for stamp in stamps)


def resolve_baseline(usage_dir: Path, projects_dir: Path, run_ts: datetime, current_session: str | None) -> Baseline:
    """Prefer the newest stored snapshot; fall back to /insights commands found in transcripts."""
    snapshots = load_snapshots(usage_dir / HISTORY_DIR, run_ts)
    if snapshots:
        last = snapshots[-1]
        last_run = parse_ts(last[KEY_RUN_TS])
        return Baseline(last_run, SOURCE_SNAPSHOT, parse_ts(last.get(KEY_WINDOW_START)), last_run, last.get(KEY_SUMMARY))

    runs = find_insights_runs(projects_dir, current_session, run_ts)
    if not runs:
        return Baseline(None, SOURCE_NONE, None, None, None)

    previous_start = runs[-2] if len(runs) > 1 else None
    return Baseline(runs[-1], SOURCE_TRANSCRIPTS, previous_start, runs[-1], None)


def session_rates(metas: list[dict]) -> dict[str, float | None]:
    n = len(metas)
    tools = sum((Counter(counts(m.get("tool_counts"))) for m in metas), Counter())
    errors = sum((Counter(counts(m.get("tool_error_categories"))) for m in metas), Counter())
    return {
        **{name: ratio(tools[tool], n) for name, tool in PER_SESSION_TOOLS.items()},
        "user_messages_per_session": ratio(sum(int(m.get("user_message_count") or 0) for m in metas), n),
        "user_rejected_per_session": ratio(errors[USER_REJECTED], n),
        "command_failed_per_bash": ratio(errors[COMMAND_FAILED], tools[BASH_TOOL]),
        "interruptions_per_session": ratio(sum(int(m.get("user_interruptions") or 0) for m in metas), n),
    }


def facet_summary(pairs: list[tuple[Session, dict]]) -> dict:
    n = len(pairs)
    outcomes = Counter(str(facet.get("outcome")) for _, facet in pairs)
    friction = sum((Counter(counts(facet.get(KEY_FRICTION_COUNTS))) for _, facet in pairs), Counter())
    satisfaction = sum((Counter(counts(facet.get("user_satisfaction_counts"))) for _, facet in pairs), Counter())
    starts = sorted(session.start for session, _ in pairs)
    return {
        "n": n,
        "first": iso(starts[0]) if starts else None,
        "last": iso(starts[-1]) if starts else None,
        "outcomes": dict(outcomes),
        "friction": dict(friction),
        "satisfaction": dict(satisfaction),
        "achieved_share": ratio(sum(outcomes[o] for o in ACHIEVED_OUTCOMES), n),
        "friction_per_faceted_session": ratio(sum(friction.values()), n),
        "bad_signals_per_faceted_session": ratio(sum(satisfaction[s] for s in BAD_SIGNALS), n),
    }


def facet_pairs(sessions: list[Session], facets: dict[str, dict]) -> list[tuple[Session, dict]]:
    return [(s, facets[s.session_id]) for s in sorted(sessions, key=lambda s: s.start) if s.session_id in facets]


def summarize_bucket(sessions: list[Session], facets: dict[str, dict]) -> dict:
    return {
        KEY_N_SESSIONS: len(sessions),
        KEY_RATES: session_rates([s.meta for s in sessions]),
        KEY_FACETS: facet_summary(facet_pairs(sessions, facets)),
    }


def categorize(sessions: list[Session], index: dict[str, Path]) -> dict[str, str]:
    return {
        s.session_id: classify_session(session_transcripts(index[s.session_id]) if s.session_id in index else [])
        for s in sessions
    }


def summarize(sessions: list[Session], facets: dict[str, dict], categories: dict[str, str]) -> dict:
    """Totals for the whole window, plus one summary per bucket and each session's bucket."""
    members = {bucket: [s for s in sessions if categories.get(s.session_id) == bucket] for bucket in BUCKETS}
    return {
        **summarize_bucket(sessions, facets),
        KEY_BUCKETS: {bucket: summarize_bucket(group, facets) for bucket, group in members.items()},
        KEY_CATEGORIES: {s.session_id: categories[s.session_id] for s in sessions},
    }


def credential_flags(pairs: list[tuple[Session, dict]]) -> list[dict]:
    return [
        {KEY_SESSION_ID: s.session_id, KEY_START_TIME: iso(s.start), "detail": f.get("friction_detail")}
        for s, f in pairs
        if counts(f.get(KEY_FRICTION_COUNTS)).get(CREDENTIAL_FRICTION, 0) > 0
    ]


def concentration(pairs: list[tuple[Session, dict]]) -> dict:
    """Share of all friction held by the heaviest sessions, so one saga can't pass as a trend."""
    loads = sorted(((sum(counts(f.get(KEY_FRICTION_COUNTS)).values()), s, f) for s, f in pairs), key=lambda t: -t[0])
    total = sum(load for load, _, _ in loads)
    top = [entry for entry in loads if entry[0] > 0][:TOP_SESSIONS]
    sessions = [
        {KEY_SESSION_ID: s.session_id, KEY_START_TIME: iso(s.start), "friction_events": load,
         KEY_BRIEF_SUMMARY: str(f.get(KEY_BRIEF_SUMMARY, ""))[:SUMMARY_PREVIEW_CHARS]}
        for load, s, f in top
    ]
    return {"friction_total": total, "top_share": ratio(sum(load for load, _, _ in top), total), "top_sessions": sessions}


def verdict(metric: str, previous: float | None, current: float | None) -> str:
    if previous is None or current is None:
        return "n/a"
    if current == previous:
        return "flat"
    if metric not in LOWER_IS_BETTER and metric not in HIGHER_IS_BETTER:
        return "shift"
    improved = current < previous if metric in LOWER_IS_BETTER else current > previous
    return "better" if improved else "worse"


def metric_value(summary: dict | None, metric: str) -> float | None:
    if summary is None:
        return None
    section = summary.get(KEY_FACETS) if metric in QUALITY_METRICS else summary.get(KEY_RATES)
    return (section or {}).get(metric)


def sample_size(summary: dict | None, metric: str) -> int:
    if summary is None:
        return 0
    if metric in QUALITY_METRICS:
        return int((summary.get(KEY_FACETS) or {}).get("n", 0))
    return int(summary.get(KEY_N_SESSIONS, 0))


def comparison_row(metric: str, previous: dict | None, current: dict) -> dict:
    before, after = metric_value(previous, metric), metric_value(current, metric)
    return {
        "metric": metric, KEY_PREVIOUS: before, KEY_CURRENT: after, "verdict": verdict(metric, before, after),
        "n_previous": sample_size(previous, metric), "n_current": sample_size(current, metric),
    }


def compare(previous: dict | None, current: dict, metrics: tuple[str, ...] = RATE_METRICS + QUALITY_METRICS) -> list[dict]:
    return [comparison_row(metric, previous, current) for metric in metrics]


def bucket_comparisons(previous: dict | None, current: dict) -> dict:
    """Dev rows are the headline; review keeps a compact table; every bucket reports its n."""
    previous_buckets = (previous or {}).get(KEY_BUCKETS)
    before = previous_buckets or {}
    after = current[KEY_BUCKETS]
    return {
        "previous_buckets_available": previous_buckets is not None,
        "bucket_counts": {
            b: {KEY_PREVIOUS: before[b][KEY_N_SESSIONS] if b in before else None, KEY_CURRENT: after[b][KEY_N_SESSIONS]}
            for b in BUCKETS
        },
        "comparison": compare(before.get(BUCKET_DEV), after[BUCKET_DEV]),
        "review_comparison": compare(before.get(BUCKET_REVIEW), after[BUCKET_REVIEW], REVIEW_METRICS),
    }


def previous_summary(
    baseline: Baseline, sessions: list[Session], facets: dict[str, dict], index: dict[str, Path]
) -> dict | None:
    if baseline.source == SOURCE_NONE:
        return None
    if baseline.previous_summary is not None:
        return baseline.previous_summary
    window = [s for s in sessions if in_window(s.start, baseline.previous_start, baseline.previous_end)]
    return summarize(window, facets, categorize(window, index))


def build_report(usage_dir: Path, projects_dir: Path, run_ts: datetime, current_session: str | None) -> dict:
    sessions, facets, skipped = load_sessions(usage_dir)
    index = transcript_index(projects_dir)
    baseline = resolve_baseline(usage_dir, projects_dir, run_ts, current_session)
    window_sessions = [s for s in sessions if in_window(s.start, baseline.start, run_ts)]
    current = summarize(window_sessions, facets, categorize(window_sessions, index))
    previous = previous_summary(baseline, sessions, facets, index)
    dev_sessions = [s for s in window_sessions if current[KEY_CATEGORIES][s.session_id] == BUCKET_DEV]
    has_baseline = baseline.source != SOURCE_NONE
    return {
        KEY_RUN_TS: iso(run_ts),
        KEY_WINDOW: {**window_bounds(baseline.start, run_ts), "source": baseline.source},
        "previous_window": window_bounds(baseline.previous_start, baseline.previous_end) if has_baseline else None,
        "coverage": {
            "sessions_with_meta": len(window_sessions),
            "transcripts_started": count_transcripts_started(projects_dir, baseline.start, run_ts),
        },
        KEY_CURRENT: current,
        KEY_PREVIOUS: previous,
        **bucket_comparisons(previous, current),
        "flags": {
            "credential_exposure": credential_flags(facet_pairs(window_sessions, facets)),
            "concentration": concentration(facet_pairs(dev_sessions, facets)),
        },
        "skipped_files": skipped,
    }


def write_snapshot(
    history_dir: Path, run_ts: datetime, window_start: datetime | None, summary: dict, report_path: str | None
) -> Path:
    """Persist one run's window summary; exclusive create so a concurrent or repeated run never overwrites."""
    history_dir.mkdir(parents=True, exist_ok=True)
    path = history_dir / f"{run_ts.strftime('%Y-%m-%dT%H%M%SZ')}.json"
    payload = {
        "schema": SNAPSHOT_SCHEMA, KEY_RUN_TS: iso(run_ts), KEY_WINDOW_START: iso(window_start),
        "report_path": report_path, KEY_SUMMARY: summary,
    }
    with path.open("x") as handle:
        json.dump(payload, handle, indent=2)
    return path


def run_timestamp(value: str) -> datetime:
    parsed = parse_ts(value)
    if parsed is None:
        raise argparse.ArgumentTypeError(f"not an ISO-8601 timestamp: {value}")
    return parsed


def parse_args(argv: list[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--usage-dir", type=Path, default=DEFAULT_USAGE_DIR)
    parser.add_argument("--projects-dir", type=Path, default=DEFAULT_PROJECTS_DIR)
    parser.add_argument("--run-ts", type=run_timestamp, default=None, help="defaults to the newest /insights command")
    parser.add_argument("--current-session", default=None, help="session id to exclude from the baseline search")
    parser.add_argument("--write-snapshot", action="store_true")
    parser.add_argument("--report-path", default=None)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    newest_runs = find_insights_runs(args.projects_dir, None, None)
    run_ts = args.run_ts or (newest_runs[-1] if newest_runs else datetime.now(timezone.utc))
    if args.run_ts is None and has_snapshot_at_or_after(args.usage_dir / HISTORY_DIR, run_ts):
        sys.stderr.write(f"newest /insights command {iso(run_ts)} already has a snapshot; current run not found, pass --run-ts\n")
        return 2

    report = build_report(args.usage_dir, args.projects_dir, run_ts, args.current_session)
    exit_code = 0

    if args.write_snapshot:
        window_start = parse_ts(report[KEY_WINDOW][KEY_START])
        history_dir = args.usage_dir / HISTORY_DIR
        try:
            path = write_snapshot(history_dir, run_ts, window_start, report[KEY_CURRENT], args.report_path)
            report = {**report, "snapshot_path": str(path)}
        except FileExistsError as exc:
            report = {**report, "snapshot_error": f"snapshot already exists: {exc.filename}"}
            exit_code = 1

    sys.stdout.write(json.dumps(report, indent=2) + "\n")
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
