"""Real Chromium browser checks for the user flows that Node unit tests miss.

Default mode intercepts the external map STYLE with a tiny deterministic
GeoJSON fixture. GeoJSON parsing still exercises the *actual MapLibre worker*.
Set LIVE_MAP_STYLE=1 to verify the actual OpenFreeMap service as a separate,
network-dependent smoke test. Neither mode replaces manual visual review.

Run the built app on localhost:3000 before invoking these tests.
"""
import json
import os
import re
import time
import unittest
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright, expect

BASE_URL = os.environ.get("E2E_BASE_URL", "http://127.0.0.1:3000").rstrip("/")
LIVE_STYLE = os.environ.get("LIVE_MAP_STYLE") == "1"

# A map with a visible background and two line features, intentionally tiny.
# The GeoJSON source is decoded in MapLibre's worker, even though it does not
# need an external tile server. This catches a broken MapLibre 6 worker.
MOCK_STYLE = {
    "version": 8,
    "name": "Deterministic offline browser test",
    "sources": {
        "test-streets": {
            "type": "geojson",
            "data": {
                "type": "FeatureCollection",
                "features": [
                    {"type": "Feature", "properties": {}, "geometry": {
                        "type": "LineString",
                        "coordinates": [[-80.30, 35.82], [-80.20, 35.82]],
                    }},
                    {"type": "Feature", "properties": {}, "geometry": {
                        "type": "LineString",
                        "coordinates": [[-80.11, 36.07], [-80.06, 36.13]],
                    }},
                ],
            },
        }
    },
    "layers": [
        {"id": "base-background", "type": "background", "paint": {"background-color": "#f2f3ed"}},
        {"id": "test-roads", "type": "line", "source": "test-streets", "paint": {"line-color": "#607e6d", "line-width": 4}},
    ],
}


def wait_for_server():
    deadline = time.monotonic() + 45
    while time.monotonic() < deadline:
        try:
            with urllib.request.urlopen(BASE_URL + "/api/health", timeout=2) as response:
                if response.status in (200, 503):
                    return
        except Exception:
            time.sleep(0.5)
    raise RuntimeError(f"App did not start at {BASE_URL}; run 'pnpm build && pnpm start' first")


class ExplorerBrowserTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        wait_for_server()
        cls.playwright = sync_playwright().start()
        launch = {"headless": True, "args": ["--enable-webgl", "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"]}
        chrome = os.environ.get("E2E_CHROMIUM_EXECUTABLE")
        if chrome:
            launch["executable_path"] = chrome
        cls.browser = cls.playwright.chromium.launch(**launch)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.playwright.stop()

    def setUp(self):
        self.context = self.browser.new_context(viewport={"width": 1380, "height": 900})
        self.page = self.context.new_page()
        self.workers = []
        self.page.on("worker", lambda worker: self.workers.append(worker.url))
        if not LIVE_STYLE:
            self.page.route("**/styles/positron*", lambda route: route.fulfill(
                status=200, content_type="application/json", body=json.dumps(MOCK_STYLE)))
        self.page.goto(BASE_URL, wait_until="domcontentloaded")
        expect(self.page.locator(".map-shell[data-map-ready='true']")).to_be_visible(timeout=25000)

    def tearDown(self):
        self.context.close()

    def map_center(self):
        shell = self.page.locator(".map-shell")
        return float(shell.get_attribute("data-map-center-lat")), float(shell.get_attribute("data-map-center-lng"))

    def test_map_worker_and_source_are_alive(self):
        # A DOM container isn't a passing map test. A versioned WORKER must be
        # instantiated and finish GeoJSON processing before the ready flag.
        expect(self.page.locator(".map-warning")).to_have_count(0)
        self.assertTrue(any(re.search(r"/vendor/maplibre-gl/6\.19\.0/maplibre-gl-worker\.mjs", u)
                            for u in self.workers), f"Missing versioned worker, saw: {self.workers}")
        worker_url = next(url for url in self.workers if "maplibre-gl-worker.mjs" in url)
        with urllib.request.urlopen(worker_url, timeout=8) as response:
            self.assertEqual(response.status, 200)
            self.assertIn("javascript", response.headers.get("Content-Type", ""))
            self.assertGreater(len(response.read()), 1000)
        self.assertTrue(self.page.locator("canvas.maplibregl-canvas").is_visible())
        self.assertTrue(self.page.locator(".anchor-marker").is_visible())

    def test_sample_area_relocates_camera_and_pin(self):
        self.assertAlmostEqual(self.map_center()[0], 35.824, delta=0.015)
        self.page.locator("#area").select_option("west")
        expect(self.page.locator("#area")).to_have_value("west")
        expect(self.page.locator(".map-shell")).to_have_attribute(
            "data-map-center-lng", re.compile(r"-80\.28"), timeout=8000)
        self.assertAlmostEqual(self.map_center()[1], -80.282, delta=0.015)
        # A remains independently selectable and must jump to Kernersville.
        self.page.get_by_role("button", name=re.compile("Your current area")).click()
        expect(self.page.locator(".map-heading-label")).to_contain_text("KERNERSVILLE")
        expect(self.page.locator(".map-shell[data-map-ready='true']")).to_be_visible(timeout=25000)
        self.assertAlmostEqual(self.map_center()[0], 36.0745, delta=0.015)
        # Switching back must preserve B's selected sample area.
        self.page.get_by_role("button", name=re.compile("A possible move")).click()
        expect(self.page.locator("#area")).to_have_value("west")
        expect(self.page.locator(".map-shell[data-map-ready='true']")).to_be_visible(timeout=25000)
        self.assertAlmostEqual(self.map_center()[1], -80.282, delta=0.015)

    def test_filters_and_comparison_are_interactive(self):
        expect(self.page.locator(".category-chip[aria-pressed='true']")).to_have_count(0)
        self.page.get_by_role("button", name=re.compile("Fast food")).click()
        expect(self.page.locator(".category-chip[aria-pressed='true']")).to_have_count(1)
        expect(self.page.locator(".result-grid .results-card")).to_have_count(2)
        expect(self.page.locator(".map-warning")).to_have_count(0)
        self.page.get_by_role("button", name=re.compile("1 mi", re.I)).first.click()
        expect(self.page.locator(".map-hint")).to_contain_text("1 mi")

    def test_radius_boundary_warning_comes_and_goes(self):
        # Smith Crossing's 3-mile circle extends past the downloaded Kernersville
        # southern boundary; the default half-mile radius does not.
        self.page.get_by_role("button", name=re.compile("Your current area")).click()
        expect(self.page.locator(".coverage-warning")).to_have_count(0)
        self.page.get_by_role("button", name=re.compile(r"^3 mi$")).click()
        expect(self.page.locator(".coverage-warning")).to_contain_text("Partial map-data coverage")
        expect(self.page.locator(".results-card").first.locator(".coverage-note")).to_contain_text("Partial coverage")
        self.page.get_by_role("button", name=re.compile(r"^0\.5 mi$")).click()
        expect(self.page.locator(".coverage-warning")).to_have_count(0)

    def test_explanation_is_six_short_sections(self):
        self.page.get_by_role("button", name=re.compile("Why this exists")).click()
        dialog = self.page.get_by_role("dialog", name="Why this exists.")
        expect(dialog).to_be_visible()
        expect(dialog.locator(".decision-columns section")).to_have_count(6)
        self.page.keyboard.press("Escape")
        expect(dialog).not_to_be_visible()

    def test_tour_is_opt_in_and_radius_has_its_own_step(self):
        tour = self.page.locator(".tour-panel")
        # Record the tour's scroll instructions; the global page CSS uses smooth
        # scrolling, but stepping through the tour should jump immediately.
        self.page.evaluate("""() => {
            window.tourScrollBehaviors = [];
            const original = Element.prototype.scrollIntoView;
            Element.prototype.scrollIntoView = function (options) {
                if (this.hasAttribute("data-walkthrough")) {
                    window.tourScrollBehaviors.push(options?.behavior);
                }
                return original.call(this, options);
            };
        }""")
        expect(tour).to_have_count(0)  # Fresh visitor, no surprise overlay.
        self.page.get_by_role("button", name="Take the tour").click()
        expect(tour).to_contain_text("considering a move from Kernersville to Lexington")
        expect(self.page.locator(".tour-spotlight")).to_be_visible()
        # The visual highlight has room around the content and a clear gap to the card.
        bounds = self.page.evaluate("""() => {
            const spot = document.querySelector('.tour-spotlight').getBoundingClientRect();
            const intro = document.querySelector('[data-walkthrough="intro"]').getBoundingClientRect();
            const card = document.querySelector('.tour-panel').getBoundingClientRect();
            return { inset: intro.left - spot.left, gap: card.top - spot.bottom };
        }""")
        self.assertGreaterEqual(bounds["inset"], 15)
        self.assertGreaterEqual(bounds["gap"], 20)
        # Intro -> A/B -> sample area -> essentials -> radius (fifth of seven).
        for _ in range(4):
            tour.get_by_role("button", name=re.compile("Next")).click()
        expect(tour).to_contain_text("How far is nearby?")
        expect(tour).to_contain_text("5 of 7")
        expect(self.page.locator('[data-walkthrough="radius"]')).to_have_count(1)
        self.assertEqual(self.page.evaluate("() => window.tourScrollBehaviors"), ["instant"] * 5)
        self.assertEqual(
            self.page.locator(".tour-spotlight").evaluate("node => getComputedStyle(node).transitionDuration"),
            "0s",
        )
        self.page.keyboard.press("Escape")
        expect(tour).to_have_count(0)
        self.page.get_by_role("button", name="Take the tour").click()
        expect(tour).to_contain_text("A move. An everyday question.")
        tour.get_by_role("button", name="Skip tour").click()
        expect(tour).to_have_count(0)


if __name__ == "__main__":
    unittest.main()
