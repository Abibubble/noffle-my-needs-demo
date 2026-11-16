import { expect, test } from '@playwright/test';

import { chooseAs, PAGES } from './helpers.js';

test.describe('landing page', () => {
  test('says it is a demo and credits the team', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#demo-banner')).toContainText('This is a demo');
    const about = page.locator('#about-demo');
    await expect(about).toContainText('A11y Allies');
    await expect(about).toContainText('Trust In SODA and Code Institute');
    await expect(about).toContainText('September 2021');
    await expect(about).toContainText('updated since the hackathon');
    for (const name of [
      'Abi Harrison-Nye',
      'Andrew Dempsey',
      'Carla Buongiorno',
      'Henrique Peroni',
      'Monika Hrda',
      'Megan Armstrong',
    ]) {
      await expect(about.getByRole('link', { name })).toBeVisible();
    }
    await expect(about.getByRole('link', { name: /original hackathon code/ })).toHaveAttribute(
      'href',
      'https://github.com/Abibubble/noffle-my-needs',
    );
  });
});

test.describe('without a demo person', () => {
  for (const path of ['/office.html', '/set-noffles.html', '/profile.html']) {
    test(`${path} sends you to choose a person`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/choose\.html$/);
      await expect(page.locator('#flash')).toContainText('You need to choose a demo person');
    });
  }
});

test.describe('as a colleague', () => {
  test('choosing a person greets them and shows their noffles', async ({ page }) => {
    await chooseAs(page, 'Sam Okafor');
    await expect(page.locator('#flash')).toContainText(/Good (Morning|Afternoon|Evening), Sam/);
    await expect(page.locator('[data-noffle-id="written-instructions"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.locator('[data-noffle-id="speak-up"]')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('setting and removing a noffle', async ({ page }) => {
    await chooseAs(page, 'Sam Okafor');
    await page.locator('[data-noffle-id="speak-up"]').click();
    await expect(page.locator('#flash')).toContainText('Noffle Please speak up added');
    await expect(page.locator('[data-noffle-id="speak-up"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.locator('[data-noffle-id="speak-up"]').click();
    await expect(page.locator('#flash')).toContainText('Noffle Please speak up removed');
    await expect(page.locator('[data-noffle-id="speak-up"]')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  test('the office shows colleagues', async ({ page }) => {
    await chooseAs(page, 'Sam Okafor');
    await page.goto('/office.html');
    await expect(page.locator('.office-card')).toHaveCount(8);
    await page.locator('.office-card', { hasText: 'Tom Brennan' }).click();
    const modal = page.locator('#user-modal-tom');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Focus time');
    await modal.getByRole('button', { name: 'Close' }).last().click();
    await expect(modal).toBeHidden();
  });

  test("someone else's panic button is hidden from non-admins, because it's private", async ({
    page,
  }) => {
    await chooseAs(page, 'Sam Okafor');
    await page.goto('/office.html');
    const jordan = page.locator('.office-card', { hasText: 'Jordan Ellis' });
    await expect(jordan.locator('.btn-red')).toHaveCount(0);
    await jordan.click();
    const modal = page.locator('#user-modal-jordan');
    await expect(modal).toBeVisible();
    await expect(modal).not.toContainText('urgent help');
    await expect(modal).not.toContainText('Panic button');
  });

  test('you can see your own panic button in the office', async ({ page }) => {
    await chooseAs(page, 'Jordan Ellis');
    await page.goto('/office.html');
    const jordan = page.locator('.office-card', { hasText: 'Jordan Ellis' });
    await expect(jordan.locator('.btn-red')).toHaveCount(1);
  });

  test("other people's private noffles are hidden from non-admins", async ({ page }) => {
    await chooseAs(page, 'Sam Okafor');
    await page.goto('/office.html');
    await page.locator('.office-card', { hasText: 'Rowan Hughes' }).click();
    const modal = page.locator('#user-modal-rowan');
    await expect(modal).toContainText('Focus time');
    await expect(modal).not.toContainText('Low energy day');
  });

  test('updating your profile', async ({ page }) => {
    await chooseAs(page, 'Sam Okafor');
    await page.goto('/profile.html');
    await expect(page.getByRole('heading', { name: "Sam's Profile" })).toBeVisible();
    await page.locator('#pronouns').fill('they/he');
    await page.getByLabel('Green star').check();
    await page.getByRole('button', { name: 'Update Details' }).click();
    await expect(page.locator('#flash')).toContainText('Your details have been updated');
    await expect(page.locator('#pronouns')).toHaveValue('they/he');
    await expect(page.locator('.avatar-profile')).toHaveAttribute('src', 'img/avatar11.svg');
  });

  test('switching person clears temporary noffles', async ({ page }) => {
    await chooseAs(page, 'Sam Okafor');
    await page.getByRole('button', { name: 'Switch Person' }).click();
    await expect(page).toHaveURL(/choose\.html$/);
    await expect(page.locator('#flash')).toContainText("You've stopped viewing as Sam Okafor");
    await chooseAs(page, 'Sam Okafor');
    await expect(page.locator('[data-noffle-id="on-a-break"]')).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await expect(page.locator('[data-noffle-id="written-instructions"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('removing yourself from the demo', async ({ page }) => {
    await chooseAs(page, 'Tom Brennan');
    await page.goto('/profile.html');
    await page.getByRole('button', { name: 'Remove This Demo Person' }).click();
    await page.getByRole('button', { name: 'Remove Person' }).click();
    await expect(page).toHaveURL(/choose\.html$/);
    await expect(page.getByRole('button', { name: /Tom Brennan/ })).toHaveCount(0);
  });

  test('admin pages send non-admins to the office', async ({ page }) => {
    await chooseAs(page, 'Sam Okafor');
    await page.goto('/manage-users.html');
    await expect(page).toHaveURL(/office\.html$/);
    await expect(page.locator('#flash')).toContainText('You need to be an admin');
  });
});

test.describe('adding a demo person', () => {
  test('creates them and opens their profile', async ({ page }) => {
    await page.goto('/choose.html');
    await page.locator('#first_name').fill('Kit');
    await page.locator('#last_name').fill('Jones');
    await page.locator('#pronouns').fill('they/them');
    await page.getByLabel('Red diamond').check();
    await page.getByRole('button', { name: 'Add Person' }).click();
    await expect(page).toHaveURL(/profile\.html$/);
    await expect(page.locator('#flash')).toContainText('Hi, Kit. Welcome to Noffle My Needs.');
    await expect(page.getByRole('heading', { name: "Kit's Profile" })).toBeVisible();
  });

  test("text people type can't run as code", async ({ page }) => {
    await page.goto('/choose.html');
    await page.locator('#first_name').fill('<img src=x onerror=alert(1)>');
    await page.locator('#last_name').fill('Test');
    await page.locator('#pronouns').fill('they/them');
    await page.getByLabel('Red square').check();
    let dialog = false;
    page.on('dialog', async (d) => {
      dialog = true;
      await d.dismiss();
    });
    await page.getByRole('button', { name: 'Add Person' }).click();
    await page.goto('/office.html');
    await expect(page.locator('.office-card').last()).toContainText('<img src=x');
    expect(dialog).toBe(false);
  });
});

test.describe('as an admin', () => {
  test('adding and deleting a noffle', async ({ page }) => {
    await chooseAs(page, 'Alex Morgan');
    await page.goto('/manage-noffles.html');
    await page.getByRole('button', { name: 'Add New Noffle' }).click();
    await expect(page).toHaveURL(/new-noffle\.html$/);
    await page.locator('#name').fill('Standing desk');
    await page.locator('#description').fill('I need a standing desk today');
    await page.locator('#icon').fill('fas fa-chair');
    await page.locator('#permanent').check();
    await page.getByRole('button', { name: 'Submit New Noffle' }).click();
    await expect(page).toHaveURL(/manage-noffles\.html$/);
    await expect(page.locator('#flash')).toContainText('Noffle Standing desk has been added');
    const card = page.locator('.noffle-card', { hasText: 'Standing desk' });
    await expect(card).toBeVisible();
    await card.getByRole('button', { name: 'Delete Noffle' }).click();
    await expect(page.locator('#flash')).toContainText('Noffle Successfully Deleted');
    await expect(page.locator('.noffle-card', { hasText: 'Standing desk' })).toHaveCount(0);
  });

  test('giving a colleague admin rights', async ({ page }) => {
    await chooseAs(page, 'Alex Morgan');
    await page.goto('/manage-users.html');
    const sam = page.locator('.user-card', { hasText: 'Sam Okafor' });
    await sam.getByRole('button', { name: 'Make user admin' }).click();
    await expect(page.locator('#flash')).toContainText('User Admin Rights Added');
    await expect(
      page.locator('.user-card', { hasText: 'Sam Okafor' }).getByRole('button', {
        name: 'Remove admin rights',
      }),
    ).toBeVisible();
  });

  test('admins can see private noffles in the office', async ({ page }) => {
    await chooseAs(page, 'Alex Morgan');
    await page.goto('/office.html');
    await page.locator('.office-card', { hasText: 'Rowan Hughes' }).click();
    await expect(page.locator('#user-modal-rowan')).toContainText('Low energy day');
  });

  test('admins can see when someone has pressed the panic button', async ({ page }) => {
    await chooseAs(page, 'Alex Morgan');
    await page.goto('/office.html');
    const jordan = page.locator('.office-card', { hasText: 'Jordan Ellis' });
    await expect(jordan.locator('.btn-red')).toHaveCount(1);
    await jordan.click();
    await expect(page.locator('#user-modal-jordan')).toContainText(
      'Jordan is in need of urgent help!',
    );
  });
});

test.describe('resetting and storage', () => {
  test('reset puts the sample data back', async ({ page }) => {
    await chooseAs(page, 'Tom Brennan');
    await page.goto('/profile.html');
    await page.getByRole('button', { name: 'Remove This Demo Person' }).click();
    await page.getByRole('button', { name: 'Remove Person' }).click();
    await page.getByRole('button', { name: 'Reset the demo' }).click();
    await expect(page.locator('#flash')).toContainText('The demo has been reset');
    await expect(page.getByRole('button', { name: /Tom Brennan/ })).toBeVisible();
  });

  test('still works when the browser blocks storage', async ({ page }) => {
    await page.addInitScript(() => {
      const blocked = () => {
        throw new DOMException('Blocked', 'SecurityError');
      };
      Object.defineProperty(window, 'localStorage', { get: blocked });
      Object.defineProperty(window, 'sessionStorage', { get: blocked });
    });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error));
    await page.goto('/office.html');
    await expect(page.locator('#demo-banner')).toContainText("can't remember your changes");
    await expect(page.locator('.office-card')).toHaveCount(8);
    expect(errors).toEqual([]);
  });
});

test.describe('every page', () => {
  for (const { path, name } of PAGES) {
    test(`${name} has no script errors and makes no third-party requests`, async ({ page }) => {
      const errors = [];
      const external = [];
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('request', (request) => {
        if (!request.url().startsWith('http://localhost:4175')) external.push(request.url());
      });
      await chooseAs(page, 'Alex Morgan');
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      expect(errors).toEqual([]);
      expect(external).toEqual([]);
    });
  }

  test('the 404 page works inside a folder that does not exist', async ({ page }) => {
    const response = await page.goto('/no/such/folder/page.html');
    expect(response.status()).toBe(404);
    await expect(page.getByText('Oh no! It looks like something went wrong!')).toBeVisible();
    await expect(page.locator('#site-footer')).toContainText('A11y Allies');
  });
});
