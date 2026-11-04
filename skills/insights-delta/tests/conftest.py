from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Callable

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


@pytest.fixture
def usage_dir(tmp_path: Path) -> Path:
    root = tmp_path / "usage-data"
    for sub in ("session-meta", "facets", "history"):
        (root / sub).mkdir(parents=True)
    return root


@pytest.fixture
def projects_dir(tmp_path: Path) -> Path:
    root = tmp_path / "projects" / "-proj"
    root.mkdir(parents=True)
    return root.parent


@pytest.fixture
def write_meta(usage_dir: Path) -> Callable[..., None]:
    def _write(session_id: str, start_time: str, **fields: Any) -> None:
        record = {
            "session_id": session_id,
            "start_time": start_time,
            "user_message_count": 1,
            "tool_counts": {},
            "tool_error_categories": {},
            "user_interruptions": 0,
        }
        record.update(fields)
        (usage_dir / "session-meta" / f"{session_id}.json").write_text(json.dumps(record))

    return _write


@pytest.fixture
def write_facet(usage_dir: Path) -> Callable[..., None]:
    def _write(session_id: str, **fields: Any) -> None:
        record = {
            "session_id": session_id,
            "outcome": "fully_achieved",
            "friction_counts": {},
            "user_satisfaction_counts": {},
            "brief_summary": f"summary {session_id}",
        }
        record.update(fields)
        (usage_dir / "facets" / f"{session_id}.json").write_text(json.dumps(record))

    return _write


@pytest.fixture
def write_transcript(projects_dir: Path) -> Callable[[str, list], None]:
    def _write(session_id: str, records: list) -> None:
        path = projects_dir / "-proj" / f"{session_id}.jsonl"
        path.write_text("\n".join(json.dumps(r) for r in records) + "\n")

    return _write

