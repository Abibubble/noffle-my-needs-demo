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
