#!/usr/bin/env node
/**
 * tests/adversarial_stress_test.js
 * Sara Hosseini Photography — Empirical Adversarial Stress Testing Harness
 *
 * Authored by: makeover_challenger_1 (EMPIRICAL CHALLENGER)
 * Target: http://localhost:8080
 */

const fs = require('fs');
const path = require('path');

// Module resolution
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
    console.error('Failed to load playwright:', err.message);
    process.exit(1);
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

// ANSI Colors
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

class ChallengerRunner {
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
            this.failures.push(msg);
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

    printSummary() {
        console.log(`\n${BOLD}${'='.repeat(65)}${RESET}`);
        console.log(`${BOLD}Empirical Challenger Stress Test Summary${RESET}`);
        console.log(`${'='.repeat(65)}`);
        console.log(`Total Checks : ${this.total}`);
        console.log(`Passed       : ${GREEN}${this.passed}${RESET}`);
        console.log(`Failed       : ${this.failed > 0 ? RED + this.failed : GREEN + this.failed}${RESET}`);
        if (this.failures.length > 0) {
            console.log(`\n${RED}${BOLD}Failures Summary:${RESET}`);
            for (const f of this.failures) {
                console.log(`  - ${RED}${f}${RESET}`);
            }
        }
        console.log(`${'='.repeat(65)}\n`);
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

async function setupErrorTracking(page, errors, failedReqs) {
    page.on('console', msg => {
        if (msg.type() === 'error') {
            const loc = msg.location();
            const text = msg.text();
            if (loc?.url?.includes('favicon.ico') || text.includes('favicon.ico')) return;
            errors.push(`${text} [${loc?.url || 'inline'}]`);
        }
    });
    page.on('requestfailed', req => {
        if (!req.url().includes('favicon.ico')) {
            failedReqs.push(`${req.url()} (${req.failure()?.errorText || 'failed'})`);
        }
    });
    page.on('pageerror', err => {
        errors.push(`PageError: ${err.message}`);
    });
}

// =============================================================================
// STRESS TEST 1: Hero Theme Switcher Rapid Firing
// =============================================================================
async function testHeroSwitcherStress(page, runner) {
    console.log(`\n${BOLD}${CYAN}--- 1. Hero Theme Switcher Stress Testing ---${RESET}`);

    const buttons = await page.$$('.hero-theme-btn');
    runner.assert(buttons.length === 3, `Found exactly 3 hero theme switcher buttons (found ${buttons.length})`);

    // Rapid clicking 30 times in pseudo-random pattern with minimal delay (35ms)
    const sequence = [1, 2, 0, 1, 0, 2, 1, 2, 0, 2, 1, 0, 1, 2, 0, 1, 2, 0, 2, 1, 0, 2, 1, 0, 1, 2, 1, 0, 2, 1];
    for (const btnIdx of sequence) {
        await buttons[btnIdx].click();
        await page.waitForTimeout(35);
    }

    // Allow transition to settle (400ms)
    await page.waitForTimeout(400);

    // Final target was index 1 (Fragrance Concept)
    const lastTargetIdx = sequence[sequence.length - 1];
    const expectedSrc = await buttons[lastTargetIdx].getAttribute('data-src');
    const expectedKicker = await buttons[lastTargetIdx].getAttribute('data-kicker');

    const activeBtnIndex = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('.hero-theme-btn'));
        return btns.findIndex(b => b.classList.contains('active'));
    });
    const currentImgSrc = await page.getAttribute('#heroMainImage', 'src');
    const currentKicker = await page.textContent('#heroBadgeCat');
    const isFadeOutStuck = await page.evaluate(() => {
        const img = document.getElementById('heroMainImage');
        return img ? img.classList.contains('fade-out') : false;
    });

    runner.assertEqual(activeBtnIndex, lastTargetIdx, `Active button index is synchronized to final click (${lastTargetIdx})`);
    runner.assert(currentImgSrc.includes(expectedSrc), `Hero image src correctly updated after rapid clicking ("${currentImgSrc}")`);
    runner.assertEqual(currentKicker.trim(), expectedKicker.trim(), `Hero badge kicker text updated correctly ("${currentKicker.trim()}")`);
    runner.assert(!isFadeOutStuck, 'Hero image transition class .fade-out is cleanly removed');

    // Click back to 0 (Still Life) and verify settled state
    await buttons[0].click();
    await page.waitForTimeout(350);
    const zeroSrc = await page.getAttribute('#heroMainImage', 'src');
    runner.assert(zeroSrc.includes('hero_spoon_still_life.webp'), 'Hero image returned cleanly to Still Life preset');
}

// =============================================================================
// STRESS TEST 2: Category Filter Bar Rapid Thrashing
// =============================================================================
async function testCategoryFilterStress(page, runner) {
    console.log(`\n${BOLD}${CYAN}--- 2. Category Filter Bar Thrashing & Count Accuracy ---${RESET}`);

    const expectedCounts = {
        'all': 18, // before Load More is clicked
        'product': 23,
        'portrait': 7,
        'food': 12,
        'editorial': 16,
        'children': 3
    };

    const filterKeys = ['children', 'editorial', 'food', 'portrait', 'product', 'all'];

    // Rapid thrashing across all filters 24 times at 40ms intervals
    for (let i = 0; i < 24; i++) {
        const key = filterKeys[i % filterKeys.length];
        const btn = await page.$(`.filter-btn[data-filter="${key}"]`);
        if (btn) {
            await btn.click();
            await page.waitForTimeout(40);
        }
    }

    // Allow settle
    await page.waitForTimeout(350);

    // Verify each category specifically
    for (const [filterKey, expectedCount] of Object.entries(expectedCounts)) {
        const btn = await page.$(`.filter-btn[data-filter="${filterKey}"]`);
        await btn.click();
        await page.waitForTimeout(300);

        const visibleItemsCount = await page.evaluate(() => {
            return document.querySelectorAll('.gallery-item:not(.hidden):not(.is-collapsed)').length;
        });
        const visibleStuckFadeOut = await page.evaluate(() => {
            return document.querySelectorAll('.gallery-item:not(.hidden):not(.is-collapsed).fade-out').length;
        });

        runner.assertEqual(
            visibleItemsCount,
            expectedCount,
            `Filter "${filterKey}" displays exact count ${expectedCount} (actual: ${visibleItemsCount})`
        );
        runner.assertEqual(visibleStuckFadeOut, 0, `Zero visible gallery items have stuck .fade-out classes after filter "${filterKey}"`);
    }

    // Now test Load More expansion in 'all' mode
    const allBtn = await page.$('.filter-btn[data-filter="all"]');
    await allBtn.click();
    await page.waitForTimeout(250);

    const loadMoreBtn = await page.$('#loadMoreGallery');
    runner.assert(Boolean(loadMoreBtn), 'Load More button exists in DOM');

    const loadMoreInitialHidden = await page.getAttribute('#loadMoreGallery', 'hidden');
    runner.assert(loadMoreInitialHidden === null, 'Load More button is visible when 18 items displayed in All mode');

    // Click Load More to expand to 61 items
    await loadMoreBtn.click();
    await page.waitForTimeout(300);

    const fullItemsCount = await page.evaluate(() => {
        return document.querySelectorAll('.gallery-item:not(.hidden):not(.is-collapsed)').length;
    });
    runner.assertEqual(fullItemsCount, 61, 'All 61 gallery items are visible after Load More expansion');

    const loadMorePostHidden = await page.getAttribute('#loadMoreGallery', 'hidden');
    runner.assert(loadMorePostHidden !== null, 'Load More button is hidden after full expansion to 61 items');

    // Switching categories after expansion and back to 'all' should retain 61 items
    const productBtn = await page.$('.filter-btn[data-filter="product"]');
    await productBtn.click();
    await page.waitForTimeout(300);
    const prodCount = await page.evaluate(() => document.querySelectorAll('.gallery-item:not(.hidden):not(.is-collapsed)').length);
    runner.assertEqual(prodCount, 23, 'Product filter still shows 23 items after earlier expansion');

    await allBtn.click();
    await page.waitForTimeout(300);
    const allCountAfter = await page.evaluate(() => document.querySelectorAll('.gallery-item:not(.hidden):not(.is-collapsed)').length);
    runner.assertEqual(allCountAfter, 61, 'All filter retains 61 visible items after returning from category filter');
}

// =============================================================================
// STRESS TEST 3: Lightbox Modal Navigation, Touch, Keyboard & Focus Trap
// =============================================================================
async function testLightboxModalStress(page, runner) {
    console.log(`\n${BOLD}${CYAN}--- 3. Lightbox Modal Comprehensive Stress Testing ---${RESET}`);

    // A. Open from each category
    const categories = ['product', 'portrait', 'food', 'editorial', 'children'];
    for (const cat of categories) {
        const catBtn = await page.$(`.filter-btn[data-filter="${cat}"]`);
        await catBtn.click();
        await page.waitForTimeout(250);

        const firstVisibleItem = await page.$('.gallery-item:not(.hidden):not(.is-collapsed)');
        await firstVisibleItem.click();
        await page.waitForTimeout(250);

        const isOpen = await page.evaluate(() => {
            const lb = document.getElementById('lightbox');
            return lb && lb.classList.contains('open') && lb.getAttribute('aria-hidden') === 'false';
        });
        const lbCat = await page.textContent('#lightboxCategory');
        const lbCounter = await page.textContent('#lightboxCounter');

        runner.assert(isOpen, `Lightbox opens successfully from category "${cat}"`);
        runner.assert(Boolean(lbCat && lbCat.length > 0), `Lightbox shows category badge ("${lbCat?.trim()}") for "${cat}"`);
        runner.assert(lbCounter.includes('01 /') || lbCounter.includes('1 /'), `Lightbox counter starts at 01 for category "${cat}" ("${lbCounter?.trim()}")`);

        // Close via Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(200);
    }

    // Reset back to All filter
    const allBtn = await page.$('.filter-btn[data-filter="all"]');
    await allBtn.click();
    await page.waitForTimeout(250);

    // Open first item in All (61 total)
    const firstItem = await page.$('.gallery-item:not(.hidden):not(.is-collapsed)');
    await firstItem.click();
    await page.waitForTimeout(300);

    // B. Rapid Next Clicking & Wrap-Around
    const nextBtn = await page.$('#lightboxNext');
    for (let i = 0; i < 20; i++) {
        await nextBtn.click();
        await page.waitForTimeout(40);
    }
    await page.waitForTimeout(300);

    const counterAfterRapidNext = await page.textContent('#lightboxCounter');
    runner.assert(Boolean(counterAfterRapidNext && counterAfterRapidNext.includes('/ 61')), `Lightbox counter maintains valid format after 20 rapid Next clicks ("${counterAfterRapidNext?.trim()}")`);

    // C. Rapid Prev Clicking & Reverse Wrap-Around
    const prevBtn = await page.$('#lightboxPrev');
    for (let i = 0; i < 25; i++) {
        await prevBtn.click();
        await page.waitForTimeout(40);
    }
    await page.waitForTimeout(300);

    const counterAfterRapidPrev = await page.textContent('#lightboxCounter');
    runner.assert(Boolean(counterAfterRapidPrev && counterAfterRapidPrev.includes('/ 61')), `Lightbox counter maintains valid format after 25 rapid Prev clicks ("${counterAfterRapidPrev?.trim()}")`);

    // D. Rapid Alternating Keyboard Arrows (ArrowRight / ArrowLeft)
    for (let i = 0; i < 15; i++) {
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(30);
        await page.keyboard.press('ArrowLeft');
        await page.waitForTimeout(30);
    }
    await page.waitForTimeout(300);

    const activeImgSrc = await page.evaluate(() => {
        const active = document.querySelector('.lightbox-img.active');
        return active ? active.getAttribute('src') : null;
    });
    runner.assert(Boolean(activeImgSrc && activeImgSrc.includes('images/')), `Lightbox displays valid image source after rapid keyboard navigation: "${activeImgSrc}"`);

    // E. Touch Swipe Simulation using synthetic touch events on the lightbox container
    const initialCounterSwipe = await page.textContent('#lightboxCounter');
    const parseCount = (s) => parseInt(s.split('/')[0].trim(), 10);
    const initialIdx = parseCount(initialCounterSwipe);

    // Left swipe (simulate touchstart screenX=300, touchend screenX=100 -> diffX = -200) -> Next image
    await page.evaluate(() => {
        const lb = document.getElementById('lightbox');
        const makeTouchEvent = (type, x, y) => {
            const touchObj = {
                identifier: Date.now(),
                target: lb,
                screenX: x,
                screenY: y,
                clientX: x,
                clientY: y,
                pageX: x,
                pageY: y
            };
            const event = new CustomEvent(type, { bubbles: true, cancelable: true });
            event.changedTouches = [touchObj];
            event.touches = type === 'touchend' ? [] : [touchObj];
            return event;
        };

        lb.dispatchEvent(makeTouchEvent('touchstart', 300, 200));
        lb.dispatchEvent(makeTouchEvent('touchend', 100, 200));
    });
    await page.waitForTimeout(300);

    const afterLeftSwipeCounter = await page.textContent('#lightboxCounter');
    const leftSwipeIdx = parseCount(afterLeftSwipeCounter);
    const expectedNextIdx = initialIdx === 61 ? 1 : initialIdx + 1;
    runner.assertEqual(leftSwipeIdx, expectedNextIdx, `Left touch swipe advances image counter from ${initialIdx} to ${leftSwipeIdx}`);

    // Right swipe (touchstart screenX=100, touchend screenX=300 -> diffX = +200) -> Prev image
    await page.evaluate(() => {
        const lb = document.getElementById('lightbox');
        const makeTouchEvent = (type, x, y) => {
            const touchObj = {
                identifier: Date.now(),
                target: lb,
                screenX: x,
                screenY: y,
                clientX: x,
                clientY: y,
                pageX: x,
                pageY: y
            };
            const event = new CustomEvent(type, { bubbles: true, cancelable: true });
            event.changedTouches = [touchObj];
            event.touches = type === 'touchend' ? [] : [touchObj];
            return event;
        };

        lb.dispatchEvent(makeTouchEvent('touchstart', 100, 200));
        lb.dispatchEvent(makeTouchEvent('touchend', 300, 200));
    });
    await page.waitForTimeout(300);

    const afterRightSwipeCounter = await page.textContent('#lightboxCounter');
    const rightSwipeIdx = parseCount(afterRightSwipeCounter);
    runner.assertEqual(rightSwipeIdx, initialIdx, `Right touch swipe returns image counter to ${rightSwipeIdx}`);

    // Ambiguous micro gesture (diffX = 15, diffY = 10) -> should NOT trigger change or close
    await page.evaluate(() => {
        const lb = document.getElementById('lightbox');
        const makeTouchEvent = (type, x, y) => {
            const touchObj = {
                identifier: Date.now(),
                target: lb,
                screenX: x,
                screenY: y,
                clientX: x,
                clientY: y,
                pageX: x,
                pageY: y
            };
            const event = new CustomEvent(type, { bubbles: true, cancelable: true });
            event.changedTouches = [touchObj];
            event.touches = type === 'touchend' ? [] : [touchObj];
            return event;
        };

        lb.dispatchEvent(makeTouchEvent('touchstart', 200, 200));
        lb.dispatchEvent(makeTouchEvent('touchend', 215, 210));
    });
    await page.waitForTimeout(200);
    const isStillOpen = await page.evaluate(() => document.getElementById('lightbox').classList.contains('open'));
    runner.assert(isStillOpen, 'Micro-swipe gesture does not trigger unintended navigation or dismissal');

    // Downward swipe (touchstart screenY=100, touchend screenY=250 -> diffY = +150) -> Closes lightbox
    await page.evaluate(() => {
        const lb = document.getElementById('lightbox');
        const makeTouchEvent = (type, x, y) => {
            const touchObj = {
                identifier: Date.now(),
                target: lb,
                screenX: x,
                screenY: y,
                clientX: x,
                clientY: y,
                pageX: x,
                pageY: y
            };
            const event = new CustomEvent(type, { bubbles: true, cancelable: true });
            event.changedTouches = [touchObj];
            event.touches = type === 'touchend' ? [] : [touchObj];
            return event;
        };

        lb.dispatchEvent(makeTouchEvent('touchstart', 200, 100));
        lb.dispatchEvent(makeTouchEvent('touchend', 200, 250));
    });
    await page.waitForTimeout(300);

    const isClosedByDownSwipe = await page.evaluate(() => {
        const lb = document.getElementById('lightbox');
        return lb && !lb.classList.contains('open');
    });
    runner.assert(isClosedByDownSwipe, 'Downward vertical touch swipe dismisses lightbox modal');

    // F. Focus Trap Cycling Test
    // Re-open lightbox
    await firstItem.click();
    await page.waitForTimeout(250);

    // Tab through buttons
    const focusableCount = await page.evaluate(() => {
        const lb = document.getElementById('lightbox');
        return lb.querySelectorAll('button:not([disabled])').length;
    });
    runner.assert(focusableCount >= 3, `Lightbox contains >= 3 focusable controls (${focusableCount})`);

    // Focus last button and press Tab -> should wrap to first focusable
    await page.evaluate(() => {
        const lb = document.getElementById('lightbox');
        const focusable = lb.querySelectorAll('button:not([disabled])');
        focusable[focusable.length - 1].focus();
    });
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);

    const activeElementAfterTab = await page.evaluate(() => document.activeElement.id || document.activeElement.className);
    runner.assert(
        activeElementAfterTab.includes('lightboxClose') || activeElementAfterTab.includes('lightbox-close') || activeElementAfterTab.includes('lightboxPrev'),
        `Focus trap forwards wrap-around from last control to first control (focused: "${activeElementAfterTab}")`
    );

    // Focus first button and press Shift+Tab -> should wrap to last focusable
    await page.evaluate(() => {
        const lb = document.getElementById('lightbox');
        const focusable = lb.querySelectorAll('button:not([disabled])');
        focusable[0].focus();
    });
    await page.keyboard.press('Shift+Tab');
    await page.waitForTimeout(100);

    const activeElementAfterShiftTab = await page.evaluate(() => document.activeElement.id || document.activeElement.className);
    runner.assert(
        activeElementAfterShiftTab.includes('lightboxNext') || activeElementAfterShiftTab.includes('lightbox-next'),
        `Focus trap backwards wrap-around from first control to last control (focused: "${activeElementAfterShiftTab}")`
    );

    // Close via close button
    const closeBtn = await page.$('#lightboxClose');
    await closeBtn.click();
    await page.waitForTimeout(200);

    const isClosedFinal = await page.evaluate(() => !document.getElementById('lightbox').classList.contains('open'));
    runner.assert(isClosedFinal, 'Lightbox closed cleanly and state restored');
}

// =============================================================================
// STRESS TEST 4: Contact Form Boundary & Stress Testing
// =============================================================================
async function testContactFormStress(page, runner) {
    console.log(`\n${BOLD}${CYAN}--- 4. Contact Form Boundary & Validation Stress Testing ---${RESET}`);

    const submitBtn = await page.$('#submitBtn');
    const nameInput = await page.$('#name');
    const emailInput = await page.$('#email');
    const msgInput = await page.$('#message');

    // 1. Submit empty form
    await nameInput.fill('');
    await emailInput.fill('');
    await msgInput.fill('');
    await submitBtn.click();
    await page.waitForTimeout(200);

    const nameErr1 = await page.textContent('#nameError');
    const emailErr1 = await page.textContent('#emailError');
    const msgErr1 = await page.textContent('#msgError');

    runner.assert(Boolean(nameErr1 && nameErr1.includes('full name')), `Empty name displays descriptive error: "${nameErr1}"`);
    runner.assert(Boolean(emailErr1 && emailErr1.includes('valid email')), `Empty email displays descriptive error: "${emailErr1}"`);
    runner.assert(Boolean(msgErr1 && msgErr1.includes('details')), `Empty message displays descriptive error: "${msgErr1}"`);

    // 2. Boundary: Single-character name and whitespace-only name
    await nameInput.fill('A');
    await submitBtn.click();
    await page.waitForTimeout(150);
    const nameErr2 = await page.textContent('#nameError');
    runner.assert(Boolean(nameErr2 && nameErr2.length > 0), 'Single-letter name fails min-length validation');

    await nameInput.fill('     ');
    await submitBtn.click();
    await page.waitForTimeout(150);
    const nameErr3 = await page.textContent('#nameError');
    runner.assert(Boolean(nameErr3 && nameErr3.length > 0), 'Whitespace-only name fails validation');

    // 3. Email Boundary Cases
    const invalidEmails = [
        'plainaddress',
        '@missingusername.com',
        'username@.com',
        'username@domain..com',
        'username@domain',
        'user name@domain.com'
    ];
    await nameInput.fill('Valid Client Name');
    await msgInput.fill('This is a sufficiently long message over ten characters.');

    for (const badEmail of invalidEmails) {
        await emailInput.fill(badEmail);
        await submitBtn.click();
        await page.waitForTimeout(100);
        const emailErr = await page.textContent('#emailError');
        runner.assert(
            Boolean(emailErr && emailErr.length > 0),
            `Invalid email pattern "${badEmail}" is correctly rejected`
        );
    }

    // 4. Message Boundary: 9 characters and whitespace
    await emailInput.fill('valid.contact@vogue.fr');
    await msgInput.fill('123456789'); // 9 chars
    await submitBtn.click();
    await page.waitForTimeout(150);
    const msgErr2 = await page.textContent('#msgError');
    runner.assert(Boolean(msgErr2 && msgErr2.length > 0), '9-character message is rejected for being under 10 chars');

    // 5. XSS Injection & Special Character Payload Safety
    const xssPayload = '<script>alert("XSS")</script>&"\'<img src=x onerror=alert(1)>';
    await nameInput.fill(xssPayload);
    await emailInput.fill('security.audit@luxury-agency.com');
    await msgInput.fill(`Inquiry with special characters: ${xssPayload}`);

    // Click submit
    await submitBtn.click();
    await page.waitForTimeout(800);

    // Verify status text was set safely without unescaped script execution
    const statusText = await page.textContent('#formStatus');
    runner.assert(
        statusText.toLowerCase().includes('thank') || statusText.toLowerCase().includes('received'),
        `Form safely handles special characters and renders confirmation: "${statusText.trim()}"`
    );

    // 6. Rapid Multi-Click Submission Prevention (Button Lock)
    const isBtnDisabledDuringTransit = await page.getAttribute('#submitBtn', 'disabled');
    runner.assert(isBtnDisabledDuringTransit !== null, 'Submit button is disabled during submission transit to prevent duplicate requests');
}

// =============================================================================
// MAIN CHALLENGER HARNESS
// =============================================================================
async function main() {
    console.log(`\n${BOLD}${'='.repeat(65)}${RESET}`);
    console.log(`${BOLD}Sara Hosseini Photography — Empirical Challenger Stress Suite${RESET}`);
    console.log(`Target URL   : ${BASE_URL}`);
    console.log(`${'='.repeat(65)}`);

    const runner = new ChallengerRunner();
    const consoleErrors = [];
    const failedRequests = [];

    let browser;
    try {
        browser = await launchBrowser();
        const context = await browser.newContext({
            viewport: { width: 1440, height: 900 },
            deviceScaleFactor: 2,
            hasTouch: true
        });
        const page = await context.newPage();
        await setupErrorTracking(page, consoleErrors, failedRequests);

        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(500);

        // Run all 4 stress suites
        await testHeroSwitcherStress(page, runner);
        await testCategoryFilterStress(page, runner);
        await testLightboxModalStress(page, runner);
        await testContactFormStress(page, runner);

        // Check for any console errors or failed network requests
        console.log(`\n${BOLD}${CYAN}--- 5. Runtime Console & Resource Integrity Check ---${RESET}`);
        runner.assert(consoleErrors.length === 0, 'Zero uncaught console errors during stress testing', consoleErrors.join('; '));
        runner.assert(failedRequests.length === 0, 'Zero failed resource requests during stress testing', failedRequests.join('; '));

        await context.close();
    } catch (err) {
        console.error(`\n${RED}${BOLD}Adversarial Stress Test Failure:${RESET}`, err);
        runner.assert(false, 'Global Adversarial Execution', err.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }

    const success = runner.printSummary();
    process.exit(success ? 0 : 1);
}

main();
