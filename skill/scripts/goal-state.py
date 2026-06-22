#!/usr/bin/env python3
"""
Minimal persistent state helper for the /goal skill.
Provides workspace-scoped goal state with simple locking.

Usage:
  python3 goal-state.py path          # Print state file path for this workspace
  python3 goal-state.py read          # Print current JSON state (or {})
  python3 goal-state.py write <json>  # Atomically write the provided JSON
  python3 goal-state.py snapshot      # Same as read (for parity with other helpers)

State location:
  ~/.grok/goals/goal-<workspace-id>.json

Workspace id derivation (best effort, cached in ~/.grok/goals/.ws-<hash>.id):
  1. git config --get remote.origin.url (normalized)
  2. git rev-parse --git-common-dir absolute path
  3. cwd absolute as fallback
"""
import json
import os
import sys
import subprocess
import hashlib
import fcntl
import tempfile
import shutil
from pathlib import Path

STATE_DIR = Path.home() / ".grok" / "goals"
STATE_DIR.mkdir(parents=True, exist_ok=True)

def _run(cmd, cwd=None):
    try:
        out = subprocess.check_output(cmd, cwd=cwd or os.getcwd(), stderr=subprocess.DEVNULL, text=True).strip()
        return out
    except Exception:
        return ""

def _cwd_key():
    return hashlib.sha256(str(Path.cwd().resolve()).encode()).hexdigest()[:16]

def _cache_path():
    return STATE_DIR / f".ws-{_cwd_key()}.id"

def get_workspace_id():
    cache = _cache_path()
    if cache.exists():
        try:
            cached = cache.read_text().strip()
            if cached:
                return cached
        except Exception:
            pass

    # 1. Remote URL
    url = _run(["git", "config", "--get", "remote.origin.url"])
    if url:
        url = url.lower().replace("git@", "https://").replace(".git", "").strip()
        wid = hashlib.sha256(url.encode()).hexdigest()[:12]
    else:
        # 2. Git common dir
        git_dir = _run(["git", "rev-parse", "--git-common-dir"])
        if git_dir:
            p = Path(git_dir).resolve()
            wid = hashlib.sha256(str(p).encode()).hexdigest()[:12]
        else:
            # 3. CWD fallback
            wid = hashlib.sha256(str(Path.cwd().resolve()).encode()).hexdigest()[:12]

    try:
        cache.write_text(wid)
    except Exception:
        pass

    return wid

def get_state_path():
    return STATE_DIR / f"goal-{get_workspace_id()}.json"

def read_state():
    path = get_state_path()
    if not path.exists():
        return {}
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return {}

def write_state(new_state: dict):
    path = get_state_path()
    path.parent.mkdir(parents=True, exist_ok=True)

    lock_path = path.with_suffix(".lock")
    with open(lock_path, "a+") as lockf:
        fcntl.flock(lockf.fileno(), fcntl.LOCK_EX)
        try:
            fd, tmp = tempfile.mkstemp(prefix="goal-state-", dir=str(path.parent))
            try:
                with os.fdopen(fd, "w") as tf:
                    json.dump(new_state, tf, indent=2)
                    tf.write("\n")
                shutil.move(tmp, path)
            except Exception:
                try:
                    os.unlink(tmp)
                except Exception:
                    pass
                raise
        finally:
            fcntl.flock(lockf.fileno(), fcntl.LOCK_UN)

    print(json.dumps({"path": str(path), "written": True}, indent=2))

def main():
    if len(sys.argv) < 2:
        print("Usage: goal-state.py path|read|write|snapshot [json|-]", file=sys.stderr)
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == "path":
        print(get_state_path())
        return
    if cmd in ("read", "snapshot"):
        print(json.dumps(read_state(), indent=2))
        return
    if cmd == "write":
        if len(sys.argv) < 3:
            print("write requires JSON argument or '-' to read from stdin", file=sys.stderr)
            sys.exit(2)
        raw = sys.argv[2]
        if raw == "-":
            raw = sys.stdin.read()
        try:
            new_state = json.loads(raw)
        except Exception as e:
            print(f"Invalid JSON: {e}", file=sys.stderr)
            sys.exit(4)
        write_state(new_state)
        return

    print(f"Unknown command: {cmd}", file=sys.stderr)
    sys.exit(1)

if __name__ == "__main__":
    main()
