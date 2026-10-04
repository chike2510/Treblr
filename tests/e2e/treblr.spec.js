import { expect, test } from '@playwright/test';

async function openFreshCareer(page) {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your next move.' })).toBeVisible();
}

async function capture(page, testInfo, name) {
  if (process.env.CAPTURE_ARTIFACTS === '1') {
    await page.waitForTimeout(350);
    await page.screenshot({ path: testInfo.outputPath(`treblr-${name}.png`), fullPage: false });
  }
}

async function dismissToast(page) {
  const dismiss = page.getByRole('status').getByRole('button', { name: 'Dismiss message' });
  if (await dismiss.count() && await dismiss.isVisible()) await dismiss.click();
}

test('five destinations, catalogue details, a studio session and weekly progression work on mobile', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  await page.setViewportSize({ width: 390, height: 844 });
  await openFreshCareer(page);
  const nav = page.locator('.bottom-nav');
  await expect(nav.getByRole('button')).toHaveCount(5);
  await capture(page, testInfo, 'home-390');

  await nav.getByRole('button', { name: 'Music' }).click();
  await expect(page.getByRole('heading', { name: 'The catalogue.' })).toBeVisible();
  await page.getByRole('button', { name: 'Open After Hours details' }).click();
  await expect(page.getByRole('heading', { name: 'Performance' })).toBeVisible();
  await capture(page, testInfo, 'track-detail-390');
  await page.getByRole('button', { name: /CATALOGUE/ }).click();
  await page.getByRole('tab', { name: /Released/ }).click();
  await expect(page.locator('.release-tile')).toHaveCount(2);
  await page.getByRole('tab', { name: /All/ }).click();
  await capture(page, testInfo, 'music-390');

  await page.getByRole('button', { name: 'Book a session' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('heading', { name: 'Pick a room.' })).toBeVisible();
  await capture(page, testInfo, 'studio-session-390');
  await dialog.locator('.choice-row').first().getByRole('button', { name: 'Book' }).click();
  await expect(page.getByText('Never at Rest', { exact: true })).toBeVisible();
  await expect(page.locator('.release-tile')).toHaveCount(6);
  await dismissToast(page);
  await capture(page, testInfo, 'music-after-session-390');

  await page.locator('.close-week-button').click();
  const report = page.getByRole('dialog');
  await expect(report.getByRole('heading', { name: 'The week, accounted for.' })).toBeVisible();
  await expect(report).toContainText('STREAMS SETTLED');
  await report.getByRole('button', { name: 'Keep moving' }).click();
  await expect(page.locator('.mobile-week')).toContainText('W39');
  await capture(page, testInfo, 'week-report-390');

  await nav.getByRole('button', { name: 'Career' }).click();
  const show = page.locator('.opportunity').filter({ hasText: 'A late set at The Canopy' });
  await show.getByRole('button', { name: 'Book the slot' }).click();
  await expect(page.getByRole('status')).toContainText('accepted');
  await dismissToast(page);
  await capture(page, testInfo, 'career-390');

  await nav.getByRole('button', { name: 'World' }).click();
  await expect(page.getByRole('heading', { name: 'Independent 50.' })).toBeVisible();
  await expect(page.locator('.world-chart-row')).toHaveCount(5);
  await nav.getByRole('button', { name: 'You' }).click();
  await expect(page.getByRole('heading', { name: 'The name on the sleeve.' })).toBeVisible();
  await page.getByLabel('Press & radio').uncheck();
  await expect(page.getByLabel('Press & radio')).not.toBeChecked();

  for (const width of [320, 390, 430, 1280]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 900 });
    await expect(page.locator('.page-heading h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
  expect(errors).toEqual([]);
});

test('label decision is disclosed, logged and reflected in profile / career state', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openFreshCareer(page);
  await page.locator('.nav-link').filter({ hasText: 'Career' }).click();
  const deal = page.locator('.opportunity').filter({ hasText: 'Northline want a first conversation' });
  await expect(deal).toContainText('20% of master net for 3 years');
  await deal.getByRole('button', { name: 'Take the meeting' }).click();
  await expect(page.locator('.deal-ribbon')).toContainText('Northline / distribution partner');
  await expect(page.getByRole('status')).toContainText('accepted');
  await dismissToast(page);
  await capture(page, testInfo, 'career-desktop');
  await page.locator('.nav-link').filter({ hasText: 'You' }).click();
  await expect(page.locator('.profile-numbers')).toContainText('WORLD POSITION');
});
