import { expect, test } from '@playwright/test';

test('Studio sessions are career-facing, change stats, and reset with weekly progression', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: /Studio & sessions/ }).click();
  await expect(page.getByRole('heading', { name: 'Put the release in the room.' })).toBeVisible();
  await expect(page.getByText('Career decision · no production console')).toBeVisible();
  await page.getByRole('button', { name: /Book an international press room/ }).click();
  await page.getByRole('button', { name: 'Confirm · $600' }).click();
  await expect(page.locator('.topbar-cash')).toHaveText('$3,720 USD');
  await expect(page.getByText('Book an international press room booked')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Session booked this week' })).toBeDisabled();

  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await page.getByRole('button', { name: /End week/ }).click();
  await expect(page.locator('.week')).toContainText('Week 43');
  await page.getByRole('button', { name: /Studio & sessions/ }).click();
  await expect(page.getByRole('button', { name: /Confirm · \$600/ })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});
