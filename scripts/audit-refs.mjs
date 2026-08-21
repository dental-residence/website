// Audit local asset references in the Weebly scrape against files on disk.
// Any reference missing on disk is fetched from the live site into rescue/fetched/
// (preserving its path) while the site is still up. Run until "missing but live: 0".
//
// Usage: node scripts/audit-refs.mjs [--fetch]
import { readdirSync, readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRAPE = fileURLToPath(new URL('../../DR Website', import.meta.url));
const RESCUE = fileURLToPath(new URL('../rescue/fetched', import.meta.url));
const LIVE = 'https://www.dentalresidence.com.au';
const doFetch = process.argv.includes('--fetch');

const pages = readdirSync(SCRAPE).filter(f => f.endsWith('.html'));
const refs = new Map(); // path -> Set of pages

const unescape = s => s
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&amp;/g, '&');

for (const page of pages) {
  const html = unescape(readFileSync(join(SCRAPE, page), 'utf8'));
  const found = new Set();
  // src/href/poster/srcset/content attributes
  for (const m of html.matchAll(/(?:src|href|poster|content)=["']([^"']+)["']/g)) found.add(m[1]);
  for (const m of html.matchAll(/srcset=["']([^"']+)["']/g))
    m[1].split(',').forEach(part => found.add(part.trim().split(/\s+/)[0]));
  // css url(...) in inline styles/style blocks
  for (const m of html.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) found.add(m[1]);

  for (let ref of found) {
    // normalize to local root-relative paths only
    ref = ref.replace(/^https?:\/\/(www\.)?dentalresidence\.com\.au/, '');
    if (!ref.startsWith('/')) {
      if (/^(files|uploads)\//.test(ref)) ref = '/' + ref;
      else continue;
    }
    if (!/^\/(files|uploads)\//.test(ref)) continue;
    ref = ref.split('?')[0].split('#')[0];
    if (!refs.has(ref)) refs.set(ref, new Set());
    refs.get(ref).add(page);
  }
}

const missing = [];
for (const [ref, usedBy] of [...refs.entries()].sort()) {
  const onDisk = existsSync(join(SCRAPE, ref)) || existsSync(join(RESCUE, ref));
  if (!onDisk) missing.push({ ref, pages: usedBy.size });
}

console.log(`pages scanned: ${pages.length}, distinct local refs: ${refs.size}, missing on disk: ${missing.length}`);
let stillLive = 0, dead = 0;
for (const { ref, pages: n } of missing) {
  if (!doFetch) { console.log(`MISSING ${ref} (used by ${n} pages)`); continue; }
  const res = await fetch(LIVE + encodeURI(ref)).catch(() => null);
  if (res && res.ok) {
    const buf = Buffer.from(await res.arrayBuffer());
    const out = join(RESCUE, ref);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, buf);
    console.log(`FETCHED ${ref} (${buf.length} bytes, used by ${n} pages)`);
    stillLive++;
  } else {
    console.log(`DEAD    ${ref} (HTTP ${res ? res.status : 'ERR'}, used by ${n} pages)`);
    dead++;
  }
}
if (doFetch) console.log(`\nmissing but live (now fetched): ${stillLive}, dead on live site: ${dead}`);
