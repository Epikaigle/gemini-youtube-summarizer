import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const keys = (dictionary) => Object.keys(dictionary).sort();
const uiSource = read('options.js');
const ui = new Function(uiSource.slice(uiSource.indexOf('const UI_TRANSLATIONS'), uiSource.indexOf('const form =')) + '; return UI_TRANSLATIONS;')();
const catalogs = Object.fromEntries(['fr', 'en', 'es'].map(lang => [lang, JSON.parse(read(`_locales/${lang}/messages.json`))]));
for (const [lang, dictionary] of Object.entries(ui)) {
  assert.deepEqual(keys(dictionary), keys(ui.en), `${lang}: missing UI key`);
  assert.deepEqual(keys(catalogs[lang]), keys(catalogs.en), `${lang}: missing catalog key`);
  for (const [key, message] of Object.entries(dictionary)) {
    assert.equal(catalogs[lang][key]?.message, message, `${lang}/${key}: catalog differs from UI`);
  }
  for (const file of ['options.html', 'popup.html']) {
    for (const [, key] of read(file).matchAll(/data-i18n(?:-title)?="([^"]+)"/g)) {
      assert.ok(dictionary[key], `${file}/${lang}/${key}: no translation`);
    }
  }
  for (const key of ['extensionName', 'extensionDescription', 'buttonSummarize']) {
    assert.ok(catalogs[lang][key]?.message, `${lang}/${key}: empty manifest/content translation`);
  }
}

const siteSource = read('docs/script.js');
const site = new Function(siteSource.slice(siteSource.indexOf('const translations ='), siteSource.indexOf('const siteMessage =')) + '; return translations;')();
const nestedKeys = (value, prefix = '') => Object.entries(value).flatMap(([key, item]) => {
  const name = prefix + key;
  return typeof item === 'object' ? nestedKeys(item, name + '.') : [name];
}).sort();
for (const [lang, dictionary] of Object.entries(site)) {
  assert.deepEqual(nestedKeys(dictionary), nestedKeys(site.fr), `${lang}: missing site key`);
  for (const file of ['docs/index.html', 'docs/privacy.html']) {
    for (const [, key] of read(file).matchAll(/data-i18n(?:-aria|-title)?="([^"]+)"/g)) {
      assert.ok(dictionary[key], `${file}/${lang}/${key}: no translation`);
    }
  }
}
for (const file of ['README.md', 'README.en.md', 'README.es.md', 'PRIVACY_POLICY.md', 'PRIVACY_POLICY.en.md', 'PRIVACY_POLICY.es.md']) {
  for (const [, target] of read(file).matchAll(/\]\(([^)]+)\)/g)) {
    if (!target.startsWith('https://')) assert.ok(fs.existsSync(target), `${file}: missing linked file ${target}`);
  }
}
console.log('Translation checks passed: extension FR/EN/ES, site FR/EN/ES/ZH, localized documentation links.');
