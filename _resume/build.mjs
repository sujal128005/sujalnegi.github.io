// Builds Sujal_Negi_Resume.pdf from _resume/resume.html.
// Run from the repository root:  node _resume/build.mjs
// GitHub Pages (Jekyll) does not publish folders that start with "_", so this source stays private to the repo.
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

// Playwright may be installed globally; createRequire honours NODE_PATH, ESM imports do not.
const { chromium } = createRequire(import.meta.url)('playwright');

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(here, 'resume.html');
const out = path.join(here, '..', 'Sujal_Negi_Resume.pdf');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(src).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const overflow = await page.evaluate(() => document.body.scrollHeight - document.body.clientHeight);
if (overflow > 0) console.warn(`Warning: content overflows one page by ${overflow}px`);
await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log('Wrote', out);
