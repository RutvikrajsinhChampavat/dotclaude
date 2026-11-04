"""Read Claude Code transcripts and bucket a session as dev, review or setup from its tool calls."""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Iterator

BUCKET_DEV = "dev"
BUCKET_REVIEW = "review"
BUCKET_SETUP = "setup"
BUCKET_UNCLASSIFIED = "unclassified"
BUCKETS = (BUCKET_DEV, BUCKET_REVIEW, BUCKET_SETUP, BUCKET_UNCLASSIFIED)
REVIEW_SKILLS = frozenset({
    "review", "code-review", "code-review:code-review", "pr-review-mechanics", "caveman-review", "caveman:caveman-review",
})
EDIT_TOOLS = frozenset({"Edit", "Write", "MultiEdit", "NotebookEdit"})
SCRATCH_MARKERS = ("/tmp/", "/scratchpad/")
SETUP_MARKER = "/.claude/"
CLAUDE_MD = "CLAUDE.md"
EDIT_PRODUCT = "product"
EDIT_SETUP = "setup"
TRANSCRIPT_GLOB = "*/*.jsonl"
SUBAGENT_GLOB = "subagents/*.jsonl"
CLASSIFY_NEEDLES = ('"tool_use"', "<command-name>")
COMMAND_PATTERN = re.compile(r"<command-name>/([\w:.-]+)</command-name>")
KEY_TYPE = "type"
KEY_MESSAGE = "message"
KEY_CONTENT = "content"
KEY_NAME = "name"
KEY_INPUT = "input"
RECORD_USER = "user"
RECORD_ASSISTANT = "assistant"
BLOCK_TOOL_USE = "tool_use"
TOOL_SKILL = "Skill"


def iter_records(path: Path, needles: tuple[str, ...] = ()) -> Iterator[dict]:
    """Yield JSON-object lines; with needles, parse only lines containing one of them."""
    try:
        with path.open(errors="replace") as handle:
            for line in handle:
                if needles and not any(needle in line for needle in needles):
                    continue
                try:
                    record = json.loads(line)
                except ValueError:
                    continue
                if isinstance(record, dict):
                    yield record
    except OSError:
        return


def transcript_index(projects_dir: Path) -> dict[str, Path]:
    return {path.stem: path for path in projects_dir.glob(TRANSCRIPT_GLOB)}


def session_transcripts(main: Path) -> list[Path]:
    return [main, *sorted((main.parent / main.stem).glob(SUBAGENT_GLOB))]


def edit_kind(tool_input: dict) -> str | None:
    path = str(tool_input.get("file_path") or tool_input.get("notebook_path") or "")
    if not path or any(marker in path for marker in SCRATCH_MARKERS):
        return None
    if SETUP_MARKER in path or Path(path).name == CLAUDE_MD:
        return EDIT_SETUP
    return EDIT_PRODUCT


def record_content(record: dict) -> object:
    return (record.get(KEY_MESSAGE) or {}).get(KEY_CONTENT)


def tool_uses(record: dict) -> list[dict]:
    content = record_content(record)
    if record.get(KEY_TYPE) != RECORD_ASSISTANT or not isinstance(content, list):
        return []
    return [block for block in content if isinstance(block, dict) and block.get(KEY_TYPE) == BLOCK_TOOL_USE]


def slash_commands(record: dict) -> list[str]:
    content = record_content(record)
    if record.get(KEY_TYPE) != RECORD_USER or not isinstance(content, str):
        return []
    return COMMAND_PATTERN.findall(content)


def record_signals(record: dict) -> tuple[bool, frozenset[str]]:
    uses = [(use.get(KEY_NAME), use.get(KEY_INPUT) or {}) for use in tool_uses(record)]
    skills = {str(tool_input.get("skill", "")) for name, tool_input in uses if name == TOOL_SKILL}
    invoked = skills | set(slash_commands(record))
    kinds = {edit_kind(tool_input) for name, tool_input in uses if name in EDIT_TOOLS}
    return bool(invoked & REVIEW_SKILLS), frozenset(kind for kind in kinds if kind is not None)


def classify_session(paths: list[Path]) -> str:
    """Product edits make a session dev even after a review skill; review needs no product edits."""
    if not paths:
        return BUCKET_UNCLASSIFIED

    signals = [record_signals(record) for path in paths for record in iter_records(path, CLASSIFY_NEEDLES)]
    kinds = frozenset().union(*(kinds for _, kinds in signals))
    if EDIT_PRODUCT in kinds:
        return BUCKET_DEV
    if any(review for review, _ in signals):
        return BUCKET_REVIEW
    return BUCKET_SETUP if EDIT_SETUP in kinds else BUCKET_DEV
