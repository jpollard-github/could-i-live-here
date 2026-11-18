#!/usr/bin/env python3
"""Zip the files Git considers unignored, including currently untracked source files.

Works before the user's first `git init` by using an isolated temporary Git index.
Never includes .git metadata, gitignored dependencies, or local .env secrets.
"""
from __future__ import annotations

from argparse import ArgumentParser
import os
from pathlib import Path
import subprocess
import tempfile
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
HARD_EXCLUDES = {".git", "node_modules", ".next", ".vercel", "artifacts", "coverage", "__pycache__"}


def git_entries(root: Path) -> list[str]:
    args = ["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"]
    if (root / ".git").exists():
        result = subprocess.run(args, cwd=root, stdout=subprocess.PIPE, check=True)
    else:
        # Git's real ignore engine is more accurate than a homegrown glob parser.
        with tempfile.TemporaryDirectory(prefix="repo-export-index-") as scratch:
            subprocess.run(["git", "init", "--quiet", scratch], check=True)
            result = subprocess.run(
                ["git", f"--git-dir={scratch}/.git", f"--work-tree={root}", *args[1:]],
                cwd=root, stdout=subprocess.PIPE, check=True,
            )
    entries = [value.decode("utf-8") for value in result.stdout.split(b"\0") if value]
    return sorted(set(entries))


def safe_include(path: Path, root: Path) -> bool:
    parts = path.relative_to(root).parts
    if any(part in HARD_EXCLUDES for part in parts) or any(part.startswith(".env") for part in parts):
        return False
    if path.is_symlink() or not path.is_file():
        return False
    return path.resolve().is_relative_to(root.resolve())


def main() -> None:
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT.parent / "could-i-live-here-review.zip")
    args = parser.parse_args()
    target = args.output.expanduser().resolve()
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.is_relative_to(ROOT):
        raise SystemExit("Put the export ZIP outside the repository (or in a gitignored directory)")
    names = [name for name in git_entries(ROOT) if safe_include(ROOT / name, ROOT)]
    with ZipFile(target, "w", ZIP_DEFLATED, compresslevel=9) as archive:
        for name in names:
            archive.write(ROOT / name, arcname=f"could-i-live-here/{name}")
    print(f"Exported {len(names)} unignored source files to {target} ({target.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
