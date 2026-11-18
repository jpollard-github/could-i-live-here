import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

script = Path(__file__).with_name("export_overture.py")
spec = importlib.util.spec_from_file_location("export_overture", script)
assert spec and spec.loader
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class ExtractTests(unittest.TestCase):
    bbox = [-80.34, 35.75, -80.16, 35.90]

    def feature(self, category, *, lat=35.824, lon=-80.2534, confidence=0.9):
        return {
            "type": "Feature", "id": "real-example-id",
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": {
                "names": {"primary": "Test name"}, "basic_category": category,
                "taxonomy": {"primary": category, "hierarchy": ["shopping", category]},
                "confidence": confidence,
            },
        }

    def test_exact_taxonomy_tokens(self):
        self.assertIsNone(mod.normalize(self.feature("car_park"), self.bbox))
        self.assertEqual(mod.normalize(self.feature("park"), self.bbox)["name"], "Test name")

    def test_bbox_and_confidence(self):
        self.assertIsNone(mod.normalize(self.feature("cafe", lon=-81), self.bbox))
        self.assertIsNone(mod.normalize(self.feature("cafe", confidence=0.1), self.bbox))

    def test_dedupe_and_skip_unrelated(self):
        with tempfile.TemporaryDirectory() as folder:
            target = Path(folder) / "sample.geojson"
            target.write_text(json.dumps({"type": "FeatureCollection", "features": [
                self.feature("cafe"), self.feature("cafe"), self.feature("car_park")
            ]}))
            records = mod.parse_geojson(target, self.bbox)
            self.assertEqual(len(records), 1)

    def test_empty_does_not_get_mistaken_for_success(self):
        with tempfile.TemporaryDirectory() as folder:
            target = Path(folder) / "empty.geojson"
            target.write_text('{"type":"FeatureCollection","features":[]}')
            with self.assertRaises(ValueError):
                mod.parse_geojson(target, self.bbox)


if __name__ == "__main__":
    unittest.main()
