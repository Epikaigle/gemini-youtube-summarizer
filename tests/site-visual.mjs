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
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-360', width: 360, height: 800 }
];
const themes = ['dark', 'light'];
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const browser = await firefox.launch();

const localized = {
  fr: {home: 'Résumé YouTube avec Gemini — Extension Firefox', privacy: 'Confidentialité — Résumé YouTube avec Gemini', how: 'Fonctionnement', light: 'Passer au thème clair', dark: 'Passer au thème sombre', open: 'Ouvrir le menu', close: 'Fermer le menu', pause: 'Mettre en pause l’animation', resume: 'Reprendre l’animation'},
  en: {home: 'YouTube Summarizer with Gemini — Firefox Extension', privacy: 'Privacy — YouTube Summarizer with Gemini', how: 'How it works', light: 'Switch to light theme', dark: 'Switch to dark theme', open: 'Open menu', close: 'Close menu', pause: 'Pause animation', resume: 'Resume animation'},
  es: {home: 'Resumen de YouTube con Gemini — Extensión de Firefox', privacy: 'Privacidad — Resumen de YouTube con Gemini', how: 'Cómo funciona', light: 'Cambiar al tema claro', dark: 'Cambiar al tema oscuro', open: 'Abrir el menú', close: 'Cerrar el menú', pause: 'Pausar la animación', resume: 'Reanudar la animación'},
  zh: {home: 'YouTube 视频总结工具（Gemini）— Firefox 扩展', privacy: '隐私政策 — YouTube 视频总结工具（Gemini）', how: '工作原理', light: '切换到浅色主题', dark: '切换到深色主题', open: '打开菜单', close: '关闭菜单', pause: '暂停动画', resume: '继续动画'}
};

const checkLanguages = async (page, viewport, theme) => {
  for (const [lang, text] of Object.entries(localized)) {
    await page.goto(baseUrl);
    await page.locator(`.lang-btn[data-lang=${lang}]`).click();
    const label = `${viewport.name}/${theme}/${lang}`;
    check(await page.title() === text.home, `${label}: untranslated home title`);
    check(await page.locator('html').getAttribute('lang') === lang, `${label}: wrong language`);
    const toggle = page.locator('#demo-ctrl-toggle');
    await toggle.click();
    check(await toggle.getAttribute('aria-label') === text.resume, `${label}: pause action not translated`);
    await page.locator('#demo-ctrl-replay').click();
    check(await toggle.getAttribute('aria-label') === text.pause, `${label}: replay retained wrong action label`);
    const themeToggle = page.locator('.theme-toggle');
    await themeToggle.click();
    const activeTheme = await page.locator('html').getAttribute('data-theme');
    check(await themeToggle.getAttribute('aria-label') === (activeTheme === 'light' ? text.dark : text.light), `${label}: theme action not translated`);
    await themeToggle.click();
    if (viewport.width <= 920) {
      const menuButton = page.locator('.menu-button');
      check(await menuButton.textContent().then(value => value.trim()) === text.open, `${label}: menu action not translated`);
      await menuButton.click();
      check(await menuButton.textContent().then(value => value.trim()) === text.close, `${label}: open menu action not translated`);
      await page.keyboard.press('Escape');
    }
    check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${label}: localized home overflow`);
    await page.goto(`${baseUrl}/privacy.html`);
    check(await page.title() === text.privacy, `${label}: untranslated privacy title`);
    check(await page.locator('.privacy-content h2').first().textContent() === text.how, `${label}: privacy body not translated`);
    check(await page.locator('html').getAttribute('lang') === lang, `${label}: language lost during navigation`);
    check(await page.locator('.privacy-content [data-i18n]').count() === 20, `${label}: missing privacy translations`);
    check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${label}: localized privacy overflow`);
  }
};

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

      const geminiThreadMetrics = await page.evaluate(() => {
        const thread = document.querySelector('.gemini-thread');
        const composer = document.querySelector('.gemini-composer');
        const actions = document.querySelector('.gemini-response-actions');
        if (!thread || !composer || !actions) return null;
        return {
          overflow: thread.scrollHeight - thread.clientHeight,
          actionsGap: composer.getBoundingClientRect().top - actions.getBoundingClientRect().bottom
        };
      });
      if (geminiThreadMetrics) {
        check(geminiThreadMetrics.overflow <= 2, `${viewport.name}/${theme}: Gemini text clipped (overflow ${geminiThreadMetrics.overflow}px)`);
        check(geminiThreadMetrics.actionsGap >= 0, `${viewport.name}/${theme}: Gemini actions hidden behind composer`);
      }

      await hero.screenshot({ path: `${outputDir}/${viewport.name}-${theme}-watch.png` });

      await hero.evaluate((el) => {
        el.dataset.flowMode = 'feed';
        el.dataset.flowPhase = 'select';
      });

      const feedMetrics = await page.evaluate(() => {
        const feed = document.querySelector('.youtube-feed-mock');
        const cards = Array.from(document.querySelectorAll('.yt-card'));
        if (!feed || !cards.length) return null;
        const visible = cards.filter(c => c.getBoundingClientRect().bottom <= feed.getBoundingClientRect().bottom);
        return { visibleCount: visible.length };
      });
      if (feedMetrics) {
        check(feedMetrics.visibleCount >= 4, `${viewport.name}/${theme}: Feed cards cut off (only ${feedMetrics.visibleCount} visible)`);
      }

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

    if ([1440, 390].includes(viewport.width)) {
      await checkLanguages(page, viewport, theme);
    }

    await context.close();
  }
}

await browser.close();

if (failures.length) {
  console.error('\nVisual checks failed:\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Visual checks passed for ${viewports.length} viewports × ${themes.length} themes, plus FR/EN/ES/ZH navigation and controls.`);
