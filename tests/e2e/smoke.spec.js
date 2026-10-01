import { expect, test } from '@playwright/test';

async function startCareer(page, stageName = 'Smoke Artist', currency = 'NGN') {
  await page.goto('/');
  await expect(page.locator('#root')).toContainText('TREBLR');
  await page.getByRole('button', { name:'START CAREER' }).click();
  await page.getByLabel('Stage Name').fill(stageName);
  await page.getByLabel('Real Name').fill('Test Player');
  await page.getByLabel('Display Currency').selectOption(currency);
  await page.getByRole('button', { name:'NEXT →' }).click();
  await page.getByRole('radio', { name:/Afrobeats/ }).click();
  await page.getByRole('button', { name:'NEXT →' }).click();
  await page.getByRole('radio', { name:/Lagos/ }).click();
  await page.getByRole('button', { name:'NEXT →' }).click();
  await page.getByRole('radio', { name:/Social Media Star/ }).click();
  await page.getByRole('button', { name:'BEGIN CAREER →' }).click();
  await expect(page.getByRole('heading', { name:'The week you make the move.' })).toBeVisible();
  await expect(page.getByLabel('3 of 3 weekly action points remaining')).toBeVisible();
}

async function dismissTestEventPrompt(page) {
  const overlay = page.locator('.overlay');
  if (!await overlay.isVisible().catch(() => false)) return;
  const acknowledgement = overlay.getByRole('button', { name:'GOT IT', exact:true });
  if (await acknowledgement.isVisible().catch(() => false)) {
    await acknowledgement.click();
  } else {
    // A choice prompt belongs only to this isolated test career; take its first modeled option.
    await overlay.getByRole('button').first().click();
  }
}

test('mobile task navigation stays readable and every primary destination remains reachable', async ({ page }, testInfo) => {
  await page.setViewportSize({ width:430, height:900 });
  await startCareer(page, 'Glass Nav Artist');
  const capture = async (name) => {
    if (process.env.CAPTURE_ARTIFACTS === '1') {
      await page.waitForTimeout(750);
      await page.screenshot({ path:testInfo.outputPath(`redesign-${name}.png`), fullPage:true });
    }
  };
  await capture('home');
  const nav = page.locator('.tab-bar');
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('button')).toHaveCount(5);
  for (const [name, screenshot] of [['Music','music-catalog'], ['Career','career-overview'], ['News','news-wire'], ['Profile','profile-dossier']]) {
    const button = nav.getByRole('button', { name, exact:true });
    await expect(button).toBeVisible();
    await button.click();
    if (name !== 'Home') await capture(screenshot);
  }
  expect(await nav.evaluate(element => getComputedStyle(element).backdropFilter)).toContain('blur(16px)');
});

test('390px phone task indexes expose every nested route without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 });
  await startCareer(page, 'Narrow Phone Artist');
  for (const [primary, count] of [['Music', 6], ['Career', 6], ['News', 4], ['Profile', 4]]) {
    await page.getByRole('button', { name:primary, exact:true }).click();
    const index = page.locator('.section-nav');
    await expect(index).toBeVisible();
    await expect(index.getByRole('tab')).toHaveCount(count);
    for (const tab of await index.getByRole('tab').all()) await expect(tab).toBeVisible();
    expect(await index.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
});

test('chosen display currency persists without converting the simulation balance', async ({ page }) => {
  await page.setViewportSize({ width:430, height:900 });
  await startCareer(page, 'Currency Artist', 'USD');
  await expect(page.locator('.li-topbar-money')).toHaveText('$2.5M');
  const saved = await page.evaluate(() => Object.keys(localStorage)
    .filter(key => key.startsWith('treblr_v4_slot_'))
    .map(key => JSON.parse(localStorage.getItem(key)))
    .find(slot => slot.stageName === 'Currency Artist'));
  expect(saved.currency).toBe('USD');
  expect(saved.money).toBe(2_500_000);

  await page.getByRole('button', { name:'Profile', exact:true }).click();
  await page.getByRole('tab', { name:'Settings', exact:true }).click();
  await expect(page.getByText('US Dollar (USD)', { exact:true })).toBeVisible();
  await page.reload();
  await expect(page.locator('.save-card')).toContainText('$2.5M');
  await page.getByRole('button', { name:'CONTINUE', exact:true }).click();
  await expect(page.locator('.li-topbar-money')).toHaveText('$2.5M');
});

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
  await page.setViewportSize({ width:390, height:844 });
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
  const captureStudio = async (name, position = 'top') => {
    if (process.env.CAPTURE_ARTIFACTS === '1') {
      if (position === 'bottom') {
        await page.locator('.music-screen').evaluate(element => { element.scrollTop = element.scrollHeight; });
      } else if (position === 'top') {
        await page.locator('.music-screen').evaluate(element => { element.scrollTop = 0; });
      } else if (position !== 'keep') {
        await page.locator(position).first().evaluate(element => element.scrollIntoView({ block:'center', inline:'nearest' }));
      }
      await page.waitForTimeout(400);
      await page.screenshot({ path:testInfo.outputPath(`${name}.png`), fullPage:false });
    }
  };
  await page.getByRole('button', { name:'Music', exact:true }).click();
  await page.getByRole('tab', { name:'Record', exact:true }).click();
  const title = 'One More Night';
  await page.getByPlaceholder('e.g. No Mercy, Levels, Timeless...').fill(title);
  await captureStudio('studio-390-track-setup', '#studio-track-title');
  await page.setViewportSize({ width:430, height:900 });
  await captureStudio('studio-430-track-setup');
  await page.setViewportSize({ width:390, height:844 });
  await page.getByRole('tab', { name:/Producer/ }).click();
  await page.getByRole('button', { name:/Local Producer/ }).click();
  await captureStudio('studio-390-producer-choices', '.studio-option-list');
  await page.getByRole('tab', { name:/Voice & feature/ }).click();
  await page.getByRole('button', { name:/D-Tier/ }).click();
  await captureStudio('studio-390-vocal-choices', '.studio-tier-artists button');
  await expect.poll(() => page.locator('.studio-tier-artists .studio-artist-avatar img').first().evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  const featureChoice = page.locator('.studio-tier-artists button').first();
  const featureName = (await featureChoice.innerText()).split('\n')[0];
  await featureChoice.click();
  await page.getByRole('tab', { name:/Mix & master/ }).click();
  await page.getByRole('button', { name:/Local room mix/ }).click();
  await page.getByRole('button', { name:/Balanced master/ }).click();
  await captureStudio('studio-390-mix-choices', '.studio-choice-section');
  await page.locator('.studio-choice-section').nth(1).scrollIntoViewIfNeeded();
  await captureStudio('studio-390-master-choices', 'keep');
  await page.setViewportSize({ width:430, height:900 });
  await captureStudio('studio-430-production-choices');
  await page.setViewportSize({ width:390, height:844 });
  await captureStudio('studio-390-production-cost-review', '.studio-final-credits');
  await page.getByRole('tab', { name:/Track/ }).click();
  await expect(page.getByLabel('Track title')).toHaveValue(title);
  await page.getByRole('tab', { name:/Mix & master/ }).click();
  await expect(page.getByText(/One charge.*only when you record/i)).toBeVisible();
  await page.getByRole('button', { name:/RECORD.*ONE MORE NIGHT.*1 AP/i }).click();
  await expect(page.getByRole('heading', { name:'Catalog' })).toBeVisible();
  await expect(page.getByText(title, { exact:true })).toBeVisible();
  await page.getByRole('button', { name:/VIEW PRODUCTION CREDITS/ }).click();
  await expect(page.getByText('Production paid at record')).toBeVisible();
  await expect(page.getByText(featureName, { exact:true })).toBeVisible();
  if (process.env.CAPTURE_ARTIFACTS === '1') await expect(page.locator('.toast')).toBeHidden({ timeout:5_000 });
  await captureStudio('studio-390-catalog-credits', '.track-credit-panel');
  if (process.env.CAPTURE_ARTIFACTS === '1') {
    await expect(page.locator('.toast')).toBeHidden({ timeout:5_000 });
    await page.waitForTimeout(750);
    await page.screenshot({ path:testInfo.outputPath('redesign-music-catalog-with-artwork.png'), fullPage:false });
  }

  await page.getByRole('tab', { name:'Release', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Release' })).toBeVisible();
  await expect(page.getByText('Modeled release effects')).toBeVisible();
  await page.getByRole('button', { name:/Targeted Campaign/ }).click();
  await captureStudio('studio-390-rollout-choice', 'bottom');
  await page.getByRole('button', { name:/RELEASE.*ONE MORE NIGHT.*1 AP/i }).click();
  await expect(page.getByRole('heading', { name:'Performance' })).toBeVisible();
  await expect(page.getByRole('heading', { name:title })).toBeVisible();
  const coverArt = page.locator('.performance-art img');
  await expect(coverArt).toHaveAttribute('src', /\/assets\/covers\/cov_/);
  await expect.poll(() => coverArt.evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByText('Listeners by country or city', { exact:false })).toBeVisible();
  await expect(page.locator('.toast')).toBeHidden({ timeout:5_000 });
  await captureStudio('studio-390-release-live');

  await page.getByRole('button', { name:'Home', exact:true }).click();
  await page.getByRole('button', { name:'END WEEK', exact:true }).click();
  await expect(page.getByRole('dialog', { name:'Week 1' })).toBeVisible();
  await dismissTestEventPrompt(page);
  await page.getByRole('button', { name:/CONTINUE/ }).click();
  if (process.env.CAPTURE_ARTIFACTS === '1') {
    await page.locator('.home-scroll').evaluate(element => { element.scrollTop = 0; });
    await page.waitForTimeout(750);
    await page.screenshot({ path:testInfo.outputPath('redesign-home-week-2.png'), fullPage:true });
  }
  await page.getByRole('button', { name:'Music', exact:true }).click();
  await page.getByRole('tab', { name:'Performance', exact:true }).click();
  await expect(page.getByRole('img', { name:/1 closed weeks/ })).toBeVisible();
  await expect(page.getByRole('heading', { name:title })).toBeVisible();
  await page.locator('.stream-chart-wrap').scrollIntoViewIfNeeded();

  if (process.env.CAPTURE_ARTIFACTS === '1') {
    await page.screenshot({ path:testInfo.outputPath('treblr-mobile-performance.png'), fullPage:false });
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
  await expect(page.getByText('ACTIVITY LEDGER', { exact:true })).toBeVisible();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'Settings', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Settings' })).toBeVisible();

  expect(browserErrors).toEqual([]);
});
