from datetime import datetime, timezone
from pathlib import Path
import unittest

from export_repo import ROOT, default_output


class DefaultOutputTests(unittest.TestCase):
    def test_uses_datetime_name_in_repo_exports_directory(self) -> None:
        now = datetime(2026, 11, 18, 14, 30, 5, tzinfo=timezone.utc)

        self.assertEqual(
            default_output(now),
            ROOT / "exports" / "could-i-live-here-review-2026-11-18_14-30-05.zip",
        )


if __name__ == "__main__":
    unittest.main()
