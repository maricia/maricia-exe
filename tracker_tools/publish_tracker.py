#!/usr/bin/env python3
"""
publish_tracker.py

Builds tracker.json, commits it to your maricia.com Git repo, and pushes it.

Recommended:
  python tracker_tools/publish_tracker.py

Safer first test:
  python tracker_tools/publish_tracker.py --no-push

Custom tracker:
  python tracker_tools/publish_tracker.py --tracker private/Tracker_v25_Master_Clean_Audit.xlsx
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from datetime import date
from pathlib import Path


def repo_root_from_script() -> Path:
    here = Path(__file__).resolve()
    if here.parent.name.lower() in {"tracker_tools", "tools"}:
        return here.parent.parent
    return here.parent


def run(cmd, cwd: Path, check: bool = True) -> subprocess.CompletedProcess:
    print("+ " + " ".join(str(x) for x in cmd))
    return subprocess.run(cmd, cwd=str(cwd), text=True, check=check)


def main() -> int:
    parser = argparse.ArgumentParser(description="Build and publish tracker.json to GitHub Pages.")
    parser.add_argument("--tracker", help="Path to Tracker Excel workbook.")
    parser.add_argument("--output", default="tracker.json", help="Output JSON path relative to repo root.")
    parser.add_argument("--message", help="Git commit message.")
    parser.add_argument("--no-push", action="store_true", help="Commit locally but do not push.")
    parser.add_argument("--no-commit", action="store_true", help="Build only. Do not commit or push.")
    args = parser.parse_args()

    root = repo_root_from_script()
    tools_dir = Path(__file__).resolve().parent
    build_script = tools_dir / "build_tracker_json.py"

    if not build_script.exists():
        raise SystemExit(f"Could not find build script: {build_script}")

    build_cmd = [sys.executable, str(build_script), "--output", str(root / args.output)]
    if args.tracker:
        build_cmd += ["--tracker", args.tracker]

    run(build_cmd, cwd=root)

    if args.no_commit:
        print("Build complete. Skipping git commit/push because --no-commit was used.")
        return 0

    # Make sure this is a Git repo.
    try:
        run(["git", "rev-parse", "--is-inside-work-tree"], cwd=root)
    except subprocess.CalledProcessError:
        raise SystemExit(
            f"\nThis folder does not look like a Git repo:\n  {root}\n\n"
            "Run this from inside your maricia.com repo, or move tracker_tools into that repo."
        )

    # Stage only the public JSON by default.
    run(["git", "add", args.output], cwd=root)

    status = subprocess.run(
        ["git", "status", "--porcelain", args.output],
        cwd=str(root),
        text=True,
        capture_output=True,
        check=True,
    )

    if not status.stdout.strip():
        print("No tracker.json changes to commit. Website already matches current tracker.")
        return 0

    message = args.message or f"Update job tracker data {date.today().isoformat()}"
    run(["git", "commit", "-m", message], cwd=root)

    if args.no_push:
        print("Commit complete. Skipping push because --no-push was used.")
        return 0

    run(["git", "push"], cwd=root)
    print("Published. Give GitHub Pages a minute, then hard refresh the dashboard.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
