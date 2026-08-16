#!/usr/bin/env python3
"""
tests/asset_integrity.py
Sara Hosseini Photography — Asset Integrity & Metadata Verification Suite

Validates:
1. Static image asset existence and integrity on disk (61 gallery images, hero assets, portrait).
2. Image formats and dimensions (valid WebP/PNG headers, non-zero dimensions, uncorrupted data).
3. index.html DOM metadata completeness for all 61 gallery items (data-category, data-index, data-title, data-client, data-year).
4. Category distribution count compliance (product: 23, portrait: 7, food: 12, editorial: 16, children: 3).
5. Hero interactive theme switcher dataset binding and asset targets.
6. Client campaign metadata preservation (Steel Alborz, Kaveh Glass, ShamimAra, My Lovely Tehran, etc.).
7. Live HTTP asset accessibility and 200 OK status codes against http://localhost:8080.
"""

import sys
import os
import re
import urllib.request
import urllib.error
from html.parser import HTMLParser
from pathlib import Path
try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
IMAGES_DIR = WORKSPACE_ROOT / "images"
INDEX_HTML = WORKSPACE_ROOT / "index.html"
STYLE_CSS = WORKSPACE_ROOT / "style.css"
SCRIPT_JS = WORKSPACE_ROOT / "script.js"
SERVER_URL = "http://localhost:8080"

# ANSI Colors
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


class TestRunner:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.total = 0
        self.failures = []

    def assert_true(self, condition, test_name, error_msg=""):
        self.total += 1
        if condition:
            self.passed += 1
            print(f"  {GREEN}✓{RESET} {test_name}")
        else:
            self.failed += 1
            full_msg = f"{test_name} — FAIL: {error_msg}" if error_msg else f"{test_name} — FAIL"
            self.failures.append(full_msg)
            print(f"  {RED}✗{RESET} {full_msg}")

    def assert_equal(self, actual, expected, test_name):
        self.assert_true(
            actual == expected,
            test_name,
            f"Expected {expected!r}, got {actual!r}"
        )

    def print_summary(self):
        print(f"\n{BOLD}{'='*60}{RESET}")
        print(f"{BOLD}Asset Integrity Test Summary{RESET}")
        print(f"{'='*60}")
        print(f"Total Checks : {self.total}")
        print(f"Passed       : {GREEN}{self.passed}{RESET}")
        print(f"Failed       : {RED if self.failed > 0 else GREEN}{self.failed}{RESET}")
        if self.failures:
            print(f"\n{RED}{BOLD}Failures Summary:{RESET}")
            for f in self.failures:
                print(f"  - {RED}{f}{RESET}")
        print(f"{'='*60}\n")
        return self.failed == 0


class IndexHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.gallery_items = []
        self.current_gallery_item = None
        self.hero_theme_buttons = []
        self.img_tags = []
        self.client_badges = []
        self.filter_buttons = []
        self.sections = []

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        classes = attrs_dict.get('class', '').split()

        if tag == 'section' or tag == 'header' or tag == 'footer' or tag == 'nav':
            if 'id' in attrs_dict:
                self.sections.append(attrs_dict['id'])

        if 'gallery-item' in classes:
            self.current_gallery_item = {
                'attrs': attrs_dict,
                'img': None,
                'caption_title': None,
                'caption_client': None,
                'caption_category': None,
            }
            self.gallery_items.append(self.current_gallery_item)

        if 'hero-theme-btn' in classes:
            self.hero_theme_buttons.append(attrs_dict)

        if 'filter-btn' in classes:
            self.filter_buttons.append(attrs_dict)

        if tag == 'img':
            self.img_tags.append(attrs_dict)
            if self.current_gallery_item is not None and self.current_gallery_item['img'] is None:
                self.current_gallery_item['img'] = attrs_dict

    def handle_endtag(self, tag):
        pass


def test_disk_image_assets(runner):
    print(f"\n{BOLD}{CYAN}1. Static Image Asset Files on Disk{RESET}")

    # Check images directory existence
    runner.assert_true(IMAGES_DIR.is_dir(), "images/ directory exists on disk")

    # Check gallery files gallery_1.webp through gallery_60.webp
    missing_gallery = []
    corrupted_gallery = []
    dimension_checks = []

    for i in range(1, 61):
        filename = f"gallery_{i}.webp"
        filepath = IMAGES_DIR / filename
        if not filepath.exists():
            missing_gallery.append(filename)
        else:
            size = filepath.stat().st_size
            if size == 0:
                corrupted_gallery.append(f"{filename} (0 bytes)")
            elif HAS_PIL:
                try:
                    with Image.open(filepath) as img:
                        w, h = img.size
                        fmt = img.format
                        if w <= 0 or h <= 0 or fmt != 'WEBP':
                            corrupted_gallery.append(f"{filename} (invalid dim/format: {w}x{h}, {fmt})")
                        else:
                            dimension_checks.append((filename, w, h))
                except Exception as e:
                    corrupted_gallery.append(f"{filename} (PIL error: {e})")

    runner.assert_true(
        len(missing_gallery) == 0,
        "All 60 gallery_*.webp files exist in images/",
        f"Missing: {missing_gallery}"
    )
    runner.assert_true(
        len(corrupted_gallery) == 0,
        "All 60 gallery_*.webp files are valid non-empty WebP images",
        f"Corrupted: {corrupted_gallery}"
    )

    # Check Hero assets & Photographer Portrait
    hero_assets = [
        "hero_spoon_still_life.webp",
        "hero_cocktail.webp",
        "hero_portrait.webp",
        "hero_bg.webp",
        "sara.png"
    ]
    for asset in hero_assets:
        filepath = IMAGES_DIR / asset
        exists = filepath.exists()
        runner.assert_true(exists, f"Asset exists: images/{asset}")
        if exists and HAS_PIL:
            try:
                with Image.open(filepath) as img:
                    w, h = img.size
                    runner.assert_true(
                        w > 0 and h > 0,
                        f"Asset dimensions valid for {asset}: {w}x{h}"
                    )
            except Exception as e:
                runner.assert_true(False, f"Asset valid for {asset}", str(e))


def test_html_gallery_metadata(runner, parser):
    print(f"\n{BOLD}{CYAN}2. Gallery DOM Metadata & Schema in index.html{RESET}")

    items = parser.gallery_items
    runner.assert_equal(len(items), 61, "Exact 61 .gallery-item elements present in index.html")

    categories = {
        'product': 0,
        'portrait': 0,
        'food': 0,
        'editorial': 0,
        'children': 0
    }
    missing_data_fields = []
    missing_img_elements = []
    missing_alt_texts = []
    invalid_indices = []

    for idx, item in enumerate(items):
        attrs = item['attrs']
        data_cat = attrs.get('data-category', '')
        data_idx = attrs.get('data-index', '')
        data_title = attrs.get('data-title', '')
        data_client = attrs.get('data-client', '')
        data_year = attrs.get('data-year', '')

        # Category counting
        if data_cat in categories:
            categories[data_cat] += 1
        else:
            missing_data_fields.append(f"Item {idx}: unknown category '{data_cat}'")

        # Index check
        if data_idx != str(idx):
            invalid_indices.append(f"Item {idx}: data-index is '{data_idx}'")

        # Required attributes
        if not data_title:
            missing_data_fields.append(f"Item {idx}: missing data-title")
        if not data_client:
            missing_data_fields.append(f"Item {idx}: missing data-client")
        if not data_year or not re.match(r'^\d{4}$', data_year):
            missing_data_fields.append(f"Item {idx}: missing/invalid data-year '{data_year}'")

        # Child img tag check
        img = item['img']
        if not img:
            missing_img_elements.append(f"Item {idx}: missing <img> tag")
        else:
            src = img.get('src', '')
            alt = img.get('alt', '')
            if not src:
                missing_img_elements.append(f"Item {idx}: <img> has empty src")
            else:
                img_path = WORKSPACE_ROOT / src
                if not img_path.exists():
                    missing_img_elements.append(f"Item {idx}: img src '{src}' not found on disk")
            if not alt:
                missing_alt_texts.append(f"Item {idx}: <img> missing alt attribute")

    runner.assert_true(
        len(invalid_indices) == 0,
        "All 61 gallery items have sequential data-index attributes (0 to 60)",
        f"Invalid indices: {invalid_indices}"
    )
    runner.assert_true(
        len(missing_data_fields) == 0,
        "All 61 gallery items have complete data attributes (category, title, client, year)",
        f"Defects: {missing_data_fields}"
    )
    runner.assert_true(
        len(missing_img_elements) == 0,
        "All 61 gallery items contain a valid <img> tag with existing source file",
        f"Defects: {missing_img_elements}"
    )
    runner.assert_true(
        len(missing_alt_texts) == 0,
        "All 61 gallery items contain accessible alt text",
        f"Defects: {missing_alt_texts}"
    )

    # Category counts validation
    print(f"\n{BOLD}{CYAN}3. Category Distribution Verification{RESET}")
    print(f"  Distribution: {categories}")
    runner.assert_equal(categories.get('product'), 23, "Category 'product' contains 23 items")
    runner.assert_equal(categories.get('portrait'), 7, "Category 'portrait' contains 7 items")
    runner.assert_equal(categories.get('food'), 12, "Category 'food' contains 12 items")
    runner.assert_equal(categories.get('editorial'), 16, "Category 'editorial' contains 16 items")
    runner.assert_equal(categories.get('children'), 3, "Category 'children' contains 3 items")
    total_cat_sum = sum(categories.values())
    runner.assert_equal(total_cat_sum, 61, "Sum of all category items equals exactly 61")


def test_hero_and_campaigns(runner, parser):
    print(f"\n{BOLD}{CYAN}4. Hero Switcher & Campaign Brand Integrity{RESET}")

    # Hero switcher buttons
    buttons = parser.hero_theme_buttons
    runner.assert_true(len(buttons) >= 3, f"Hero switcher has >= 3 theme buttons (found {len(buttons)})")

    for btn in buttons:
        src = btn.get('data-src', '')
        kicker = btn.get('data-kicker', '')
        alt = btn.get('data-alt', '')
        runner.assert_true(bool(src), f"Hero theme button has data-src: {src}")
        if src:
            target_path = WORKSPACE_ROOT / src
            runner.assert_true(target_path.exists(), f"Hero target image exists on disk: {src}")
        runner.assert_true(bool(kicker), f"Hero theme button has data-kicker: '{kicker}'")
        runner.assert_true(bool(alt), f"Hero theme button has data-alt: '{alt}'")

    # Client campaigns inspection in index.html content
    with open(INDEX_HTML, 'r', encoding='utf-8') as f:
        html_content = f.read()

    core_campaigns = [
        "Steel Alborz",
        "Kaveh Glass",
        "Takdane",
        "ShamimAra",
        "My Lovely Tehran"
    ]
    for campaign in core_campaigns:
        present = campaign.lower() in html_content.lower()
        runner.assert_true(present, f"Client campaign preserved in HTML: '{campaign}'")


def test_filter_tabs(runner, parser):
    print(f"\n{BOLD}{CYAN}5. Category Filter Bar Tabs Verification{RESET}")

    filter_keys = [btn.get('data-filter') for btn in parser.filter_buttons if 'data-filter' in btn]
    expected_filters = ['all', 'product', 'portrait', 'food', 'editorial', 'children']

    for expected in expected_filters:
        runner.assert_true(
            expected in filter_keys,
            f"Filter button exists for category: '{expected}'"
        )


def test_http_endpoints(runner):
    print(f"\n{BOLD}{CYAN}6. Live HTTP Asset Delivery (http://localhost:8080){RESET}")

    endpoints_to_test = [
        ("/", "text/html"),
        ("/index.html", "text/html"),
        ("/style.css", "text/css"),
        ("/script.js", "javascript"),
        ("/images/hero_spoon_still_life.webp", "image/webp"),
        ("/images/hero_cocktail.webp", "image/webp"),
        ("/images/hero_portrait.webp", "image/webp"),
        ("/images/hero_bg.webp", "image/webp"),
        ("/images/sara.png", "image/png"),
    ]

    # Add sample gallery images across all categories
    sample_gallery_ids = [1, 10, 20, 30, 40, 50, 60]
    for gid in sample_gallery_ids:
        endpoints_to_test.append((f"/images/gallery_{gid}.webp", "image/webp"))

    for endpoint, expected_content_type in endpoints_to_test:
        url = f"{SERVER_URL}{endpoint}"
        try:
            req = urllib.request.Request(url, method='HEAD')
            with urllib.request.urlopen(req, timeout=5) as response:
                status = response.getcode()
                content_type = response.headers.get('Content-Type', '')
                runner.assert_true(
                    status == 200,
                    f"HTTP 200 OK: {endpoint}",
                    f"Status {status}"
                )
                runner.assert_true(
                    expected_content_type in content_type.lower(),
                    f"Content-Type match for {endpoint} ({expected_content_type})",
                    f"Got Content-Type: {content_type}"
                )
        except Exception as e:
            runner.assert_true(False, f"HTTP request succeeded for {url}", str(e))


def main():
    print(f"\n{BOLD}{'='*60}{RESET}")
    print(f"{BOLD}Running Sara Hosseini Photography Asset Integrity Tests{RESET}")
    print(f"{'='*60}")

    runner = TestRunner()

    # Parse index.html
    parser = IndexHTMLParser()
    with open(INDEX_HTML, 'r', encoding='utf-8') as f:
        parser.feed(f.read())

    # Execute test suites
    test_disk_image_assets(runner)
    test_html_gallery_metadata(runner, parser)
    test_hero_and_campaigns(runner, parser)
    test_filter_tabs(runner, parser)
    test_http_endpoints(runner)

    success = runner.print_summary()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
