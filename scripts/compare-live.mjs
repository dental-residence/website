// Content-fidelity check: fetch each LIVE page, slice its content region with
// the same markers as extract.mjs, strip the same platform-element boilerplate,
// and diff word-by-word against the locally built _site page's content region.
// Expected differences are ONLY the deliberate edits (form rebuild, cfemail,
// link fixes). Anything else is a fidelity regression.
//
// Usage: node scripts/compare-live.mjs [page.html ...]   (default: all built pages)
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = fileURLToPath(new URL('../_site', import.meta.url));
const LIVE = 'https://www.dentalresidence.com.au';
const NAV_END = 'CONTACT\n\t\t\t</a>\n\t\t\t\n\t\t</li>\n</ul>\n</div>';

const args = process.argv.slice(2);
const pages = args.length ? args
  : readdirSync(SITE).filter(f => f.endsWith('.html') && f !== '404.html');

// normalize a content region to comparable text: strip platform-element noise,
// scripts/styles, tags, collapse whitespace
function normalize(html) {
  return html
    .replace(/<style type="text\/css">[\s\S]*?<\/style>/g, '')
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<link[^>]*>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function contentRegion(html) {
  const navEnd = html.indexOf(NAV_END);
  const footer = html.indexOf('<div id="footer"');
  if (navEnd < 0 || footer < 0) return null;
  return html.slice(navEnd + NAV_END.length, footer);
}

let failures = 0;
for (const page of pages) {
  const local = readFileSync(join(SITE, page), 'utf8');
  const res = await fetch(`${LIVE}/${page}`);
  if (!res.ok) { console.log(`SKIP ${page}: live HTTP ${res.status}`); continue; }
  const live = await res.text();

  const lc = contentRegion(local), vc = contentRegion(live);
  if (lc === null || vc === null) { console.log(`FAIL ${page}: markers missing`); failures++; continue; }

  const lw = normalize(lc).split(' ');
  const vw = normalize(vc).split(' ');
  // simple word-level diff summary: longest common prefix/suffix
  let i = 0; while (i < lw.length && i < vw.length && lw[i] === vw[i]) i++;
  let j = 0; while (j < lw.length - i && j < vw.length - i && lw[lw.length - 1 - j] === vw[vw.length - 1 - j]) j++;
  const localMid = lw.slice(i, lw.length - j).join(' ');
  const liveMid = vw.slice(i, vw.length - j).join(' ');
  if (!localMid && !liveMid) {
    console.log(`OK   ${page} (${vw.length} words identical)`);
  } else {
    console.log(`DIFF ${page}:`);
    console.log(`  live : ...${liveMid.slice(0, 220)}...`);
    console.log(`  local: ...${localMid.slice(0, 220)}...`);
    failures++;
  }
}
console.log(`\n${pages.length} pages checked, ${failures} with content differences`);
