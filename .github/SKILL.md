---
name: repo-export
description: Prepare a reviewable source archive excluding gitignored and sensitive local files.
---

# Repo export

When asked to export the repository for code review, run `pnpm repo:export` from the project root. It uses the script `scripts/export_repo.py` and writes `../could-i-live-here-review.zip`. Pass `--output` directly to the Python script to choose a different path.

The script uses Git's ignore engine, includes tracked and untracked unignored files, excludes `.git` metadata and `.env` secrets, and works even before `git init`. It doesn't include installed packages or compiled artifacts. Inspect the ZIP contents before sharing outside the team. Never export credentials, private keys, or user data.
