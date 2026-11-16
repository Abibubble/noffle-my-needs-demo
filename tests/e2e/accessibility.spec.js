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
