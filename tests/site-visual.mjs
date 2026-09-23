import { firefox } from 'playwright';
import fs from 'node:fs/promises';

const baseUrl = process.env.SITE_URL || 'http://127.0.0.1:4173';
const outputDir = 'artifacts/visual';
await fs.mkdir(outputDir, { recursive: true });

const viewports = [
  { name: 'desktop-1440', width: 1440, height: 1000 },
  { name: 'laptop-1024', width: 1024, height: 900 },
  { name: 'tablet-768', width: 768, height: 900 },
  { name: 'mobile-500', width: 500, height: 900 },
  { name: 'mobile-390', width: 390, height: 844 }
];
const themes = ['dark', 'light'];
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const browser = await firefox.launch();

for (const viewport of viewports) {
  for (const theme of themes) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: 'reduce'
    });
    const page = await context.newPage();

    await page.addInitScript((value) => localStorage.setItem('site-theme', value), theme);
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.addStyleTag({
      content: '*{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important}'
    });

    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      theme: document.documentElement.dataset.theme
    }));
    check(metrics.scrollWidth <= metrics.clientWidth + 1, `${viewport.name}/${theme}: horizontal overflow`);
    check(metrics.theme === theme, `${viewport.name}/${theme}: wrong theme`);

    const hero = page.locator('#demo');
    check(await hero.count() === 1, `${viewport.name}/${theme}: missing #demo`);

    if (await hero.count()) {
      await hero.evaluate((el) => {
        el.dataset.flowMode = 'watch';
        el.dataset.flowPhase = 'answer';
      });

      const heroBox = await hero.boundingBox();
      const youtubeBox = await page.locator('.youtube-page-mock').boundingBox();
      const geminiBox = await page.locator('.gemini-app-mock').boundingBox();

      if (heroBox && youtubeBox) {
        check(
          youtubeBox.x >= heroBox.x - 50 && youtubeBox.x + youtubeBox.width <= heroBox.x + heroBox.width + 50,
          `${viewport.name}/${theme}: YouTube mock escapes hero`
        );
      }
      if (heroBox && geminiBox) {
        check(
          geminiBox.x >= heroBox.x - 90 && geminiBox.x + geminiBox.width <= heroBox.x + heroBox.width + 90,
          `${viewport.name}/${theme}: Gemini mock escapes hero`
        );
      }

      await hero.screenshot({ path: `${outputDir}/${viewport.name}-${theme}-watch.png` });

      await hero.evaluate((el) => {
        el.dataset.flowMode = 'feed';
        el.dataset.flowPhase = 'select';
      });
      await hero.screenshot({ path: `${outputDir}/${viewport.name}-${theme}-feed.png` });
    }

    const menuButton = page.locator('.menu-button');
    const nav = page.locator('.nav-links');
    if (viewport.width <= 920) {
      check(await menuButton.isVisible(), `${viewport.name}/${theme}: compact menu button hidden`);
      if (await menuButton.isVisible()) {
        await menuButton.click();
        check(await nav.evaluate((el) => el.classList.contains('open')), `${viewport.name}/${theme}: menu did not open`);
        const navBox = await nav.boundingBox();
        if (navBox) {
          check(navBox.x >= -1, `${viewport.name}/${theme}: nav escapes left edge`);
          check(navBox.x + navBox.width <= viewport.width + 1, `${viewport.name}/${theme}: nav escapes right edge`);
          check(navBox.height <= viewport.height - 60, `${viewport.name}/${theme}: nav too tall`);
        }
      }
    } else {
      check(!(await menuButton.isVisible()), `${viewport.name}/${theme}: compact menu visible above 920px`);
      check(await nav.isVisible(), `${viewport.name}/${theme}: desktop nav hidden`);
    }

    await page.screenshot({
      path: `${outputDir}/${viewport.name}-${theme}-home.png`,
      fullPage: true
    });

    await page.goto(`${baseUrl}/privacy.html`, { waitUntil: 'networkidle' });
    const privacyMetrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth
    }));
    check(
      privacyMetrics.scrollWidth <= privacyMetrics.clientWidth + 1,
      `${viewport.name}/${theme}: privacy page horizontal overflow`
    );
    await page.screenshot({
      path: `${outputDir}/${viewport.name}-${theme}-privacy.png`,
      fullPage: true
    });

    await context.close();
  }
}

await browser.close();

if (failures.length) {
  console.error('\nVisual checks failed:\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Visual checks passed for ${viewports.length} viewports × ${themes.length} themes.`);
