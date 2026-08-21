// One-time extractor: Weebly scrape -> src/pages/*.html with JSON front matter.
//
// Byte-fidelity strategy: raw string slicing on verified-stable markers, never
// DOM re-serialization. Hard-fails on any marker anomaly instead of guessing.
//
// Per page:
//   - head metadata (title, og:*, description/keywords, JSON-LD) -> front matter
//   - body slice: end of desktop nav -> <div id="footer"  (includes the
//     per-page header slot: video hero / banner / nothing)
//   - platform-element <style>/<script> boilerplate stripped; CSS uniformity
//     verified and written once to src/assets/css/platform-elements.css
//   - targeted content fixes (logged): cfemail decode, broken internal links,
//     dead lightbox onclick
//
// Usage: node scripts/extract.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const SCRAPE = fileURLToPath(new URL('../../DR Website', import.meta.url));
const OUT = fileURLToPath(new URL('../src/pages', import.meta.url));
const CSSOUT = fileURLToPath(new URL('../src/assets/css/platform-elements.css', import.meta.url));
mkdirSync(OUT, { recursive: true });

const SKIP = new Set(['home-new-817931.html', 'home-test-963199.html']); // drafts, 301 -> /
const NO_SITEMAP = new Set(['tutorial.html', 'enquiry.html', 'thank-you.html', 'thank-you-enquiry.html']);
const ADS_CONVERSION = new Set(['thank-you.html', 'thank-you-enquiry.html']);
const NAV_END = 'CONTACT\n\t\t\t</a>\n\t\t\t\n\t\t</li>\n</ul>\n</div>';

const PAGES = [
  'index.html', 'about.html', 'bridges.html', 'checkup.html', 'childrens-dentist.html',
  'contact.html', 'cosmetic-dentistry.html', 'covid-safety.html', 'crowns.html',
  'dental-fillings.html', 'dental-implants.html', 'dentures.html', 'emergency-dentist.html',
  'enquiry.html', 'general-328943-760397-270070-247430-929603-785701.html',
  'general-dental.html', 'general.html', 'gum-disease.html', 'invisalign.html',
  'marrickville-dentist.html', 'meet-our-dentists.html', 'petersham-dentist.html',
  'privacy.html', 'root-canal.html', 'teeth-whitening-trays.html', 'thank-you-enquiry.html',
  'thank-you.html', 'tooth-extraction.html', 'toothache.html', 'tutorial.html',
  'veneers.html', 'why-choose-us.html', 'wisdom-tooth-removal.html',
];

const fail = (page, msg) => { throw new Error(`${page}: ${msg}`); };

const decodeCfemail = hex => {
  const key = parseInt(hex.slice(0, 2), 16);
  let out = '';
  for (let i = 2; i < hex.length; i += 2) out += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ key);
  return out;
};

// ---- per-page targeted fixes (content slice only), each must apply or we fail
const FIXES = {
  'general-dental.html': [[/\/childrens-dental\.html/g, '/childrens-dentist.html', 1]],
  'general.html': [[/\/childrens-dental\.html/g, '/childrens-dentist.html', 1]],
  'about.html': [
    [/\/cosmetic\.html/g, '/cosmetic-dentistry.html', 1],
    [/ onclick='if \(!lightboxLoaded\)[^']*'/g, '', 1],
  ],
  'petersham-dentist.html': [
    [/href="\/general-dental"/g, 'href="/general-dental.html"', 1],
    [/href="\/emergency-dentist"/g, 'href="/emergency-dentist.html"', 1],
  ],
};

const styleBlocks = new Map(); // normalizedHash -> { css, count, sample }
const log = [];

for (const page of PAGES) {
  if (SKIP.has(page)) continue;
  let html = readFileSync(join(SCRAPE, page), 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));

  // ---- metadata
  const grab = (re, required) => {
    const m = head.match(re);
    if (!m && required) fail(page, `head field missing: ${re}`);
    return m ? m[1] : undefined;
  };
  const fm = {
    layout: 'layouts/base.njk',
    title: grab(/<title>([\s\S]*?)<\/title>/, true),
    ogTitle: grab(/property="og:title" content="([^"]*)"/, true),
    ogDescription: grab(/property="og:description" content="([^"]*)"/, true),
    ogUrl: grab(/property="og:url" content="([^"]*)"/, true),
    bodyClass: (html.match(/<body class="([^"]*)"/) || fail(page, 'no body class'))[1],
  };
  const desc = grab(/<meta name="description" content="([^"]*)"/);
  const keywords = grab(/<meta name="keywords" content="([^"]*)"/);
  if (desc) fm.description = desc;
  if (keywords) fm.keywords = keywords;

  const jsonld = [...head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => m[1]);
  if (jsonld.length) fm.jsonld = jsonld;
  if (ADS_CONVERSION.has(page)) fm.adsConversion = true;
  if (NO_SITEMAP.has(page)) fm.sitemap = false;

  // ---- active-nav markers (desktop nav only; nav.njk re-derives them)
  const navStart = html.indexOf('<div id="navigation"');
  const navEndIdx = html.indexOf(NAV_END, navStart);
  if (navStart < 0 || navEndIdx < 0) fail(page, 'nav markers not found');
  const navHtml = html.slice(navStart, navEndIdx + NAV_END.length);
  const active = navHtml.match(/<li id="active"[^>]*>[\s\S]{0,400}?href="([^"]+)"/);
  if (active) fm.navActive = active[1];
  const sub = navHtml.match(/<li[^>]*class="[^"]*wsite-nav-current[^"]*"[\s\S]{0,400}?href="([^"]+)"/)
    || navHtml.match(/class="wsite-menu-subitem-wrap wsite-nav-current"[\s\S]{0,400}?href="([^"]+)"/);
  if (sub) fm.navActiveSub = sub[1];

  // ---- body slice: after desktop nav -> before footer
  const contentStart = navEndIdx + NAV_END.length;
  const footerIdx = html.indexOf('<div id="footer"');
  if (footerIdx < 0 || footerIdx < contentStart) fail(page, 'footer marker anomaly');
  const mobileNavIdx = html.indexOf(NAV_END, contentStart);
  if (mobileNavIdx < footerIdx) fail(page, 'expected mobile nav after footer');
  let content = html.slice(contentStart, footerIdx).replace(/\s+$/, '\n');
  if ((content.match(/<div id="content-wrapper">/g) || []).length !== 1) fail(page, 'content-wrapper anomaly');

  // ---- strip platform-element boilerplate
  // Each element's <style> is deduplicated into a shared variant (.pe-vN) and
  // that class is stamped onto the element's content div, preserving per-element
  // styling exactly even though variants differ across widget types.
  let styleCount = 0;
  const uuidVariant = new Map(); // element uuid -> variant class
  content = content.replace(/<style type="text\/css">([\s\S]*?)<\/style>/g, (full, css) => {
    const uuids = [...new Set([...css.matchAll(/#element-([0-9a-f-]+)/g)].map(m => m[1]))];
    if (!uuids.length) return full; // not a platform-element block: keep
    styleCount++;
    const norm = css.replace(/#element-[0-9a-f-]+/g, '@EL@');
    const hash = createHash('md5').update(norm).digest('hex');
    if (!styleBlocks.has(hash)) styleBlocks.set(hash, { norm, count: 0, sample: `${page}`, cls: `pe-v${styleBlocks.size + 1}` });
    const b = styleBlocks.get(hash);
    b.count++;
    for (const u of uuids) uuidVariant.set(u, b.cls);
    return '';
  });
  for (const [uuid, cls] of uuidVariant) {
    const tag = new RegExp(`(<div id="element-${uuid}"[^>]*class=")`);
    if (!tag.test(content)) fail(page, `no content div for element-${uuid}`);
    content = content.replace(tag, `$1${cls} `);
  }
  let scriptCount = 0;
  content = content.replace(/<script type="text\/javascript" class="element-script">[\s\S]*?<\/script>/g, () => {
    scriptCount++; return '';
  });
  // platform-element internal 39-family Google Fonts links
  let fontLinks = 0;
  content = content.replace(/<link href="https:\/\/fonts\.googleapis\.com\/css\?family=[^"]*"[^>]*>\n?/g, () => {
    fontLinks++; return '';
  });
  log.push(`${page}: stripped ${styleCount} element styles, ${scriptCount} element scripts, ${fontLinks} font links`);

  // ---- targeted fixes
  for (const [re, replacement, expected] of FIXES[page] || []) {
    const n = (content.match(re) || []).length;
    if (n !== expected) fail(page, `fix ${re} matched ${n}, expected ${expected}`);
    content = content.replace(re, replacement);
    log.push(`${page}: FIX ${re} -> ${JSON.stringify(replacement)} (${n}x)`);
  }
  // cfemail decode (privacy.html)
  content = content.replace(
    /<a href="\/cdn-cgi\/l\/email-protection" class="__cf_email__" data-cfemail="([0-9a-f]+)">\[email&#160;protected\]<\/a>/g,
    (_, hex) => {
      const email = decodeCfemail(hex);
      log.push(`${page}: FIX cfemail -> ${email}`);
      return `<a href="mailto:${email}">${email}</a>`;
    });
  if (content.includes('cdn-cgi')) fail(page, 'unhandled cdn-cgi reference remains');

  writeFileSync(join(OUT, page), `---json\n${JSON.stringify(fm, null, 2)}\n---\n${content}`);
}

// ---- platform-element CSS uniformity
console.log(log.join('\n'));
console.log(`\nplatform-element CSS variants: ${styleBlocks.size}`);
for (const [hash, b] of styleBlocks) console.log(`  ${b.cls} ${hash.slice(0, 8)} x${b.count} (first seen: ${b.sample})`);
if (styleBlocks.size >= 1) {
  const css = [...styleBlocks.values()]
    .map(b => `/* ${b.cls} (x${b.count}, e.g. ${b.sample}) */\n` + b.norm.replaceAll('@EL@', `.${b.cls}`))
    .join('\n\n');
  writeFileSync(CSSOUT, css);
  console.log(`wrote ${CSSOUT}`);
}
console.log(`\nextracted ${PAGES.filter(p => !SKIP.has(p)).length} pages -> src/pages/`);
