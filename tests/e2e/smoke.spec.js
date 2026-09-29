import { expect, test } from '@playwright/test';

async function startCareer(page, stageName = 'Smoke Artist') {
  await page.goto('/');
  await expect(page.locator('#root')).toContainText('TREBLR');
  await page.getByRole('button', { name:'START CAREER' }).click();
  await page.getByLabel('Stage Name').fill(stageName);
  await page.getByLabel('Real Name').fill('Test Player');
  await page.getByRole('button', { name:'NEXT →' }).click();
  await page.getByRole('radio', { name:/Afrobeats/ }).click();
  await page.getByRole('button', { name:'NEXT →' }).click();
  await page.getByRole('radio', { name:/Lagos/ }).click();
  await page.getByRole('button', { name:'NEXT →' }).click();
  await page.getByRole('radio', { name:/Social Media Star/ }).click();
  await page.getByRole('button', { name:'BEGIN CAREER →' }).click();
  await expect(page.getByText('Next Objective')).toBeVisible();
  await expect(page.getByLabel('3 of 3 weekly action points remaining')).toBeVisible();
}

test('app boots, primary nav works, and Chirp compose persists an in-game post without runtime errors', async ({ page }) => {
  const browserErrors = [];
  page.on('pageerror', error => browserErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') browserErrors.push(`${message.text()} ${message.location().url || ''}`.trim());
  });
  page.on('requestfailed', request => browserErrors.push(`REQUEST FAILED ${request.url()} ${request.failure()?.errorText || ''}`));
  page.on('response', response => {
    if (response.status() >= 400) browserErrors.push(`HTTP ${response.status()} ${response.url()}`);
  });

  await startCareer(page);
  for (const tabName of ['Music', 'Career', 'Profile', 'News']) {
    await page.getByRole('button', { name:tabName, exact:true }).click();
    await expect(page.locator('main[aria-label="Career simulation"]')).toBeVisible();
  }

  await page.getByRole('tab', { name:'Community', exact:true }).click();
  await page.getByRole('button', { name:/Chirp/ }).click();
  await expect(page.getByText('Chirp', { exact:true })).toBeVisible();
  const composeButton = page.getByRole('button', { name:'Compose a post on Chirp', exact:true });
  await expect(composeButton).toBeVisible();
  await composeButton.focus();
  await page.keyboard.press('Enter');
  const composer = page.getByPlaceholder("What's happening?");
  await expect(composer).toBeVisible();
  await composer.fill('Smoke test post — the feed is alive.');
  await page.getByRole('button', { name:'Post', exact:true }).click();
  await expect(page.getByText('Smoke test post — the feed is alive.')).toBeVisible();

  expect(browserErrors).toEqual([]);
});

test('mobile studio records a track, releases it and opens the modeled performance page', async ({ page }, testInfo) => {
  const browserErrors = [];
  page.on('pageerror', error => browserErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') browserErrors.push(`${message.text()} ${message.location().url || ''}`.trim());
  });
  page.on('requestfailed', request => browserErrors.push(`REQUEST FAILED ${request.url()} ${request.failure()?.errorText || ''}`));
  page.on('response', response => {
    if (response.status() >= 400) browserErrors.push(`HTTP ${response.status()} ${response.url()}`);
  });

  await startCareer(page, 'Studio Artist');
  await page.getByRole('button', { name:'Music', exact:true }).click();
  await page.getByRole('tab', { name:'Record', exact:true }).click();
  const title = 'One More Night';
  await page.getByPlaceholder('e.g. No Mercy, Levels, Timeless...').fill(title);
  await page.getByRole('button', { name:'RECORD TRACK · 1 AP' }).click();
  await expect(page.getByRole('heading', { name:'Catalog' })).toBeVisible();
  await expect(page.getByText(title, { exact:true })).toBeVisible();

  await page.getByRole('tab', { name:'Release', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Release' })).toBeVisible();
  await expect(page.getByText('Modeled release effects')).toBeVisible();
  await page.getByRole('button', { name:/RELEASE.*ONE MORE NIGHT.*1 AP/i }).click();
  await expect(page.getByRole('heading', { name:'Performance' })).toBeVisible();
  await expect(page.getByRole('heading', { name:title })).toBeVisible();
  const coverArt = page.locator('.performance-art img');
  await expect(coverArt).toHaveAttribute('src', /\/assets\/covers\/cov_/);
  await expect.poll(() => coverArt.evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByText('Listeners by country or city', { exact:false })).toBeVisible();
  await expect(page.locator('.toast')).toBeHidden({ timeout:5_000 });

  if (process.env.CAPTURE_ARTIFACTS === '1') {
    await page.screenshot({ path:testInfo.outputPath('treblr-mobile-performance.png'), fullPage:true });
  }

  await page.getByRole('button', { name:'Career', exact:true }).click();
  await expect(page.getByRole('heading', { name:'The work behind the music' })).toBeVisible();
  await page.getByRole('tab', { name:'Markets', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Markets' })).toBeVisible();

  expect(browserErrors).toEqual([]);
});

test('1440px desktop exposes the requested left navigation and career routes', async ({ page }, testInfo) => {
  const browserErrors = [];
  await page.setViewportSize({ width:1440, height:1024 });
  page.on('pageerror', error => browserErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') browserErrors.push(`${message.text()} ${message.location().url || ''}`.trim());
  });
  page.on('requestfailed', request => browserErrors.push(`REQUEST FAILED ${request.url()} ${request.failure()?.errorText || ''}`));
  page.on('response', response => {
    if (response.status() >= 400) browserErrors.push(`HTTP ${response.status()} ${response.url()}`);
  });

  await startCareer(page, 'Desktop Artist');
  await expect(page.locator('.desktop-sidebar')).toBeVisible();
  for (const item of ['Home', 'Career', 'Music', 'Releases', 'Shows', 'Collabs', 'Industry', 'Finances', 'News', 'Inbox']) {
    await expect(page.locator('.desktop-sidebar').getByRole('button', { name:item, exact:true })).toBeVisible();
  }
  await page.waitForTimeout(750);
  await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());

  if (process.env.CAPTURE_ARTIFACTS === '1') {
    await page.screenshot({ path:testInfo.outputPath('treblr-desktop-home.png'), fullPage:true });
  }

  await page.locator('.desktop-sidebar').getByRole('button', { name:'Career', exact:true }).click();
  await expect(page.getByRole('heading', { name:'The work behind the music' })).toBeVisible();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'Shows', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Tour' })).toBeVisible();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'Collabs', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Collabs' })).toBeVisible();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'Finances', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Finances' })).toBeVisible();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'Music', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Record' })).toBeVisible();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'Releases', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Release' })).toBeVisible();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'News', exact:true }).click();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'Inbox', exact:true }).click();
  await expect(page.getByText('CAREER INBOX', { exact:true })).toBeVisible();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'Settings', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Settings' })).toBeVisible();

  expect(browserErrors).toEqual([]);
});
