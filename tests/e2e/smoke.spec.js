import { expect, test } from '@playwright/test';

test('production app boots, starts a career, and uses Chirp compose without runtime errors', async ({ page }) => {
  const browserErrors = [];
  page.on('pageerror', error => browserErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') browserErrors.push(`${message.text()} ${message.location().url || ''}`.trim());
  });
  page.on('requestfailed', request => browserErrors.push(`REQUEST FAILED ${request.url()} ${request.failure()?.errorText || ''}`));
  page.on('response', response => {
    if (response.status() >= 400) browserErrors.push(`HTTP ${response.status()} ${response.url()}`);
  });

  await page.goto('/');
  await expect(page.locator('#root')).toContainText('TREBLR');
  await expect(page.getByRole('button', { name:'START CAREER' })).toBeVisible();
  await page.getByRole('button', { name:'START CAREER' }).click();

  await page.getByLabel('Stage Name').fill('Smoke Artist');
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

  for (const tabName of ['Create', 'Business', 'Profile']) {
    await page.getByRole('button', { name:tabName, exact:true }).click();
    await expect(page.locator('.tab-content')).toBeVisible();
  }

  await page.getByRole('button', { name:'Social', exact:true }).click();
  await page.getByRole('button', { name:/Chirp/ }).click();
  await expect(page.getByText('Chirp', { exact:true })).toBeVisible();
  await page.locator('.soc-fab').click();
  const composer = page.getByPlaceholder("What's happening?");
  await expect(composer).toBeVisible();
  await composer.fill('Smoke test post — the feed is alive.');
  await page.getByRole('button', { name:'Post', exact:true }).click();
  await expect(page.getByText('Smoke test post — the feed is alive.')).toBeVisible();

  expect(browserErrors).toEqual([]);
});
