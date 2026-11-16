import { expect } from '@playwright/test';

// Chooses a demo person from the Choose a Demo Person page.
export async function chooseAs(page, name) {
  await page.goto('/choose.html');
  await page.getByRole('button', { name: new RegExp(name) }).click();
  await expect(page).toHaveURL(/set-noffles\.html$/);
}

export const PAGES = [
  { path: '/index.html', name: 'Landing' },
  { path: '/choose.html', name: 'Choose a Demo Person' },
  { path: '/office.html', name: 'Office' },
  { path: '/set-noffles.html', name: 'Set My Noffles' },
  { path: '/profile.html', name: 'Profile' },
  { path: '/manage-users.html', name: 'Manage Users' },
  { path: '/manage-noffles.html', name: 'Manage Noffles' },
  { path: '/new-noffle.html', name: 'Add New Noffle' },
  { path: '/missing-page.html', name: 'Page not found' },
];
