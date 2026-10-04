import { expect, test } from '@playwright/test';

async function capture(page, testInfo, name) {
  if (process.env.CAPTURE_ARTIFACTS !== '1') return;
  await page.waitForTimeout(250);
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: false });
}

const mobileNav = page => page.getByRole('navigation', { name: 'Mobile navigation' });

test('mobile career decision changes stats and activity, then advances into next week', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '“Never Met You” just entered the Top 100.' })).toBeVisible();
  await expect(mobileNav(page).getByRole('button')).toHaveCount(5);
  await capture(page, testInfo, 'mobile-home-before-choice');

  await mobileNav(page).getByRole('button', { name: 'Career', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Career desk' })).toBeVisible();
  await expect(page.locator('.topbar-cash')).toHaveText('$4,320 USD');
  await page.getByRole('button', { name: 'Take the dates' }).click();
  await expect(page.locator('.topbar-cash')).toHaveText('$5,570 USD');
  await expect(page.getByText('North Star support run confirmed')).toBeVisible();
  await expect(page.locator('.decision-status')).toContainText('DECISION MADE');

  await mobileNav(page).getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.locator('.stats .stat').filter({ hasText: 'Fans' })).toContainText('26.7K');
  await capture(page, testInfo, 'mobile-home-after-choice');
  await page.getByRole('button', { name: /End week/ }).click();
  await expect(page.locator('.week')).toContainText('Week 43 · 2026');
  await expect(page.locator('.stats .stat').filter({ hasText: 'Fans' })).toContainText('29.8K');
  await expect(page.getByText('Week 42 closed · 43 begins')).toBeVisible();
  await mobileNav(page).getByRole('button', { name: 'Career', exact: true }).click();
  await expect(page.locator('.decision-status')).toContainText('DECISION OPEN');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await capture(page, testInfo, 'mobile-career-next-week');
});

test('release browsing opens details and connects to a career-facing rollout choice', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await mobileNav(page).getByRole('button', { name: 'Music', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Music library' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Search releases' }).fill('paper');
  await expect(page.getByRole('button', { name: /Open Paper Satellites release details/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Open Never Met You release details/ })).toHaveCount(0);
  await page.getByRole('textbox', { name: 'Search releases' }).fill('');
  await page.getByRole('button', { name: /Open Never Met You release details/ }).click();
  const detail = page.getByRole('dialog', { name: 'Never Met You release details' });
  await expect(detail.getByText('United States')).toBeVisible();
  await expect(detail.getByText('38.4K')).toBeVisible();
  await capture(page, testInfo, 'mobile-release-details');
  await detail.getByRole('button', { name: /Plan a release session/ }).click();
  await expect(page.getByRole('heading', { name: 'Put the release in the room.' })).toBeVisible();
  await page.getByRole('button', { name: /Take the listening room on the road/ }).click();
  await page.getByRole('button', { name: 'Confirm · $850' }).click();
  await expect(page.locator('.topbar-cash')).toHaveText('$3,470 USD');
  await expect(page.getByText('Take the listening room on the road booked')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Session booked this week' })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test('global markets, artist details, news and profile controls are interactive and persistent', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await mobileNav(page).getByRole('button', { name: 'World', exact: true }).click();
  await page.getByRole('tab', { name: 'Brazil', exact: true }).click();
  await expect(page.locator('.market-caption')).toContainText('Brazil');
  await page.getByRole('button', { name: /Mara Sol São Paulo/ }).click();
  await expect(page.getByRole('dialog', { name: 'Mara Sol' })).toContainText('Brazil market');
  await page.getByRole('button', { name: 'Close details' }).click();
  await page.getByRole('button', { name: /New cities are opening their doors/ }).click();
  await expect(page.getByRole('dialog')).toContainText('into repeat listeners');
  await page.getByRole('button', { name: 'Back to World desk' }).click();

  await mobileNav(page).getByRole('button', { name: 'Profile', exact: true }).click();
  await page.getByRole('button', { name: 'Edit profile' }).click();
  await page.getByLabel('Artist / stage name').fill('Candelar Nova');
  await page.getByRole('button', { name: 'Save profile' }).click();
  await expect(page.getByRole('heading', { name: 'Candelar Nova' })).toBeVisible();
  await page.getByRole('switch', { name: 'Public profile visibility' }).click();
  await expect(page.getByText('PRIVATE PROFILE')).toBeVisible();
  await page.reload();
  await mobileNav(page).getByRole('button', { name: 'Profile', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Candelar Nova' })).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Public profile visibility' })).toHaveAttribute('aria-checked', 'false');
  await mobileNav(page).getByRole('button', { name: 'World', exact: true }).click();
  await expect(page.getByRole('button', { name: /Candelar Nova/ })).toHaveCount(0);
});

test('desktop preserves the seed sidebar and exposes all seven styled sections', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  const sidebar = page.getByRole('navigation', { name: 'Primary navigation' });
  await expect(sidebar).toBeVisible();
  await expect(sidebar.getByRole('button')).toHaveCount(7);
  await expect(page.locator('.hero-art')).toBeVisible();
  await capture(page, testInfo, 'desktop-home');
  for (const [label, heading] of [['Music', 'Music library'], ['Studio', 'Put the release in the room.'], ['Analytics', 'Audience analytics'], ['Career', 'Career desk'], ['World', 'World desk'], ['Profile', 'Candelar']]) {
    await sidebar.getByRole('button', { name: label, exact: true }).click();
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }
  await sidebar.getByRole('button', { name: 'Studio', exact: true }).click();
  await capture(page, testInfo, 'desktop-studio');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});
