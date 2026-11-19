from datetime import datetime, timezone
import tempfile
from pathlib import Path
import unittest

from export_repo import ROOT, contains_obvious_secret, default_output, safe_include


class DefaultOutputTests(unittest.TestCase):
    def test_uses_datetime_name_in_repo_exports_directory(self) -> None:
        now = datetime(2026, 11, 18, 14, 30, 5, tzinfo=timezone.utc)

        self.assertEqual(
            default_output(now),
            ROOT / "exports" / "could-i-live-here-review-2026-11-18_14-30-05.zip",
        )


if __name__ == "__main__":
    unittest.main()


class ExportSafetyTests(unittest.TestCase):
    def test_obvious_secret_files_are_never_exported(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            for name in (".env.local", "CLIENT.pem", "deploy.key", "account.p12", "id_ed25519", "credentials.json", "service-account.json"):
                candidate = root / name
                candidate.write_text("placeholder", encoding="utf-8")
                self.assertFalse(safe_include(candidate, root), name)
            normal = root / "README.md"
            normal.write_text("Safe example", encoding="utf-8")
            self.assertTrue(safe_include(normal, root))

    def test_sensitive_content_is_rejected_even_in_normally_named_files(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            sample = Path(folder) / "notes.txt"
            sample.write_text("KEY=" + "AKIA" + "Z" * 16, encoding="utf-8")
            self.assertTrue(contains_obvious_secret(sample))
            sample.write_text("Ordinary review notes and example data", encoding="utf-8")
            self.assertFalse(contains_obvious_secret(sample))

    def test_symlinks_and_git_metadata_are_excluded(self) -> None:
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / "README.md").write_text("safe", encoding="utf-8")
            link = root / "alias.txt"
            link.symlink_to(root / "README.md")
            self.assertFalse(safe_include(link, root))
            git = root / ".git"
            git.mkdir()
            hidden = git / "config"
            hidden.write_text("config", encoding="utf-8")
            self.assertFalse(safe_include(hidden, root))
