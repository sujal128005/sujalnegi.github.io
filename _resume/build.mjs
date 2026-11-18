// Builds both résumés: Sujal_Negi_Resume.pdf from _resume/resume.html and Sujal_Resume_M.pdf from _resume/resume_M.html.
// Run from the repository root:  node _resume/build.mjs
// GitHub Pages (Jekyll) does not publish folders that start with "_", so this source stays private to the repo.
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

// Playwright may be installed globally; createRequire honours NODE_PATH, ESM imports do not.
const { chromium } = createRequire(import.meta.url)('playwright');

const here = path.dirname(fileURLToPath(import.meta.url));
const builds = [
  ['resume.html', 'Sujal_Negi_Resume.pdf'],    // sujalnegi.tech/resume   (founder / product / backend)
  ['resume_M.html', 'Sujal_Resume_M.pdf'],     // sujalnegi.tech/resume-m (mechanical / core)
];

const browser = await chromium.launch();
for (const [srcName, outName] of builds) {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(path.join(here, srcName)).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const overflow = await page.evaluate(() => document.body.scrollHeight - document.body.clientHeight);
  if (overflow > 0) console.warn(`Warning: ${srcName} overflows one page by ${overflow}px`);
  const out = path.join(here, '..', outName);
  await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
  await page.close();
  console.log('Wrote', out);
}
await browser.close();
