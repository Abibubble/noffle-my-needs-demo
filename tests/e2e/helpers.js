import { expect } from '@playwright/test';

// Chooses a demo person from the Choose a Demo Person page.
export async function chooseAs(page, name) {
  await page.goto('/choose.html');
  await page.getByRole('button', { name: new RegExp(name) }).click();
  await expect(page).toHaveURL(/set-noffles\.html$/);
}

export const PAGES = [
  { path: '/index.html', name: 'Landing', title: 'Noffle My Needs demo' },
  { path: '/choose.html', name: 'Choose a Demo Person', title: 'Choose a Demo Person | Noffle My Needs demo' },
  { path: '/office.html', name: 'Office', title: 'Office | Noffle My Needs demo' },
  { path: '/set-noffles.html', name: 'Set My Noffles', title: 'Set My Noffles | Noffle My Needs demo' },
  { path: '/profile.html', name: 'Profile', title: 'Your Profile | Noffle My Needs demo' },
  { path: '/manage-users.html', name: 'Manage Users', title: 'Manage Users | Noffle My Needs demo' },
  { path: '/manage-noffles.html', name: 'Manage Noffles', title: 'Manage Noffles | Noffle My Needs demo' },
  { path: '/new-noffle.html', name: 'Add New Noffle', title: 'Add New Noffle | Noffle My Needs demo' },
  { path: '/missing-page.html', name: 'Page not found', title: 'Page Not Found | Noffle My Needs demo' },
];
