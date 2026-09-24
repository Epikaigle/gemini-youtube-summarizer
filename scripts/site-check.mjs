import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const docs = path.join(root, 'docs');
const files = {
  index: fs.readFileSync(path.join(docs, 'index.html'), 'utf8'),
  privacy: fs.readFileSync(path.join(docs, 'privacy.html'), 'utf8'),
  css: fs.readFileSync(path.join(docs, 'styles.css'), 'utf8'),
  js: fs.readFileSync(path.join(docs, 'script.js'), 'utf8')
};

const errors = [];
const check = (condition, message) => {
  if (!condition) errors.push(message);
};

for (const [name, html] of Object.entries({ index: files.index, privacy: files.privacy })) {
  check(!html.includes('\\n'), `${name}.html contains a literal \\n sequence`);

  const ids = [...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  check(duplicates.length === 0, `${name}.html has duplicate IDs: ${[...new Set(duplicates)].join(', ')}`);

  const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
  const broken = anchors.filter((id) => !ids.includes(id));
  check(broken.length === 0, `${name}.html has broken hash links: ${broken.join(', ')}`);

  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
    .map((match) => match[1].split('?')[0])
    .filter((ref) => !/^(?:https?:|#|mailto:|tel:)/.test(ref))
    .filter((ref) => ref && ref !== './' && !ref.endsWith('.html'));

  for (const ref of refs) {
    const target = path.resolve(docs, ref);
    check(target.startsWith(docs) && fs.existsSync(target), `${name}.html references missing local asset: ${ref}`);
  }
}

const braceBalance = (source) => {
  let depth = 0;
  for (const char of source) {
    if (char === '{') depth += 1;
    if (char === '}') depth -= 1;
    if (depth < 0) return false;
  }
  return depth === 0;
};

check(braceBalance(files.css), 'styles.css has unbalanced braces');
check(files.css.includes('@media (max-width:920px)'), 'CSS compact navigation breakpoint must remain 920px');
check(files.js.includes("(max-width: 920px)"), 'JS compact navigation breakpoint must remain 920px');
check(files.index.includes('id="demo"'), 'Demo stage must have id="demo"');
check(files.index.includes('href="#avantages"'), 'Custom prompt CTA must target #avantages');
check(files.css.includes('.reveal{opacity:1;transform:none}'), 'Reveal content must remain visible without JavaScript');
check(!files.index.includes('site.webmanifest'), 'Do not re-add the incomplete PWA manifest without full icon support');
check(!files.index.includes('favicon.svg') && !files.privacy.includes('favicon.svg'), 'Obsolete favicon.svg reference detected');
check(files.index.includes('assets/social-preview.png'), 'Social metadata must use social-preview.png');
check(!files.index.includes('og:image" content="https://epikaigle.github.io/gemini-youtube-summarizer/assets/social-preview.svg'), 'Open Graph must not use the SVG preview');
check(!files.index.includes('twitter:image" content="https://epikaigle.github.io/gemini-youtube-summarizer/assets/social-preview.svg'), 'Twitter card must not use the SVG preview');
check(!files.index.includes('resume-youtube-gemini') && !files.privacy.includes('resume-youtube-gemini'), 'Old repo name resume-youtube-gemini must not remain in HTML');

try {
  new Function(files.js);
} catch (error) {
  errors.push(`script.js does not parse: ${error.message}`);
}

if (errors.length) {
  console.error('\nSite checks failed:\n');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Site checks passed.');
