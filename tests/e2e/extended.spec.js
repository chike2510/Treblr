import { expect, test } from '@playwright/test';

async function freshCareer(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('.bottom-nav').getByRole('button', { name: 'Music' }).click();
}

async function capture(page, testInfo, name) {
  if (process.env.CAPTURE_ARTIFACTS === '1') {
    await page.waitForTimeout(250);
    await page.screenshot({ path: testInfo.outputPath(`treblr-${name}.png`), fullPage: false });
  }
}

async function dismissToast(page) {
  const dismiss = page.getByRole('status').getByRole('button', { name: 'Dismiss message' });
  if (await dismiss.count() && await dismiss.isVisible()) await dismiss.click();
}

test('catalogue grid/list and Single/EP/Album planning change actual saved project state', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await freshCareer(page);
  const library = page.locator('.release-grid');
  await expect(library).toBeVisible();
  await page.getByRole('button', { name: 'Compact list' }).click();
  await expect(library).toHaveClass(/list-view/);
  await page.getByRole('button', { name: 'Artwork grid' }).click();
  await expect(library).not.toHaveClass(/list-view/);

  await page.getByRole('button', { name: 'Open No Fixed Address details' }).click();
  await expect(page.getByRole('heading', { name: 'Performance' })).toBeVisible();
  await page.getByRole('button', { name: /Set a release date/ }).click();
  const dialog = page.getByRole('dialog');
  const formats = dialog.getByRole('group', { name: 'Release format' });
  await expect(formats.getByRole('button', { name: /Album/ })).toHaveAttribute('aria-pressed', 'true');
  await formats.getByRole('button', { name: /EP/ }).click();
  await expect(dialog.locator('.format-summary')).toContainText('EP package fee');
  await capture(page, testInfo, 'release-format-390');
  await dialog.locator('.campaign-list .choice-row').first().getByRole('button', { name: /Commit/ }).click();
  const scheduled = page.locator('.release-tile').filter({ hasText: 'No Fixed Address' });
  await expect(scheduled).toContainText('EP');
  await expect(scheduled).toContainText('Scheduled');
  await expect(scheduled).toContainText('Week 40');
  await capture(page, testInfo, 'music-ep-format-390');
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
});

test('tour dates, festival and publicity resolve in the living world and profile remains responsive', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.setViewportSize({ width: 390, height: 844 });
  await freshCareer(page);
  const nav = page.locator('.bottom-nav');
  await nav.getByRole('button', { name: 'Career' }).click();
  await expect(page.getByRole('button', { name: 'Book the route' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Take the stage' })).toBeVisible();
  await capture(page, testInfo, 'career-offers-390');
  const route = page.locator('.opportunity').filter({ hasText: 'The Blue Line — three-room run' });
  await route.scrollIntoViewIfNeeded();
  await capture(page, testInfo, 'tour-route-390');
  await route.getByRole('button', { name: 'Book the route' }).click();
  await expect(page.getByRole('status')).toContainText('accepted');

  const closeAndContinue = async () => {
    await page.locator('.close-week-button').click();
    const report = page.getByRole('dialog');
    await expect(report.getByRole('heading', { name: 'The week, accounted for.' })).toBeVisible();
    await report.getByRole('button', { name: 'Keep moving' }).click();
  };
  await closeAndContinue();
  await expect(page.getByText('Nightline wants a campaign cut')).toBeVisible();
  const publicity = page.locator('.opportunity').filter({ hasText: 'Nightline wants a campaign cut' });
  await publicity.getByRole('button', { name: 'Fund the clip' }).click();
  await expect(page.getByRole('status')).toContainText('accepted');
  await dismissToast(page);
  await closeAndContinue();
  await closeAndContinue();
  await closeAndContinue();

  await nav.getByRole('button', { name: 'World' }).click();
  await expect(page.getByRole('heading', { name: 'Independent 50.' })).toBeVisible();
  await expect(page.locator('.world-chart-row')).toHaveCount(5);
  await capture(page, testInfo, 'world-390');
  await page.locator('.chart-section').scrollIntoViewIfNeeded();
  await capture(page, testInfo, 'world-chart-390');
  await nav.getByRole('button', { name: 'You' }).click();
  await expect(page.getByRole('heading', { name: 'The name on the sleeve.' })).toBeVisible();
  await expect(page.getByAltText('Portrait of the fictional artist Mira Ayo')).toBeVisible();
  await capture(page, testInfo, 'profile-390');
  for (const width of [320, 390, 430, 1280]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
  expect(errors).toEqual([]);
});
