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
      // Nothing in the page pokes out past the edge of the screen, even if it's clipped.
      const tooWide = await page.evaluate((width) =>
        [...document.querySelectorAll('main *')]
          .filter((el) => el.getClientRects().length > 0 && !el.closest('.modal'))
          .filter((el) => el.getBoundingClientRect().right > width + 1)
          .map((el) => `${el.tagName}.${el.className}`.slice(0, 60)),
      ZOOM_400.width);
      expect(tooWide).toEqual([]);
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

test.describe('2.4.7 Focus visible', () => {
  for (const { path, name } of PAGES) {
    test(`${name}: everything you can tab to shows a clear focus outline`, async ({ page }) => {
      await chooseAs(page, 'Sam Okafor');
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const problems = [];
      for (let i = 0; i < 60; i++) {
        await page.keyboard.press('Tab');
        const focus = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          const style = getComputedStyle(el);
          return {
            label: `${el.tagName} "${(el.textContent || el.value || '').trim().slice(0, 30)}"`,
            style: style.outlineStyle,
            width: parseFloat(style.outlineWidth),
            colour: style.outlineColor,
            inFooter: Boolean(el.closest('footer')),
          };
        });
        if (!focus) break;
        if (focus.style !== 'solid' || focus.width < 2 || focus.colour !== 'rgb(0, 0, 0)') {
          problems.push(focus.label);
        }
        // Stop once we reach the footer: it's the same on every page.
        if (focus.inFooter) break;
      }
      expect(problems).toEqual([]);
    });
  }

  test('the mobile menu button shows a clear focus outline', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 700 });
    await page.goto('/index.html');
    await page.getByRole('button', { name: 'Toggle navigation' }).focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    const outline = await page
      .getByRole('button', { name: 'Toggle navigation' })
      .evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).toBe('solid');
  });
});

test.describe('1.4.11 Form field edges', () => {
  test('stay black on hover and focus', async ({ page }) => {
    await page.goto('/choose.html');
    const field = page.locator('#first_name');
    await field.hover();
    expect(await field.evaluate((el) => getComputedStyle(el).borderTopColor)).toBe('rgb(0, 0, 0)');
    await field.focus();
    expect(await field.evaluate((el) => getComputedStyle(el).borderTopColor)).toBe('rgb(0, 0, 0)');
  });
});

// The pages with forms, and how to open a form that starts hidden.
const FORM_PAGES = [
  { path: '/choose.html', name: 'Choose a Demo Person' },
  { path: '/profile.html', name: 'Profile' },
  { path: '/new-noffle.html', name: 'Add New Noffle' },
  {
    path: '/manage-users.html',
    name: 'Manage Users',
    open: (page) => page.getByRole('button', { name: 'Modify User' }).first().click(),
  },
];

test.describe('3.3.2 Labels and 4.1.1 unique ids', () => {
  for (const { path, name, open } of FORM_PAGES) {
    test(`${name}: every visible field has its own visible label`, async ({ page }) => {
      await chooseAs(page, 'Alex Morgan');
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      if (open) await open(page);
      const problems = await page.evaluate(() =>
        [...document.querySelectorAll('main input, main textarea, main select')]
          .filter((field) => field.getClientRects().length > 0)
          .filter((field) => {
            const label = field.labels?.[0];
            const visible =
              label &&
              label.getClientRects().length > 0 &&
              label.getBoundingClientRect().width > 1 &&
              label.textContent.trim().length > 0;
            return !visible || field.labels.length !== 1;
          })
          .map((field) => field.id || field.name),
      );
      expect(problems).toEqual([]);
    });
  }

  for (const { path, name } of PAGES) {
    test(`${name} has no repeated ids`, async ({ page }) => {
      await chooseAs(page, 'Alex Morgan');
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const repeated = await page.evaluate(() => {
        const counts = {};
        for (const el of document.querySelectorAll('[id]')) counts[el.id] = (counts[el.id] ?? 0) + 1;
        return Object.keys(counts).filter((id) => counts[id] > 1);
      });
      expect(repeated).toEqual([]);
    });
  }

  test('the Profile page shows whether each Noffle is private, without a checkbox that does nothing', async ({
    page,
  }) => {
    await chooseAs(page, 'Rowan Hughes');
    await page.goto('/profile.html');
    const noffles = page.locator('.noffle-card');
    await expect(noffles.locator('input')).toHaveCount(0);
    await expect(noffles.filter({ hasText: 'Low energy day' })).toContainText('This Noffle is private');
    await expect(noffles.filter({ hasText: 'Focus time' })).toContainText('This Noffle is public');
  });
});

test.describe('2.2.2 No moving content, and avatars chosen by name', () => {
  for (const path of ['/choose.html', '/profile.html']) {
    test(`${path} has no carousel, and avatars are radio buttons with names`, async ({ page }) => {
      await chooseAs(page, 'Sam Okafor');
      await page.goto(path);
      await expect(page.locator('.carousel')).toHaveCount(0);
      const group = page.getByRole('group', { name: 'Avatar' });
      await expect(group.getByRole('radio')).toHaveCount(13);
      await expect(group.getByRole('radio', { name: 'Blue triangle' })).toBeVisible();
    });
  }

  test('the Profile picker starts on your current avatar', async ({ page }) => {
    await chooseAs(page, 'Sam Okafor');
    await page.goto('/profile.html');
    await expect(page.getByRole('radio', { name: 'Blue triangle' })).toBeChecked();
  });
});

test.describe('1.3.5 Input purpose', () => {
  test('name fields say they are for given and family names', async ({ page }) => {
    await page.goto('/choose.html');
    await expect(page.locator('#first_name')).toHaveAttribute('autocomplete', 'given-name');
    await expect(page.locator('#last_name')).toHaveAttribute('autocomplete', 'family-name');
  });
});

test.describe('3.3.1 and 3.3.3 Errors in text, next to the field', () => {
  test('an empty form shows a message by each field and focuses the first', async ({ page }) => {
    await page.goto('/choose.html');
    await page.getByRole('button', { name: 'Add Person' }).click();
    const first = page.locator('#first_name');
    await expect(first).toBeFocused();
    await expect(first).toHaveAttribute('aria-invalid', 'true');
    await expect(first).toHaveAccessibleDescription('Error: Enter a first name');
    await expect(page.locator('#pronouns')).toHaveAccessibleDescription(
      /For example, she\/her.*Error: Enter pronouns/,
    );
    await expect(page.getByRole('group', { name: 'Avatar' })).toHaveAccessibleDescription(
      'Error: Choose an avatar',
    );
    await expect(page).toHaveURL(/choose\.html$/);
    // The message goes as soon as you type.
    await first.fill('Kit');
    await expect(first).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('a Noffle name that already exists shows an error and keeps what you typed', async ({
    page,
  }) => {
    await chooseAs(page, 'Alex Morgan');
    await page.goto('/new-noffle.html');
    await page.getByLabel('Noffle name').fill('Focus time');
    await page.getByLabel('Description').fill('Something new');
    await page.getByLabel('Icon').fill('fas fa-star');
    await page.getByRole('button', { name: 'Submit New Noffle' }).click();
    await expect(page).toHaveURL(/new-noffle\.html$/);
    const name = page.getByLabel('Noffle name');
    await expect(name).toBeFocused();
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(name).toHaveAccessibleDescription(/There's already a Noffle called "Focus time"/);
    await expect(page.getByLabel('Description')).toHaveValue('Something new');
  });

  test('an icon that is not a Font Awesome class name gets a suggestion', async ({ page }) => {
    await chooseAs(page, 'Alex Morgan');
    await page.goto('/new-noffle.html');
    await page.getByLabel('Noffle name').fill('Standing');
    await page.getByLabel('Description').fill('I need a standing desk');
    await page.getByLabel('Icon').fill('chair');
    await page.getByRole('button', { name: 'Submit New Noffle' }).click();
    await expect(page.getByLabel('Icon')).toHaveAccessibleDescription(
      /Error: Enter an icon class name like fas fa-coffee/,
    );
  });
});

test.describe('3.3.2 Instructions match the page', () => {
  test("Set My Noffles doesn't promise a private or public choice it doesn't have", async ({
    page,
  }) => {
    await chooseAs(page, 'Sam Okafor');
    await expect(page.locator('main')).not.toContainText(
      'You can also choose whether you would like it to be private or public',
    );
  });
});

test.describe('4.1.2 Real buttons and links', () => {
  for (const { path, name } of PAGES) {
    test(`${name} has no links pretending to be buttons`, async ({ page }) => {
      await chooseAs(page, 'Alex Morgan');
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const fakes = await page.evaluate(() =>
        [...document.querySelectorAll('a[role="button"], a[href="#"], a[type="button"]')].map(
          (a) => a.textContent.trim().slice(0, 40),
        ),
      );
      expect(fakes).toEqual([]);
    });
  }

  test('an Office card opens with the Space key', async ({ page }) => {
    await chooseAs(page, 'Sam Okafor');
    await page.goto('/office.html');
    await page.getByRole('button', { name: 'Tom Brennan' }).focus();
    await page.keyboard.press('Space');
    await expect(page.getByRole('dialog', { name: /Tom Brennan/ })).toBeVisible();
  });

  test('the person name on each Office card is still a heading', async ({ page }) => {
    await chooseAs(page, 'Sam Okafor');
    await page.goto('/office.html');
    await expect(page.getByRole('heading', { level: 2, name: 'Tom Brennan' })).toBeVisible();
  });

  test('a whole Office card is still clickable', async ({ page }) => {
    await chooseAs(page, 'Sam Okafor');
    await page.goto('/office.html');
    // Click near the bottom of the card, away from the name.
    const card = page.locator('.office-card', { hasText: 'Tom Brennan' });
    const box = await card.boundingBox();
    await page.mouse.click(box.x + box.width / 2, box.y + box.height - 10);
    await expect(page.getByRole('dialog', { name: /Tom Brennan/ })).toBeVisible();
  });
});

test.describe('2.4.3 Modify User pop-up', () => {
  test('moves focus into the pop-up, closes with Escape, and returns focus', async ({ page }) => {
    await chooseAs(page, 'Alex Morgan');
    await page.goto('/manage-users.html');
    const trigger = page.getByRole('button', { name: 'Modify User: Sam Okafor' });
    await trigger.click();
    const dialog = page.getByRole('dialog', { name: 'Modify user Sam' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    // Bootstrap moves focus in after the pop-up's fade-in finishes.
    await expect.poll(() => dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test.describe('3.3.4 Deleting asks first', () => {
  test('Delete Noffle asks before deleting, and Cancel keeps the Noffle', async ({ page }) => {
    await chooseAs(page, 'Alex Morgan');
    await page.goto('/manage-noffles.html');
    await page.getByRole('button', { name: 'Delete Noffle: Please speak up' }).click();
    const dialog = page.getByRole('dialog', { name: 'Delete "Please speak up"?' });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAccessibleDescription(/This removes it from 2 people/);
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator('.noffle-card', { hasText: 'Please speak up' })).toHaveCount(1);
  });

  test('Delete User asks before deleting', async ({ page }) => {
    await chooseAs(page, 'Alex Morgan');
    await page.goto('/manage-users.html');
    await page.getByRole('button', { name: 'Modify User: Tom Brennan' }).click();
    const dialog = page.getByRole('dialog', { name: 'Modify user Tom' });
    await dialog.getByRole('button', { name: 'Delete User' }).click();
    await expect(dialog.locator('#confirm-delete-text-tom')).toBeFocused();
    await expect(dialog.getByText('Delete Tom Brennan?')).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(dialog.getByText('Delete Tom Brennan?')).toBeHidden();
    await dialog.getByRole('button', { name: 'Delete User' }).click();
    await dialog.getByRole('button', { name: 'Yes, delete Tom Brennan' }).click();
    await expect(page.locator('#flash')).toContainText('User Successfully Deleted');
    await expect(page.locator('.user-card', { hasText: 'Tom Brennan' })).toHaveCount(0);
  });
});

test.describe('Links', () => {
  test('1.4.1 links in the page are underlined', async ({ page }) => {
    await page.goto('/index.html');
    const notUnderlined = await page.evaluate(() =>
      [...document.querySelectorAll('main a:not(.btn), footer a')]
        .filter((a) => !getComputedStyle(a).textDecorationLine.includes('underline'))
        .map((a) => a.textContent.trim()),
    );
    expect(notUnderlined).toEqual([]);
  });

  test('links that open a new tab say so', async ({ page }) => {
    await chooseAs(page, 'Alex Morgan');
    for (const { path } of PAGES) {
      await page.goto(path);
      const unwarned = await page.evaluate(() =>
        [...document.querySelectorAll('a[target="_blank"]')]
          .filter((a) => !a.textContent.includes('opens in a new tab'))
          .map((a) => a.textContent.trim()),
      );
      expect(unwarned, path).toEqual([]);
    }
  });
});

test.describe('1.1.1 and 1.4.1 Office cards', () => {
  test('each noffle icon has its name next to it', async ({ page }) => {
    await chooseAs(page, 'Sam Okafor');
    await page.goto('/office.html');
    const mei = page.locator('.office-card', { hasText: 'Mei Lin' });
    const list = mei.getByRole('list', { name: 'Noffles' });
    await expect(list.getByRole('listitem')).toHaveText(['I use BSL', 'Quiet space']);
    // Shown on screen, not just to screen readers.
    const width = await list
      .getByText('I use BSL')
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(width).toBeGreaterThan(30);
  });

  test("cards grow to fit, so nothing is hidden in a scroll box", async ({ page }) => {
    await chooseAs(page, 'Alex Morgan');
    await page.goto('/office.html');
    const cards = await page.locator('.office-card').evaluateAll((all) =>
      all.map((card) => ({
        overflow: getComputedStyle(card).overflowY,
        clipped: card.scrollHeight > card.clientHeight + 1,
      })),
    );
    expect(cards.every((card) => card.overflow === 'visible' && !card.clipped)).toBe(true);
  });

  test('the panic state has a text label, not just a red card', async ({ page }) => {
    await chooseAs(page, 'Alex Morgan');
    await page.goto('/office.html');
    const jordan = page.locator('.office-card', { hasText: 'Jordan Ellis' });
    await expect(jordan.getByText('Needs urgent help')).toBeVisible();
    const tom = page.locator('.office-card', { hasText: 'Tom Brennan' });
    await expect(tom.getByText('Needs urgent help')).toHaveCount(0);
  });

  test("non-admins don't see the panic label for someone else", async ({ page }) => {
    await chooseAs(page, 'Sam Okafor');
    await page.goto('/office.html');
    const jordan = page.locator('.office-card', { hasText: 'Jordan Ellis' });
    await expect(jordan.getByText('Needs urgent help')).toHaveCount(0);
  });

  for (const path of ['/office.html', '/manage-users.html']) {
    test(`${path}: avatars next to a name are decorative`, async ({ page }) => {
      await chooseAs(page, 'Alex Morgan');
      await page.goto(path);
      const alts = await page.locator('main .card img').evaluateAll((imgs) =>
        imgs.map((img) => img.getAttribute('alt')),
      );
      expect(alts.length).toBeGreaterThan(0);
      expect(alts.every((alt) => alt === '')).toBe(true);
    });
  }
});

test.describe('1.1.1 Decorative icons', () => {
  for (const { path, name } of PAGES) {
    test(`${name}: every Font Awesome icon is hidden from screen readers`, async ({ page }) => {
      await chooseAs(page, 'Alex Morgan');
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const exposed = await page.evaluate(() =>
        [...document.querySelectorAll('i[class*="fa-"]')]
          .filter((icon) => !icon.closest('[aria-hidden="true"]:not(.modal)'))
          .map((icon) => icon.className),
      );
      expect(exposed).toEqual([]);
    });
  }
});

test.describe('4.1.3 Status messages and 2.4.3 focus after actions', () => {
  test('setting a Noffle updates in place, keeps focus, and announces the change', async ({
    page,
  }) => {
    await chooseAs(page, 'Sam Okafor');
    // Mark the page, so we can tell if it reloads.
    await page.evaluate(() => {
      window.notReloaded = true;
    });
    const card = page.locator('[data-noffle-id="speak-up"]');
    await card.focus();
    await page.keyboard.press('Enter');
    await expect(card).toHaveAttribute('aria-pressed', 'true');
    await expect(card).toBeFocused();
    await expect(page.getByRole('status')).toContainText('Noffle Please speak up added');
    expect(await page.evaluate(() => window.notReloaded)).toBe(true);
    // The change is saved.
    await page.reload();
    await expect(page.locator('[data-noffle-id="speak-up"]')).toHaveAttribute('aria-pressed', 'true');
  });

  test('after a change that goes to a new page, focus starts on the message', async ({ page }) => {
    await chooseAs(page, 'Sam Okafor');
    await page.goto('/profile.html');
    await page.getByRole('button', { name: 'Update Details' }).click();
    await expect(page.locator('#flash')).toContainText('Your details have been updated');
    await expect(page.locator('#flash')).toBeFocused();
    // The next Tab carries on from the message, into the page.
    await page.keyboard.press('Tab');
    const inMain = await page.evaluate(() =>
      document.querySelector('main').contains(document.activeElement),
    );
    expect(inMain).toBe(true);
  });

  test('pages without a message keep focus at the top', async ({ page }) => {
    await chooseAs(page, 'Sam Okafor');
    await page.goto('/office.html');
    await expect(page.locator('#flash')).not.toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  });
});
