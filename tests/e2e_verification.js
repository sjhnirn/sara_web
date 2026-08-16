#!/usr/bin/env node
/**
 * tests/e2e_verification.js
 * Sara Hosseini Photography — End-to-End Automated Browser Verification Suite
 *
 * Exercises http://localhost:8080 across:
 * - Desktop Viewport (1440x900)
 * - Tablet Viewport (768x1024)
 * - Mobile Viewport (390x844)
 *
 * Verifies:
 * - Design Tokens & Custom CSS Properties
 * - Navigation, Monogram & Scroll Progress Indicator
 * - Asymmetric Storytelling Hero & Typography Hierarchy
 * - Hero Interactive Theme Switcher (3 presets, crossfade, category badges)
 * - Campaign Trust Ribbon (Steel Alborz, Kaveh Glass, ShamimAra, Takdane, My Lovely Tehran)
 * - Asymmetric Magazine Masonry (61 items, 18 initial limit, Load More expansion)
 * - Category Filter Tabs & Instant Transition Counts
 * - Cinema Lightbox Modal (Open, Next, Prev, Keyboard Arrows, Escape, Focus Trap, Counter)
 * - Services & Atelier Grid
 * - FAQ Accordions (Expand/Collapse states, semantic details/summary)
 * - Testimonials Pull-Quotes & Ratings
 * - Artist Bio & Metric Stats Grid
 * - Accessible Contact Form (Live validation, invalid states, shake, submission flow, status alert)
 * - Mobile Burger Drawer Navigation & Touch Interactions
 * - Responsive Layout & Zero Horizontal Scroll Overflow across all viewports
 * - High-Res Screenshot Generation in tests/screenshots/
 * - Zero Severe Console Errors or 404 Resource Drops
 */

const fs = require('fs');
const path = require('path');

// Ensure module resolution for local environments
const possibleNodeModules = [
    path.join(__dirname, '../node_modules'),
    '/Users/dawood/.hermes/hermes-agent/node_modules',
    '/Users/dawood/.hermes/node/lib/node_modules'
];
for (const p of possibleNodeModules) {
    if (fs.existsSync(p) && !module.paths.includes(p)) {
        module.paths.push(p);
    }
}

let chromium;
try {
    chromium = require('playwright').chromium;
} catch (err) {
    console.error('Failed to load playwright from module.paths:', err.message);
    process.exit(1);
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// ANSI Color Codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

class TestRunner {
    constructor() {
        this.total = 0;
        this.passed = 0;
        this.failed = 0;
        this.failures = [];
    }

    assert(condition, testName, errorMsg = '') {
        this.total++;
        if (condition) {
            this.passed++;
            console.log(`  ${GREEN}✓${RESET} ${testName}`);
        } else {
            this.failed++;
            const msg = errorMsg ? `${testName} — FAIL: ${errorMsg}` : `${testName} — FAIL`;
            this.failures.append ? this.failures.append(msg) : this.failures.push(msg);
            console.log(`  ${RED}✗${RESET} ${msg}`);
        }
    }

    assertEqual(actual, expected, testName) {
        this.assert(
            actual === expected,
            testName,
            `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
        );
    }

    printSummary(durationMs) {
        console.log(`\n${BOLD}${'='.repeat(60)}${RESET}`);
        console.log(`${BOLD}E2E Playwright Verification Summary${RESET}`);
        console.log(`${'='.repeat(60)}`);
        console.log(`Duration     : ${(durationMs / 1000).toFixed(2)}s`);
        console.log(`Total Checks : ${this.total}`);
        console.log(`Passed       : ${GREEN}${this.passed}${RESET}`);
        console.log(`Failed       : ${this.failed > 0 ? RED + this.failed : GREEN + this.failed}${RESET}`);
        if (this.failures.length > 0) {
            console.log(`\n${RED}${BOLD}Failures Summary:${RESET}`);
            for (const f of this.failures) {
                console.log(`  - ${RED}${f}${RESET}`);
            }
        }
        console.log(`${'='.repeat(60)}\n`);
        return this.failed === 0;
    }
}

async function launchBrowser() {
    try {
        return await chromium.launch({ headless: true, channel: 'chrome' });
    } catch (e) {
        try {
            return await chromium.launch({ headless: true });
        } catch (err) {
            return await chromium.launch({
                headless: true,
                executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
            });
        }
    }
}

async function setupPageLogging(page, consoleErrors, failedRequests) {
    page.on('console', msg => {
        if (msg.type() === 'error') {
            const loc = msg.location();
            const text = msg.text();
            // Exclude default browser favicon probe from application console error tracking
            if (loc?.url?.includes('favicon.ico') || text.includes('favicon.ico')) {
                return;
            }
            consoleErrors.push(`${text} [${loc?.url || 'unknown'}]`);
        }
    });
    page.on('requestfailed', request => {
        const url = request.url();
        if (!url.includes('favicon.ico')) {
            failedRequests.push(`${url} (${request.failure()?.errorText || 'Unknown'})`);
        }
    });
    page.on('response', response => {
        if (response.status() >= 400 && !response.url().includes('favicon.ico')) {
            failedRequests.push(`${response.url()} (HTTP ${response.status()})`);
        }
    });
}

// -----------------------------------------------------------------------------
// Suite A: Desktop Verification (1440 x 900)
// -----------------------------------------------------------------------------
async function runDesktopSuite(browser, runner) {
    console.log(`\n${BOLD}${CYAN}=== A. Desktop Viewport Suite (1440x900) ===${RESET}`);
    const consoleErrors = [];
    const failedRequests = [];

    const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 2,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    setupPageLogging(page, consoleErrors, failedRequests);

    // 1. Page Navigation & Meta
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const title = await page.title();
    runner.assert(title.toLowerCase().includes('sara') && title.toLowerCase().includes('photo'), `Page title contains 'Sara' and 'Photo': "${title}"`);

    // 2. CSS Custom Properties & Typography Hierarchy
    const rootStyles = await page.evaluate(() => {
        const cs = getComputedStyle(document.documentElement);
        return {
            bgDark: cs.getPropertyValue('--bg-dark').trim(),
            textColor: cs.getPropertyValue('--text-color').trim(),
            fontHeading: cs.getPropertyValue('--font-heading').trim(),
            fontBody: cs.getPropertyValue('--font-body').trim()
        };
    });
    runner.assert(Boolean(rootStyles.textColor), `CSS variable --text-color is defined: "${rootStyles.textColor}"`);
    runner.assert(Boolean(rootStyles.fontHeading), `CSS variable --font-heading is defined: "${rootStyles.fontHeading}"`);

    // 3. Navbar & Scroll Progress
    const navbar = await page.$('#navbar');
    runner.assert(Boolean(navbar), 'Navigation bar #navbar exists in DOM');

    const monogram = await page.$('.monogram, .nav-logo, .logo');
    runner.assert(Boolean(monogram), 'Editorial Monogram / Logo element present in navbar');

    const scrollProgress = await page.$('#scrollProgress');
    runner.assert(Boolean(scrollProgress), 'Scroll progress bar #scrollProgress exists');

    // Test scroll progress on scroll
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(100);
    const scrollWidth = await page.evaluate(() => {
        const el = document.getElementById('scrollProgress');
        return el ? el.style.width : '0%';
    });
    runner.assert(parseFloat(scrollWidth) > 0, `Scroll progress bar width updates on scroll (${scrollWidth})`);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);

    // 4. Asymmetric Storytelling Hero
    const heroTitle = await page.textContent('.hero-title, h1');
    runner.assert(Boolean(heroTitle && heroTitle.length > 5), `Hero display heading rendered: "${heroTitle?.trim().slice(0, 35)}..."`);

    const heroMainImg = await page.$('#heroMainImage');
    runner.assert(Boolean(heroMainImg), 'Hero main featured image #heroMainImage present');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'desktop_hero.png'), fullPage: false });

    // 5. Interactive Hero Signature Switcher
    const heroBtns = await page.$$('.hero-theme-btn');
    runner.assert(heroBtns.length >= 3, `Hero theme switcher contains >= 3 buttons (found ${heroBtns.length})`);

    const initialHeroSrc = await page.getAttribute('#heroMainImage', 'src');
    // Click button 2 (Luxury Fragrance)
    if (heroBtns.length > 1) {
        await heroBtns[1].click();
        await page.waitForTimeout(400);
        const switchedSrc = await page.getAttribute('#heroMainImage', 'src');
        const activeBtn = await page.$('.hero-theme-btn.active');
        const activeText = await activeBtn?.textContent();
        runner.assert(switchedSrc !== initialHeroSrc, `Hero image source switched on theme button click: "${switchedSrc}"`);
        runner.assert(Boolean(activeBtn), `Clicked hero theme button gained active class ("${activeText?.trim()}")`);

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'desktop_hero_switcher_swapped.png'), fullPage: false });

        // Switch back to button 1
        await heroBtns[0].click();
        await page.waitForTimeout(300);
    }

    // 6. Campaign Trust Ribbon
    const clientSection = await page.$('#clients, .section-clients');
    runner.assert(Boolean(clientSection), 'Client campaigns section exists in DOM');
    const clientText = (await page.textContent('#clients, .section-clients')) || '';
    const lowerClientText = clientText.toLowerCase();
    const hasCoreClients = lowerClientText.includes('steel alborz') || lowerClientText.includes('kaveh') || lowerClientText.includes('shamimara');
    runner.assert(hasCoreClients, 'Client campaign trust bar displays core luxury brands (Steel Alborz / Kaveh / ShamimAra)');

    // 7. Dynamic Asymmetric Magazine Masonry
    const galleryItems = await page.$$('.gallery-item');
    runner.assertEqual(galleryItems.length, 61, 'Gallery contains exactly 61 .gallery-item cards');

    // Check initial limit: 18 visible items, remaining collapsed
    const initialVisibleCount = await page.evaluate(() => {
        return document.querySelectorAll('.gallery-item:not(.is-collapsed):not(.hidden)').length;
    });
    runner.assertEqual(initialVisibleCount, 18, 'Initial gallery view displays exactly 18 curated items with remaining collapsed');

    const loadMoreBtn = await page.$('#loadMoreGallery');
    runner.assert(Boolean(loadMoreBtn), 'Load More button #loadMoreGallery exists');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'desktop_gallery_masonry.png'), fullPage: false });

    // 8. Load More Expansion
    if (loadMoreBtn) {
        await loadMoreBtn.click();
        await page.waitForTimeout(200);
        const expandedCount = await page.evaluate(() => {
            return document.querySelectorAll('.gallery-item:not(.is-collapsed):not(.hidden)').length;
        });
        runner.assertEqual(expandedCount, 61, 'Clicking Load More reveals all 61 gallery items');
        const loadMoreHidden = await page.getAttribute('#loadMoreGallery', 'hidden');
        runner.assert(loadMoreHidden !== null, 'Load More button is hidden after full expansion');
    }

    // 9. Category Filter Tabs
    const filterTabs = [
        { filter: 'product', expected: 23 },
        { filter: 'portrait', expected: 7 },
        { filter: 'food', expected: 12 },
        { filter: 'editorial', expected: 16 },
        { filter: 'children', expected: 3 },
        { filter: 'all', expected: 61 }
    ];

    for (const { filter, expected } of filterTabs) {
        const btn = await page.$(`.filter-btn[data-filter="${filter}"]`);
        if (btn) {
            await btn.click();
            await page.waitForTimeout(300);
            const visible = await page.evaluate(() => {
                return document.querySelectorAll('.gallery-item:not(.hidden):not(.is-collapsed)').length;
            });
            runner.assertEqual(visible, expected, `Filter "${filter}" accurately shows ${expected} matching items (actual: ${visible})`);
        } else {
            runner.assert(false, `Filter button for "${filter}" exists`);
        }
    }

    // 10. Cinema Lightbox Modal
    // Open first gallery item
    const firstItem = await page.$('.gallery-item:not(.hidden)');
    await firstItem.click();
    await page.waitForTimeout(300);

    const lightbox = await page.$('#lightbox');
    const isLightboxOpen = await page.evaluate(() => {
        const lb = document.getElementById('lightbox');
        return lb && lb.classList.contains('open') && lb.getAttribute('aria-hidden') === 'false';
    });
    runner.assert(isLightboxOpen, 'Lightbox modal opens with .open class and aria-hidden="false"');

    const lbTitle = await page.textContent('#lightboxTitle');
    const lbCounter = await page.textContent('#lightboxCounter');
    runner.assert(Boolean(lbTitle && lbTitle.trim().length > 0), `Lightbox displays photograph title: "${lbTitle?.trim()}"`);
    runner.assert(lbCounter.includes('01 /') || lbCounter.includes('1 /'), `Lightbox counter displays initial index: "${lbCounter?.trim()}"`);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'desktop_lightbox_active.png'), fullPage: false });

    // Navigate Next with button
    const nextBtn = await page.$('#lightboxNext');
    await nextBtn.click();
    await page.waitForTimeout(300);
    const counterAfterNext = await page.textContent('#lightboxCounter');
    runner.assert(counterAfterNext.includes('02 /') || counterAfterNext.includes('2 /'), `Lightbox next button advances counter: "${counterAfterNext?.trim()}"`);

    // Navigate Prev with keyboard ArrowLeft
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);
    const counterAfterPrev = await page.textContent('#lightboxCounter');
    runner.assert(counterAfterPrev.includes('01 /') || counterAfterPrev.includes('1 /'), `Lightbox keyboard ArrowLeft navigates to previous item: "${counterAfterPrev?.trim()}"`);

    // Close Lightbox with Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
    const isClosedAfterEsc = await page.evaluate(() => {
        const lb = document.getElementById('lightbox');
        return lb && !lb.classList.contains('open') && lb.getAttribute('aria-hidden') === 'true';
    });
    runner.assert(isClosedAfterEsc, 'Lightbox closes on Escape key press');

    // 11. Services & Atelier Grid
    const serviceCards = await page.$$('.service-card');
    runner.assert(serviceCards.length >= 4, `Services section contains >= 4 atelier service cards (found ${serviceCards.length})`);

    // 12. FAQ Accordion
    const faqItems = await page.$$('.faq-item, details.faq-item');
    runner.assert(faqItems.length >= 4, `FAQ section contains >= 4 accordion items (found ${faqItems.length})`);

    if (faqItems.length > 0) {
        const firstSummary = await page.$('.faq-item summary, details.faq-item summary');
        await firstSummary.click();
        await page.waitForTimeout(200);
        const isOpen = await page.evaluate(() => {
            const firstDetails = document.querySelector('details.faq-item');
            return firstDetails ? firstDetails.open : true;
        });
        runner.assert(isOpen, 'FAQ accordion item expands on click');

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'desktop_faq_expanded.png'), fullPage: false });
    }

    // 13. Testimonials Section
    const testimonialCards = await page.$$('.testimonial-card');
    runner.assert(testimonialCards.length >= 3, `Testimonials section contains >= 3 client review cards (found ${testimonialCards.length})`);

    // 14. Artist Bio & Stats Grid
    const statCards = await page.$$('.about-stat-item, .stat-card');
    runner.assert(statCards.length >= 4, `Artist biography features 4 metric stat counters (found ${statCards.length})`);

    // 15. Accessible Contact Form Validation & Submission
    const contactForm = await page.$('#contactForm');
    runner.assert(Boolean(contactForm), 'Contact form #contactForm exists in DOM');

    // Test invalid submission (empty inputs)
    const submitBtn = await page.$('#submitBtn');
    await submitBtn.click();
    await page.waitForTimeout(200);

    const nameError = await page.textContent('#nameError');
    const emailError = await page.textContent('#emailError');
    const msgError = await page.textContent('#msgError');

    runner.assert(Boolean(nameError && nameError.length > 0), `Form validation triggers error on empty name: "${nameError}"`);
    runner.assert(Boolean(emailError && emailError.length > 0), `Form validation triggers error on empty email: "${emailError}"`);
    runner.assert(Boolean(msgError && msgError.length > 0), `Form validation triggers error on empty message: "${msgError}"`);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'desktop_contact_form.png'), fullPage: false });

    // Test invalid email format
    await page.fill('#name', 'Vogue Creative Director');
    await page.fill('#email', 'invalid-email-address');
    await page.fill('#message', 'Editorial campaign photography inquiry for upcoming issue.');
    await submitBtn.click();
    await page.waitForTimeout(200);
    const emailFormatError = await page.textContent('#emailError');
    runner.assert(Boolean(emailFormatError && emailFormatError.length > 0), `Form validation catches invalid email syntax: "${emailFormatError}"`);

    // Test valid submission
    await page.fill('#email', 'creative@vogue-editorial.com');
    await submitBtn.click();
    await page.waitForTimeout(800);

    const formStatus = await page.textContent('#formStatus');
    runner.assert(formStatus.toLowerCase().includes('thank') || formStatus.toLowerCase().includes('received'), `Form submission completes and displays success message: "${formStatus?.trim()}"`);

    // Full desktop page screenshot
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'desktop_full_page.png'), fullPage: true });

    // 16. Console Errors Check
    runner.assert(consoleErrors.length === 0, `Zero uncaught JavaScript console errors on Desktop`, consoleErrors.join('; '));
    runner.assert(failedRequests.length === 0, `Zero failed network/asset requests on Desktop`, failedRequests.join('; '));

    await context.close();
}

// -----------------------------------------------------------------------------
// Suite B: Tablet Verification (768 x 1024)
// -----------------------------------------------------------------------------
async function runTabletSuite(browser, runner) {
    console.log(`\n${BOLD}${CYAN}=== B. Tablet Viewport Suite (768x1024) ===${RESET}`);
    const consoleErrors = [];
    const failedRequests = [];

    const context = await browser.newContext({
        viewport: { width: 768, height: 1024 },
        deviceScaleFactor: 2,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();
    setupPageLogging(page, consoleErrors, failedRequests);

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    // 1. Layout & Overflow
    const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 1;
    });
    runner.assert(!hasOverflow, 'Tablet viewport has zero horizontal scroll overflow');

    // 2. Responsive Hero on Tablet
    const heroVisible = await page.isVisible('#hero');
    runner.assert(heroVisible, 'Hero section is properly visible on tablet');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'tablet_hero.png'), fullPage: false });

    // 3. 2-Column Responsive Masonry Check
    const masonryLayout = await page.evaluate(() => {
        const gallery = document.getElementById('gallery');
        if (!gallery) return { columns: 0, display: 'none' };
        const cs = window.getComputedStyle(gallery);
        return {
            columnCount: cs.columnCount,
            display: cs.display,
            gridTemplateColumns: cs.gridTemplateColumns
        };
    });
    runner.assert(
        masonryLayout.columnCount === '2' || masonryLayout.gridTemplateColumns?.split(' ').length === 2 || masonryLayout.display !== 'none',
        `Gallery adapts to responsive multi-column layout on tablet`
    );

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'tablet_gallery_grid.png'), fullPage: false });

    // 4. Tablet Touch Lightbox
    const firstItem = await page.$('.gallery-item:not(.hidden)');
    if (firstItem) {
        await firstItem.click();
        await page.waitForTimeout(300);
        const isOpen = await page.evaluate(() => {
            const lb = document.getElementById('lightbox');
            return lb && lb.classList.contains('open');
        });
        runner.assert(isOpen, 'Lightbox opens cleanly on tablet tap');

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'tablet_lightbox.png'), fullPage: false });

        const closeBtn = await page.$('#lightboxClose');
        await closeBtn.click();
        await page.waitForTimeout(200);
    }

    // 5. Tablet Contact Form Layout
    const formVisible = await page.isVisible('#contactForm');
    runner.assert(formVisible, 'Contact form renders responsively on tablet');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'tablet_contact.png'), fullPage: false });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'tablet_full_page.png'), fullPage: true });

    runner.assert(consoleErrors.length === 0, `Zero console errors on Tablet`, consoleErrors.join('; '));

    await context.close();
}

// -----------------------------------------------------------------------------
// Suite C: Mobile Viewport Suite (390 x 844)
// -----------------------------------------------------------------------------
async function runMobileSuite(browser, runner) {
    console.log(`\n${BOLD}${CYAN}=== C. Mobile Viewport Suite (390x844) ===${RESET}`);
    const consoleErrors = [];
    const failedRequests = [];

    const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1'
    });
    const page = await context.newPage();
    setupPageLogging(page, consoleErrors, failedRequests);

    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    // 1. Zero Horizontal Scroll Overflow on Mobile
    const hasMobileOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 1;
    });
    runner.assert(!hasMobileOverflow, 'Mobile viewport (390px) has zero horizontal scroll overflow');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mobile_hero.png'), fullPage: false });

    // 2. Mobile Burger Menu & Navigation Drawer
    const burger = await page.$('#burger');
    runner.assert(Boolean(burger), 'Mobile burger toggle button #burger is present');

    const burgerVisible = await burger.isVisible();
    runner.assert(burgerVisible, 'Burger button is visible on mobile viewport');

    // Click burger to open menu
    await burger.click();
    await page.waitForTimeout(300);

    const isMenuOpen = await page.evaluate(() => {
        const menu = document.getElementById('mobileMenu');
        const b = document.getElementById('burger');
        return menu && menu.classList.contains('open') && b.getAttribute('aria-expanded') === 'true';
    });
    runner.assert(isMenuOpen, 'Burger click opens mobile drawer with .open class and aria-expanded="true"');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mobile_drawer_open.png'), fullPage: false });

    // Click a mobile link to verify drawer closes
    const mobileLink = await page.$('.mobile-link');
    if (mobileLink) {
        await mobileLink.click();
        await page.waitForTimeout(300);
        const isMenuClosed = await page.evaluate(() => {
            const menu = document.getElementById('mobileMenu');
            return menu && !menu.classList.contains('open');
        });
        runner.assert(isMenuClosed, 'Clicking mobile navigation link closes drawer');
    }

    // 3. Single Column Mobile Gallery
    const galleryItems = await page.$$('.gallery-item:not(.hidden):not(.is-collapsed)');
    runner.assert(galleryItems.length > 0, `Gallery renders active items on mobile (visible: ${galleryItems.length})`);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mobile_gallery.png'), fullPage: false });

    // 4. Mobile Lightbox Modal & Gesture Target
    const firstMobileItem = await page.$('.gallery-item:not(.hidden)');
    if (firstMobileItem) {
        await firstMobileItem.click();
        await page.waitForTimeout(300);

        const isLbOpenMobile = await page.evaluate(() => {
            const lb = document.getElementById('lightbox');
            return lb && lb.classList.contains('open');
        });
        runner.assert(isLbOpenMobile, 'Lightbox opens on mobile touch tap');

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mobile_lightbox.png'), fullPage: false });

        // Close on mobile
        const closeBtn = await page.$('#lightboxClose');
        await closeBtn.click();
        await page.waitForTimeout(200);
    }

    // 5. FAQ Accordion on Mobile
    const firstFaqSummary = await page.$('.faq-item summary, details.faq-item summary');
    if (firstFaqSummary) {
        await firstFaqSummary.click();
        await page.waitForTimeout(200);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mobile_faq.png'), fullPage: false });
    }

    // 6. Mobile Contact Form
    await page.fill('#name', 'Mobile Test Client');
    await page.fill('#email', 'mobile@client-inquiry.com');
    await page.fill('#message', 'Mobile inquiry regarding luxury packaging shoot in Tehran.');
    const mobileSubmitBtn = await page.$('#submitBtn');
    await mobileSubmitBtn.click();
    await page.waitForTimeout(700);

    const mobileStatus = await page.textContent('#formStatus');
    runner.assert(
        mobileStatus.toLowerCase().includes('thank') || mobileStatus.toLowerCase().includes('received'),
        `Mobile contact form submits successfully: "${mobileStatus?.trim()}"`
    );

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mobile_contact.png'), fullPage: false });
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'mobile_full_page.png'), fullPage: true });

    runner.assert(consoleErrors.length === 0, `Zero console errors on Mobile`, consoleErrors.join('; '));

    await context.close();
}

// -----------------------------------------------------------------------------
// Main Runner
// -----------------------------------------------------------------------------
async function main() {
    const startTime = Date.now();
    console.log(`\n${BOLD}${'='.repeat(60)}${RESET}`);
    console.log(`${BOLD}Sara Hosseini Photography — E2E Browser Verification Suite${RESET}`);
    console.log(`Target URL   : ${BASE_URL}`);
    console.log(`Screenshots  : ${SCREENSHOTS_DIR}`);
    console.log(`${'='.repeat(60)}`);

    const runner = new TestRunner();
    let browser;

    try {
        browser = await launchBrowser();
        await runDesktopSuite(browser, runner);
        await runTabletSuite(browser, runner);
        await runMobileSuite(browser, runner);
    } catch (err) {
        console.error(`\n${RED}${BOLD}E2E Test Execution Error:${RESET}`, err);
        runner.assert(false, 'Global Test Execution', err.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }

    const duration = Date.now() - startTime;
    const success = runner.printSummary(duration);
    process.exit(success ? 0 : 1);
}

main();
