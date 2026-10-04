import { expect, test } from '@playwright/test';
import fs from 'node:fs';

const TABS = ['Home', 'Music', 'Studio', 'Contracts', 'Social', 'Discover', 'Settings'];
const screenshotDir = '/tmp/treblr-rebuild/screenshots';
fs.mkdirSync(screenshotDir, { recursive: true });

async function startCareer(page, { width = 390, height = 844, name = 'Nova Field', market = 'lagos', genre = 'afrobeats' } = {}) {
  await page.setViewportSize({ width, height });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /start your career/i })).toBeVisible();
  await page.getByRole('button', { name: /start your career/i }).click();
  await page.getByTestId('artist-name').fill(name);
  await page.getByTestId(`market-${market}`).click();
  await page.getByTestId(`genre-${genre}`).click();
  await page.getByTestId('begin-career').click();
  await expect(page.getByTestId('career-shell')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your week, in motion' })).toBeVisible();
}

function watchRuntime(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`PAGE ${error.message}`));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(`CONSOLE ${message.text()}`); });
  page.on('requestfailed', (request) => errors.push(`REQUEST ${request.url()} ${request.failure()?.errorText || ''}`));
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`HTTP ${response.status()} ${response.url()}`); });
  return errors;
}

async function noHorizontalOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

async function expectLocalEditorialAssets(page) {
  await expect(page.locator('.live-editorial')).toBeVisible();
  const images = await page.locator('.live-editorial-photo img').evaluateAll((items) => items.map((image) => ({ loaded: image.complete && image.naturalWidth > 0, source: new URL(image.currentSrc).pathname })));
  expect(images).toHaveLength(2);
  expect(images.every((image) => image.loaded && image.source.startsWith('/assets/live/'))).toBe(true);
  const loadedFont = await page.evaluate(async () => {
    await document.fonts.load('800 32px "Bricolage Grotesque"');
    return document.fonts.check('800 32px "Bricolage Grotesque"');
  });
  expect(loadedFont).toBe(true);
  const displayFamily = await page.locator('.page-intro h1').evaluate((element) => getComputedStyle(element).fontFamily);
  expect(displayFamily).toMatch(/Bricolage Grotesque/);
}

test('mobile career keeps the seven desks and five-market world playable', async ({ page }) => {
  await startCareer(page, { width: 390, height: 844, name: 'Global Route Artist', market: 'accra', genre: 'hiphop' });
  const nav = page.locator('.mobile-nav');
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('button')).toHaveCount(7);
  expect(await nav.locator('button span:last-child').allTextContents()).toEqual(TABS);
  await noHorizontalOverflow(page);
  await expectLocalEditorialAssets(page);
  await page.screenshot({ path: `${screenshotDir}/treblr-mobile.png`, animations: 'disabled' });
  await page.screenshot({ path: `${screenshotDir}/treblr-home-mobile.png`, animations: 'disabled', fullPage: true, style: '.mobile-nav { position: static !important; }' });
  await page.getByRole('button', { name: /find a room in accra/i }).click();
  await expect(page.getByRole('heading', { name: 'Pick the room—and the terms.' })).toBeVisible();
  await nav.getByTestId('tab-home').click();
  await expect(page.locator('main').first()).not.toContainText(/beat|sequencer|instrument|rhythm pad|arrangement/i);

  const routeHeadings = [
    ['Music', 'A catalogue takes shape.'],
    ['Studio', 'Make room to grow.'],
    ['Contracts', 'Pick the room—and the terms.'],
    ['Social', 'Tell the story around the work.'],
    ['Discover', 'The next door can come from anywhere.'],
    ['Settings', 'Keep the career yours.'],
  ];
  for (const [tab, heading] of routeHeadings) {
    await nav.getByRole('button', { name: tab, exact: true }).click();
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    await noHorizontalOverflow(page);
  }

  await nav.getByTestId('tab-contracts').click();
  await expect(page.locator('.market-card')).toHaveCount(5);
  await page.screenshot({ path: `${screenshotDir}/treblr-contracts-mobile.png`, animations: 'disabled' });
  for (const city of ['Lagos', 'Atlanta', 'London', 'Accra', 'Toronto']) {
    await expect(page.locator('.market-card').filter({ hasText: city })).toHaveCount(1);
  }
  await nav.getByTestId('tab-social').click();
  await expect(page.locator('.social-story')).toHaveCount(3);
  await expect(page.getByText(/No account is connected and nothing is posted outside/i)).toBeVisible();
});

test('career choices create and release a project, reach a market, and settle the week', async ({ page }) => {
  const runtimeErrors = watchRuntime(page);
  await startCareer(page, { width: 390, height: 844, name: 'Room Reader', market: 'lagos', genre: 'rnb' });
  const initial = await page.evaluate(() => JSON.parse(localStorage.getItem('treblr.career.life.v2')));

  await page.locator('.mobile-nav').getByTestId('tab-studio').click();
  await page.getByTestId('studio-session-writing').click();
  await expect(page.getByRole('status')).toContainText(/writing room wrapped/i);
  const ready = await page.evaluate(() => JSON.parse(localStorage.getItem('treblr.career.life.v2')));
  expect(ready.projects[0]).toMatchObject({ status: 'ready', type: 'Single' });
  expect(ready.projects[0].arrangement).toBeUndefined();
  expect(ready.songs).toBeUndefined();
  expect(ready.actionPoints).toBe(2);

  await page.locator('.mobile-nav').getByTestId('tab-music').click();
  await page.getByTestId(`release-${ready.projects[0].id}`).click();
  await expect(page.getByRole('status')).toContainText(/is out/i);
  const released = await page.evaluate(() => JSON.parse(localStorage.getItem('treblr.career.life.v2')));
  expect(released.projects[0].status).toBe('released');
  expect(released.stats.releases).toBe(1);

  await page.locator('.mobile-nav').getByTestId('tab-contracts').click();
  await page.getByTestId('gig-atlanta').click();
  await expect(page.getByRole('status')).toContainText(/night at Signal Hall, Atlanta/i);
  const gig = await page.evaluate(() => JSON.parse(localStorage.getItem('treblr.career.life.v2')));
  expect(gig.currentMarketId).toBe('atlanta');
  expect(gig.marketProgress.atlanta.gigs).toBe(1);
  expect(gig.stats.tourStops).toBe(1);
  expect(gig.actionPoints).toBe(0);

  await page.locator('.mobile-nav').getByTestId('tab-social').click();
  await page.getByTestId('social-post-live-recap').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('treblr.career.life.v2')).socialStats.posts)).toBe(1);
  await page.getByTestId('close-week').click();
  await expect(page.getByRole('dialog', { name: /your work is moving/i })).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText(/new fans/i);
  await page.getByRole('button', { name: /start week 02/i }).click();
  const settled = await page.evaluate(() => JSON.parse(localStorage.getItem('treblr.career.life.v2')));
  expect(settled.week).toBe(2);
  expect(settled.actionPoints).toBe(3);
  expect(settled.socialEnergy).toBe(3);
  expect(settled.stats.lastWeekStreams).toBeGreaterThan(0);
  expect(settled.fans).toBeGreaterThan(initial.fans);
  await noHorizontalOverflow(page);
  expect(runtimeErrors).toEqual([]);
});

test('desktop navigation and career export work without overflow', async ({ page }) => {
  await startCareer(page, { width: 1440, height: 960, name: 'Studio Atlas Artist', market: 'toronto' });
  const desktopNav = page.locator('.desktop-nav');
  await expect(desktopNav).toBeVisible();
  await expect(page.locator('.mobile-nav')).toBeHidden();
  await expect(desktopNav.getByRole('button')).toHaveCount(7);
  await noHorizontalOverflow(page);
  await expectLocalEditorialAssets(page);
  await page.screenshot({ path: `${screenshotDir}/treblr-desktop.png`, animations: 'disabled' });
  await page.screenshot({ path: `${screenshotDir}/treblr-home-desktop.png`, animations: 'disabled', fullPage: true });

  await desktopNav.getByTestId('tab-studio').click();
  await expect(page.getByRole('heading', { name: 'Make room to grow.' })).toBeVisible();
  await noHorizontalOverflow(page);
  await page.screenshot({ path: `${screenshotDir}/treblr-studio-desktop.png`, animations: 'disabled' });
  await desktopNav.getByTestId('tab-contracts').click();
  await expect(page.locator('.market-card')).toHaveCount(5);
  await desktopNav.getByTestId('tab-settings').click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /export career backup/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('studio-atlas-artist-treblr-career.json');
});
