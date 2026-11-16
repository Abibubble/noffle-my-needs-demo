import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { chooseAs, PAGES } from './helpers.js';

// WCAG 2.1 Level A and AA: the standard when Noffle My Needs was built.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

function summarise(violations) {
  return violations.map((v) => ({
    rule: v.id,
    impact: v.impact,
    help: v.help,
    targets: v.nodes.map((n) => n.target.join(' ')).slice(0, 5),
  }));
}

test.describe('axe-core WCAG 2.1 AA scan', () => {
  for (const { path, name } of PAGES) {
    test(`${name} has no detectable WCAG 2.1 AA failures`, async ({ page }) => {
      await chooseAs(page, 'Alex Morgan');
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      expect(summarise(results.violations)).toEqual([]);
    });
  }
});

// 320 × 256 CSS pixels is what a 1280 × 1024 screen shows at 400% zoom.
const ZOOM_400 = { width: 320, height: 256 };

test.describe('1.4.10 Reflow at 400% zoom', () => {
  test('a demo person can be chosen', async ({ page }) => {
    await page.setViewportSize(ZOOM_400);
    await chooseAs(page, 'Alex Morgan');
  });

  for (const { path, name } of PAGES) {
    test(`${name}: fixed or sticky parts cover no more than a quarter of the screen`, async ({
      page,
    }) => {
      await chooseAs(page, 'Alex Morgan');
      await page.setViewportSize(ZOOM_400);
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const covered = await page.evaluate(() =>
        [...document.querySelectorAll('body *')]
          .filter((el) => ['fixed', 'sticky'].includes(getComputedStyle(el).position))
          .filter((el) => getComputedStyle(el).display !== 'none')
          .reduce((total, el) => total + el.getBoundingClientRect().height, 0),
      );
      expect(covered).toBeLessThanOrEqual(ZOOM_400.height / 4);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBeLessThanOrEqual(ZOOM_400.width);
    });
  }

  test('every link in the open menu can be reached', async ({ page }) => {
    await chooseAs(page, 'Alex Morgan');
    await page.setViewportSize(ZOOM_400);
    await page.goto('/office.html');
    await page.getByRole('button', { name: 'Toggle navigation' }).click();
    const items = page.locator('#navbarToggler .nav-link');
    await expect(items).toHaveCount(6);
    for (const item of await items.all()) {
      await item.scrollIntoViewIfNeeded();
      // A trial click fails if anything covers the item.
      await item.click({ trial: true });
    }
  });
});

test.describe('1.4.12 Text spacing', () => {
  test('the hero text stays inside its box', async ({ page }) => {
    await page.goto('/index.html');
    await page.addStyleTag({
      content:
        '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}',
    });
    const box = await page.locator('.hero-text-overlay').evaluate((el) => ({
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
    }));
    expect(box.scrollHeight).toBeLessThanOrEqual(box.clientHeight + 1);
  });
});

test.describe('2.4.2 Page titles', () => {
  test('every page has its own title', async ({ page }) => {
    await chooseAs(page, 'Alex Morgan');
    for (const { path, title } of PAGES) {
      await page.goto(path);
      await expect(page).toHaveTitle(title);
    }
    expect(new Set(PAGES.map((p) => p.title)).size).toBe(PAGES.length);
  });
});

test.describe('1.3.1 and 2.4.6 Headings', () => {
  for (const { path, name } of PAGES) {
    test(`${name} has one h1, and heading levels don't skip`, async ({ page }) => {
      await chooseAs(page, 'Alex Morgan');
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      // Headings in closed pop-ups aren't on the page yet, so only count visible ones.
      const levels = await page.evaluate(() =>
        [...document.querySelectorAll('main :is(h1, h2, h3, h4, h5, h6)')]
          .filter((h) => h.getClientRects().length > 0 && !h.closest('.modal'))
          .map((h) => Number(h.tagName[1])),
      );
      expect(levels.filter((level) => level === 1)).toHaveLength(1);
      expect(levels[0]).toBe(1);
      levels.forEach((level, i) => {
        if (i > 0) expect(level - levels[i - 1]).toBeLessThanOrEqual(1);
      });
    });
  }

  test('the navbar brand is not a heading', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.locator('.navbar-brand h1, .navbar-brand h2')).toHaveCount(0);
  });
});

test.describe('2.4.1 Skip link', () => {
  test('is the first thing you can tab to, and moves focus to the main content', async ({
    page,
  }) => {
    await chooseAs(page, 'Alex Morgan');
    await page.goto('/office.html');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    // The next Tab goes into the page, not back to the navbar.
    await page.keyboard.press('Tab');
    const inMain = await page.evaluate(() => document.querySelector('main').contains(document.activeElement));
    expect(inMain).toBe(true);
  });
});
