import { expect, test } from '@playwright/test';

async function startStudioCareer(page) {
  await page.goto('/');
  await page.getByRole('button', { name:'START CAREER' }).click();
  await page.getByLabel('Stage Name').fill('Studio Control QA');
  await page.getByLabel('Real Name').fill('Test Player');
  await page.getByLabel('Display Currency').selectOption('USD');
  await page.getByRole('button', { name:'NEXT →' }).click();
  await page.getByRole('radio', { name:/Afrobeats/ }).click();
  await page.getByRole('button', { name:'NEXT →' }).click();
  await page.getByRole('radio', { name:/Lagos/ }).click();
  await page.getByRole('button', { name:'NEXT →' }).click();
  await page.getByRole('radio', { name:/Rich Kid/ }).click();
  await page.getByRole('button', { name:'BEGIN CAREER →' }).click();
  await page.getByRole('button', { name:'Studio', exact:true }).click();
  await page.getByLabel('Track title').fill('Late Night Driver');
}

for (const viewport of [{ width:390, height:844 }, { width:430, height:900 }]) {
  test(`Studio console choices stay readable and drive the real record quote at ${viewport.width}px`, async ({ page }) => {
    const browserErrors=[];
    page.on('pageerror', error => browserErrors.push(error.message));
    await page.setViewportSize(viewport);
    await startStudioCareer(page);

    const nav=page.locator('.tab-bar');
    await expect(nav.getByRole('button')).toHaveCount(7);
    await expect(nav).toHaveCSS('backdrop-filter', /blur\(18px\)/);
    await expect(page.getByRole('heading', { name:'New song', exact:true })).toBeVisible();

    await page.getByRole('tab', { name:/Producer/ }).click();
    const producerOptions=page.locator('.studio-option-list');
    await expect(producerOptions.getByRole('button')).toHaveCount(5);
    const producerSizes=await producerOptions.getByRole('button').evaluateAll(buttons => buttons.map(button => {
      const rect=button.getBoundingClientRect();
      return { width:rect.width, height:rect.height };
    }));
    expect(producerSizes.every(rect => rect.width >= 44 && rect.height >= 44)).toBe(true);
    await producerOptions.getByRole('button', { name:/Local Producer/ }).click();
    await expect(producerOptions.getByRole('button', { name:/Local Producer/ })).toHaveAttribute('aria-pressed', 'true');
    const estimate=page.locator('.studio-live-estimate > div').filter({ hasText:'Session total' });
    await expect(estimate).toContainText('$200.0k');

    await page.getByRole('tab', { name:/Mix & master/ }).click();
    const mixOptions=page.locator('.studio-finish-grid[aria-label="Mix engineer options"]');
    const masterOptions=page.locator('.studio-finish-grid[aria-label="Mastering options"]');
    await expect(mixOptions.getByRole('button')).toHaveCount(3);
    await expect(masterOptions.getByRole('button')).toHaveCount(3);
    const finishSizes=await page.locator('.studio-finish-card').evaluateAll(buttons => buttons.map(button => {
      const rect=button.getBoundingClientRect();
      return { width:rect.width, height:rect.height };
    }));
    expect(finishSizes.every(rect => rect.width >= 44 && rect.height >= 44)).toBe(true);
    await mixOptions.getByRole('button', { name:/Local room mix/ }).click();
    await expect(mixOptions.getByRole('button', { name:/Local room mix/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(estimate).toContainText('$380.0k');
    await masterOptions.getByRole('button', { name:/Balanced master/ }).click();
    await expect(masterOptions.getByRole('button', { name:/Balanced master/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(estimate).toContainText('$500.0k');

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await page.getByRole('button', { name:/RECORD.*Late Night Driver/ }).click();
    await expect(page.getByRole('heading', { name:'Projects', exact:true })).toBeVisible();
    await nav.getByRole('button', { name:'Music', exact:true }).click();
    await expect(page.locator('.release-art-card')).toHaveCount(1);
    await expect(page.locator('.li-topbar-money')).toHaveText('$29.5M');
    await expect(page.getByLabel('Energy 75 of 100')).toBeVisible();
    await expect(page.getByLabel('2 of 3 weekly action points remaining')).toBeVisible();
    await page.getByRole('button', { name:/VIEW PRODUCTION CREDITS/ }).click();
    const credits=page.locator('.track-credit-panel');
    await expect(credits).toContainText('Local Producer');
    await expect(credits).toContainText('Local room mix');
    await expect(credits).toContainText('Balanced master');
    await expect(credits).toContainText('$500.0k');
    expect(browserErrors).toEqual([]);
  });
}
