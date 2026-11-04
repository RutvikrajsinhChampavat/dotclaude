from __future__ import annotations

INSIGHTS_MARKER = "<command-name>/insights</command-name>"


def insights_command(timestamp: str) -> dict:
    return {"type": "user", "timestamp": timestamp, "message": {"role": "user", "content": f"{INSIGHTS_MARKER} run"}}


def plain_user(timestamp: str, text: str = "hello") -> dict:
    return {"type": "user", "timestamp": timestamp, "message": {"role": "user", "content": text}}


def tool_result_mentioning_marker(timestamp: str) -> dict:
    block = {"type": "tool_result", "tool_use_id": "t1", "content": f"grep hit {INSIGHTS_MARKER}"}
    return {"type": "user", "timestamp": timestamp, "message": {"role": "user", "content": [block]}}


def tool_use(timestamp: str, name: str, tool_input: dict) -> dict:
    block = {"type": "tool_use", "id": "u1", "name": name, "input": tool_input}
    return {"type": "assistant", "timestamp": timestamp, "message": {"role": "assistant", "content": [block]}}


def skill_call(timestamp: str, skill: str) -> dict:
    return tool_use(timestamp, "Skill", {"skill": skill})


def edit_call(timestamp: str, file_path: str) -> dict:
    return tool_use(timestamp, "Edit", {"file_path": file_path, "old_string": "a", "new_string": "b"})


def slash_command(timestamp: str, name: str) -> dict:
    content = f"<command-message>{name}</command-message>\n<command-name>/{name}</command-name>"
    return {"type": "user", "timestamp": timestamp, "message": {"role": "user", "content": content}}
