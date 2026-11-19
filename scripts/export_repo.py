#!/usr/bin/env python3
"""Zip the files Git considers unignored, including currently untracked source files.

Works before the user's first `git init` by using an isolated temporary Git index.
Never includes .git metadata, gitignored dependencies, or local .env secrets.
"""
from __future__ import annotations

from argparse import ArgumentParser
from datetime import datetime
from pathlib import Path
import subprocess
import re
import tempfile
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent.parent
EXPORTS_DIR = ROOT / "exports"
HARD_EXCLUDES = {".git", "node_modules", ".next", ".vercel", "artifacts", "coverage", "__pycache__"}
# A gitignore-aware export is NOT a credential scanner. Still refuse common
# private-key and credential-container formats, even when someone accidentally
# tracked them. The user must inspect the archive before sharing it.
SENSITIVE_NAMES = {
    "id_rsa", "id_ed25519", "id_ecdsa", "id_dsa", "credentials", "credentials.json",
    "service-account.json", "service_account.json", ".netrc", ".git-credentials",
}
SENSITIVE_SUFFIXES = {".pem", ".key", ".p12", ".pfx", ".jks", ".keystore", ".kdbx"}

# Conservative content checks for recognizable credential formats, not a
# replacement for a professional secret scanner or a Git history audit.
SECRET_PATTERNS = [
    re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    re.compile(rb"AKIA[A-Z0-9]{16}"),
    re.compile(rb"gh[pousr]_[a-zA-Z0-9]{32,}"),
    re.compile(rb"github_pat_[a-zA-Z0-9_]{30,}"),
    re.compile(rb"sk-proj-[a-zA-Z0-9_-]{24,}"),
]

def contains_obvious_secret(path: Path) -> bool:
    # Read individual candidate files, not Git's commit history. Avoid building
    # a complete archive before finding secrets in the selected source.
    content = path.read_bytes()
    return any(pattern.search(content) for pattern in SECRET_PATTERNS)



def default_output(now: datetime | None = None) -> Path:
    timestamp = (now or datetime.now().astimezone()).strftime("%Y-%m-%d_%H-%M-%S")
    return EXPORTS_DIR / f"could-i-live-here-review-{timestamp}.zip"


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
    if any(part in HARD_EXCLUDES for part in parts):
        return False
    if any(part.lower().startswith(".env") for part in parts):
        return False
    if any(part.lower() in SENSITIVE_NAMES for part in parts):
        return False
    if path.suffix.lower() in SENSITIVE_SUFFIXES:
        return False
    if path.is_symlink() or not path.is_file():
        return False
    return path.resolve().is_relative_to(root.resolve())


def main() -> None:
    parser = ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=default_output())
    args = parser.parse_args()
    target = args.output.expanduser().resolve()
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.is_relative_to(ROOT) and not target.is_relative_to(EXPORTS_DIR):
        raise SystemExit("Put the export ZIP outside the repository or in its exports directory")
    names = [name for name in git_entries(ROOT) if safe_include(ROOT / name, ROOT)]
    flagged = [name for name in names if contains_obvious_secret(ROOT / name)]
    if flagged:
        raise SystemExit("Refusing export: possible credential content in " + ", ".join(flagged))
    with ZipFile(target, "w", ZIP_DEFLATED, compresslevel=9) as archive:
        for name in names:
            archive.write(ROOT / name, arcname=f"could-i-live-here/{name}")
    print(f"Exported {len(names)} unignored, filtered source files to {target} ({target.stat().st_size:,} bytes)")
    print("WARNING: Simple credential patterns are not a comprehensive secret or Git history scan. Inspect the ZIP before sharing.")


if __name__ == "__main__":
    main()
