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
  await expect(page.getByRole('heading', { name:'Home', exact:true })).toBeVisible();
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

test('mobile task navigation exposes all seven named destinations and captures each page', async ({ page }, testInfo) => {
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
  await expect(nav.getByRole('button')).toHaveCount(7);
  for (const [name, screenshot] of [['Music','music'], ['Studio','studio'], ['Contracts','contracts'], ['Social','social'], ['Discover','discover'], ['Settings','settings']]) {
    const button = nav.getByRole('button', { name, exact:true });
    await expect(button).toBeVisible();
    await button.click();
    await expect(page.locator('main[aria-label="Career simulation"]')).toBeVisible();
    await capture(screenshot);
  }
  const widths = await nav.getByRole('button').evaluateAll(buttons => buttons.map(button => button.getBoundingClientRect().width));
  expect(widths.every(width => width >= 44)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  expect(await nav.evaluate(element => getComputedStyle(element).backdropFilter)).toContain('blur(18px)');
  expect(await nav.evaluate(element => getComputedStyle(element).backdropFilter)).toContain('saturate(1.45)');
});

test('mobile glass navigation keeps seven labels readable and clear of content at 390px and 430px', async ({ page }) => {
  await page.setViewportSize({ width:430, height:900 });
  await startCareer(page, 'Glass Readability Artist');
  const expectedLabels = ['Home','Music','Studio','Contracts','Social','Discover','Settings'];

  for (const viewport of [{ width:390, height:844 }, { width:430, height:900 }]) {
    await page.setViewportSize(viewport);
    const nav = page.locator('.tab-bar');
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('button')).toHaveCount(expectedLabels.length);
    for (const label of expectedLabels) {
      const button = nav.getByRole('button', { name:label, exact:true });
      await expect(button).toBeVisible();
      await expect(button.locator('.tab-btn-label')).toHaveText(label);
      expect(await button.locator('.tab-btn-label').evaluate(node => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    }

    const material = await nav.evaluate(element => {
      const style = getComputedStyle(element);
      const match = style.backgroundColor.match(/[\d.]+/g) || [];
      const box = element.getBoundingClientRect();
      const shell = document.querySelector('.app-shell').getBoundingClientRect();
      const main = document.querySelector('.app-main').getBoundingClientRect();
      return {
        backgroundColor:style.backgroundColor,
        alpha:Number(match[3]),
        backdropFilter:style.backdropFilter,
        left:box.left,
        top:box.top,
        bottom:box.bottom,
        shellBottom:shell.bottom,
        mainBottom:main.bottom,
        scrollWidth:element.scrollWidth,
        clientWidth:element.clientWidth,
      };
    });
    expect(material.alpha).toBeGreaterThan(0.5);
    expect(material.alpha).toBeLessThan(0.9);
    expect(material.backdropFilter).toContain('blur(18px)');
    expect(material.backdropFilter).toContain('saturate(1.45)');
    expect(material.left).toBeGreaterThanOrEqual(0);
    expect(material.bottom).toBeCloseTo(material.shellBottom, 0);
    expect(material.mainBottom).toBeLessThanOrEqual(material.top + 1);
    expect(material.scrollWidth).toBeLessThanOrEqual(material.clientWidth + 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
});

test('mobile Home shows the modular career dashboard, scrolls fully, and opens each live widget destination', async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 });
  await startCareer(page, 'Dashboard Artist');
  const dashboard = page.locator('.mod-home-root');
  await expect(dashboard).toBeVisible();
  for (const heading of ['MY CAREER DASHBOARD', 'CAREER OPERATIONS', 'OFF-STAGE SNAPSHOT', 'RECENT ACTIVITY & LOGS', 'YOUR NEXT MOVE']) {
    await expect(dashboard.getByText(heading, { exact:true })).toBeVisible();
  }
  await expect(dashboard.getByRole('button', { name:'END WEEK', exact:true })).toBeVisible();
  expect(await page.locator('.mod-home-scroll').evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);

  await dashboard.getByRole('button', { name:/OPEN THE STUDIO/ }).click();
  await expect(page.getByRole('heading', { name:'New song', exact:true })).toBeVisible();
  await page.getByRole('button', { name:'Home', exact:true }).click();
  await page.locator('.mod-home-root').getByRole('button', { name:/OPEN FINANCES/ }).click();
  await expect(page.getByRole('heading', { name:'Finances', exact:true })).toBeVisible();
  await page.getByRole('button', { name:'Home', exact:true }).click();
  await page.locator('.mod-home-root').getByRole('button', { name:/VIEW AVAILABLE JOBS/ }).click();
  await expect(page.getByRole('heading', { name:'Jobs', exact:true })).toBeVisible();
  await page.getByRole('button', { name:'Home', exact:true }).click();
  await page.locator('.mod-home-root').getByRole('button', { name:/VIEW TOUR DESK/ }).click();
  await expect(page.getByRole('heading', { name:'Tour', exact:true })).toBeVisible();
  await page.getByRole('button', { name:'Home', exact:true }).click();
  await page.locator('.mod-home-root').getByRole('button', { name:/OPEN CONTRACTS/ }).click();
  await expect(page.getByRole('heading', { name:'Labels', exact:true })).toBeVisible();
  await page.getByRole('button', { name:'Home', exact:true }).click();
  await page.locator('.mod-home-root').getByRole('button', { name:/MANAGE YOUR FEED/ }).click();
  await expect(page.getByRole('heading', { name:'Community', exact:true })).toBeVisible();
  await page.getByRole('button', { name:'Home', exact:true }).click();
  const homeScroll = page.locator('.mod-home-scroll');
  await homeScroll.evaluate(element => { element.scrollTop = element.scrollHeight; });
  await expect(page.locator('.mod-home-root').getByRole('button', { name:/OPEN CAREER LOG/ })).toBeVisible();
  await expect(page.getByRole('button', { name:'END WEEK', exact:true })).toBeVisible();
  await expect(page.locator('.tab-bar')).toBeVisible();
  await page.locator('.mod-home-root').getByRole('button', { name:/OPEN CAREER LOG/ }).click();
  await expect(page.getByRole('heading', { name:'Career log', exact:true })).toBeVisible();
});

test('390px phone exposes all seven routes and their full first-level contents without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width:390, height:844 });
  await startCareer(page, 'Narrow Phone Artist');
  const nav = page.locator('.tab-bar');
  await expect(nav.getByRole('button')).toHaveCount(7);
  const primaryScreens = [
    ['Home', 'Home'], ['Music', 'Music'], ['Studio', 'New song'],
    ['Contracts', 'The work behind the music'], ['Social', 'Social desk'],
    ['Discover', 'Discover'], ['Settings', 'Settings'],
  ];
  for (const [primary, heading] of primaryScreens) {
    const button = nav.getByRole('button', { name:primary, exact:true });
    await expect(button).toBeVisible();
    await button.click();
    await expect(page.getByRole('heading', { name:heading, exact:true })).toBeVisible();
  }
  for (const [primary, count] of [['Music', 5], ['Studio', 3], ['Contracts', 6]]) {
    await nav.getByRole('button', { name:primary, exact:true }).click();
    const index = page.locator('.section-nav');
    await expect(index).toBeVisible();
    await expect(index.getByRole('tab')).toHaveCount(count);
    for (const tab of await index.getByRole('tab').all()) await expect(tab).toBeVisible();
    expect(await index.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
  await nav.getByRole('button', { name:'Social', exact:true }).click();
  await expect(page.locator('.social-directory-card')).toHaveCount(12);
  for (const service of ['Instagram','YouTube','Spotify','TikTok','Twitter','Forbes','Wikipedia','Reddit','SoundCloud','Apple Music','iTunes','Tidal']) {
    await expect(page.locator('.social-directory-card').filter({ hasText:service })).toBeVisible();
  }
  await nav.getByRole('button', { name:'Discover', exact:true }).click();
  for (const activity of ['Interviews','Certifications','Lifestyle','Investments','Records & releases']) {
    await expect(page.getByRole('button', { name:new RegExp(activity) })).toBeVisible();
  }
  await nav.getByRole('button', { name:'Settings', exact:true }).click();
  await expect(page.getByText('US Dollar (USD)', { exact:false })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
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

  await page.getByRole('button', { name:'Settings', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Settings', exact:true })).toBeVisible();
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
  for (const tabName of ['Music', 'Studio', 'Contracts', 'Social', 'Discover', 'Settings']) {
    await page.locator('.tab-bar').getByRole('button', { name:tabName, exact:true }).click();
    await expect(page.locator('main[aria-label="Career simulation"]')).toBeVisible();
  }

  await page.getByRole('button', { name:'Home', exact:true }).click();
  await page.locator('.mod-home-root').getByRole('button', { name:/MANAGE YOUR FEED/ }).click();
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
  await page.getByRole('button', { name:'Studio', exact:true }).click();
  await page.getByRole('tab', { name:'New song', exact:true }).click();
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
  await expect(page.getByRole('heading', { name:'Projects' })).toBeVisible();
  await page.getByRole('button', { name:'Music', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Music', exact:true })).toBeVisible();
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
    await page.locator('.mod-home-scroll').evaluate(element => { element.scrollTop = 0; });
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

  await page.getByRole('button', { name:'Contracts', exact:true }).click();
  await expect(page.getByRole('heading', { name:'The work behind the music' })).toBeVisible();
  await page.getByRole('tab', { name:'Overview', exact:true }).click();
  await page.getByRole('button', { name:/Markets/ }).click();
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
  for (const item of ['Home', 'Music', 'Charts', 'Studio', 'Projects', 'Training', 'Contracts', 'Jobs', 'Finances', 'Labels', 'Collabs', 'Markets', 'Tour', 'Festivals', 'Social', 'Discover', 'News', 'Inbox', 'Settings']) {
    await expect(page.locator('.desktop-sidebar').getByRole('button', { name:item, exact:true })).toBeVisible();
  }
  await page.waitForTimeout(750);
  await page.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());

  if (process.env.CAPTURE_ARTIFACTS === '1') {
    await page.screenshot({ path:testInfo.outputPath('treblr-desktop-home.png'), fullPage:true });
  }

  await page.locator('.desktop-sidebar').getByRole('button', { name:'Contracts', exact:true }).click();
  await expect(page.getByRole('heading', { name:'The work behind the music' })).toBeVisible();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'Tour', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Tour' })).toBeVisible();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'Collabs', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Collabs' })).toBeVisible();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'Finances', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Finances' })).toBeVisible();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'Music', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Music', exact:true })).toBeVisible();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'Charts', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Charts' })).toBeVisible();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'Studio', exact:true }).click();
  await expect(page.getByRole('heading', { name:'New song' })).toBeVisible();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'Projects', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Projects' })).toBeVisible();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'Training', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Training' })).toBeVisible();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'Jobs', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Jobs' })).toBeVisible();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'Labels', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Labels' })).toBeVisible();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'Festivals', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Festivals' })).toBeVisible();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'Social', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Social desk' })).toBeVisible();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'Discover', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Discover', exact:true })).toBeVisible();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'News', exact:true }).click();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'Inbox', exact:true }).click();
  await expect(page.getByText('ACTIVITY LEDGER', { exact:true })).toBeVisible();
  await page.locator('.desktop-sidebar').getByRole('button', { name:'Settings', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Settings' })).toBeVisible();

  expect(browserErrors).toEqual([]);
});
