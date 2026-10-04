import { expect, test } from '@playwright/test';

async function startCareer(page, viewport) {
  await page.setViewportSize(viewport);
  await page.goto('/');
  await page.getByRole('button', { name: /start your career/i }).click();
  await page.getByTestId('artist-name').fill(`Studio ${viewport.width}`);
  await page.getByTestId('market-toronto').click();
  await page.getByTestId('genre-rnb').click();
  await page.getByTestId('begin-career').click();
  await expect(page.getByTestId('career-shell')).toBeVisible();
}

for (const viewport of [{ width: 320, height: 800 }, { width: 430, height: 900 }]) {
  test(`career choices are touch-ready at ${viewport.width}px without horizontal overflow`, async ({ page }) => {
    await startCareer(page, viewport);
    if (viewport.width === 320) await page.screenshot({ path: '/tmp/treblr-rebuild/screenshots/treblr-home-narrow.png', animations: 'disabled' });
    const fits = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await fits();
    const nav = page.locator('.mobile-nav');
    await expect(nav.getByRole('button')).toHaveCount(7);
    await expect(page.locator('main').first()).not.toContainText(/beat|sequencer|instrument|rhythm pad|arrangement/i);

    await nav.getByTestId('tab-studio').click();
    await expect(page.locator('.session-card')).toHaveCount(3);
    await expect(page.getByRole('heading', { name: 'Make room to grow.' })).toBeVisible();
    if (viewport.width === 430) await page.screenshot({ path: '/tmp/treblr-rebuild/screenshots/treblr-studio-mobile.png', animations: 'disabled' });
    await fits();
    await page.getByTestId('studio-session-writing').click();
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('treblr.career.life.v2')));
    expect(saved.projects[0].status).toBe('ready');
    expect(saved.actionPoints).toBe(2);
    await fits();

    for (const [tab, heading] of [['Contracts', 'Pick the room—and the terms.'], ['Social', 'Tell the story around the work.'], ['Discover', 'The next door can come from anywhere.'], ['Settings', 'Keep the career yours.']]) {
      await nav.getByRole('button', { name: tab, exact: true }).click();
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
      await fits();
    }
  });
}

test('city focus follows opportunities across tabs and a tour stop pulses the live route', async ({ page }) => {
  await startCareer(page, { width: 390, height: 844 });
  await page.getByTestId('route-city-atlanta').click();
  await expect(page.locator('.dispatch-readout')).toContainText('Atlanta');
  await page.locator('.mobile-nav').getByTestId('tab-contracts').click();
  await expect(page.locator('.dispatch-readout')).toContainText('Atlanta');
  await page.getByTestId('circuit-market-london').click();
  await expect(page.locator('.dispatch-readout')).toContainText('London');
  await page.getByTestId('focus-gig-london').click();
  await expect(page.getByRole('status')).toContainText(/night at Platform 9, London/i);
  await expect(page.locator('.circuit-dispatch .hub-signal')).toBeVisible();
  await expect(page.locator('.circuit-dispatch .route-signal').first()).toBeVisible();
  const arrived = await page.evaluate(() => JSON.parse(localStorage.getItem('treblr.career.life.v2')));
  expect(arrived.currentMarketId).toBe('london');
  expect(arrived.marketProgress.london.gigs).toBe(1);

  await page.locator('.mobile-nav').getByTestId('tab-music').click();
  await expect(page.getByTestId('audience-market-london')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('audience-market-accra').click();
  await expect(page.getByTestId('audience-market-accra')).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: '/tmp/treblr-rebuild/screenshots/treblr-music-mobile.png', animations: 'disabled' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});
