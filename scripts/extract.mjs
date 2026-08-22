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

// Enquiry form: Weebly formSubmit.php -> Netlify Form (same wsite-form markup/styling)
FIXES['enquiry.html'] = [
  [/<form enctype="multipart\/form-data" action="\/\/www\.weebly\.com\/weebly\/apps\/formSubmit\.php" method="POST" id="form-644554648387987849">/g,
    '<form name="enquiry" action="/thank-you-enquiry.html" method="POST" id="form-644554648387987849" data-netlify="true" netlify-honeypot="bot-field">', 1],
  [/<input aria-required="true" (id="input-722105135656311657"[^>]*type="text") name="_u722105135656311657" \/>/g, '<input aria-required="true" required $1 name="name" />', 1],
  [/<input aria-required="true" (id="input-817843584583315216"[^>]*)type="text" name="_u817843584583315216" \/>/g, '<input aria-required="true" required $1type="email" name="email" />', 1],
  [/<input aria-required="true" (id="input-613116001876635998"[^>]*)type="text" name="_u613116001876635998\[number\]" \/>/g, '<input aria-required="true" required $1type="tel" name="phone" />', 1],
  [/<input aria-required="true" (id="input-347807437256743252"[^>]*type="text") name="_u347807437256743252" \/>/g, '<input aria-required="true" required $1 name="postcode" />', 1],
  [/name="_u286691674224923099"/g, 'name="health_fund"', 1],
  [/name='_u155957773449481547' (class='form-select' aria-required="true")/g, "name='contact_method' $1 required", 1],
  [/<input aria-required="true" (id="input-795870890238306914"[^>]*type="text") name="_u795870890238306914" \/>/g, '<input aria-required="true" required $1 name="subject" />', 1],
  [/<textarea aria-required="true" (id="input-823038380465961307"[^>]*)name="_u823038380465961307"/g, '<textarea aria-required="true" required $1name="comment"', 1],
  [/<div style="display:none; visibility:hidden;">\s*<input type="hidden" name="wsite_subject" \/>\s*<\/div>/g,
    '<div style="display:none; visibility:hidden;">\n\t\t\t<label>Don\'t fill this out if you\'re human: <input name="bot-field" /></label>\n\t\t</div>', 1],
  [/<input type="hidden" name="form_version" value="2" \/>\s*<input type="hidden" name="wsite_approved" id="wsite-approved" value="approved" \/>\s*<input type="hidden" name="ucfid" value="644554648387987849" \/>\s*<input type="hidden" name="recaptcha_token"\/>/g,
    '<input type="hidden" name="form-name" value="enquiry" />', 1],
  [/<a class="wsite-button">/g, '<a class="wsite-button" id="enquiry-submit-button">', 1],
  [/<\/form>\s*<div id="g-recaptcha-644554648387987849"[^>]*><\/div>/g,
    '</form>\n\t<script>\n\tdocument.getElementById(\'enquiry-submit-button\').addEventListener(\'click\', function (e) {\n\t\te.preventDefault();\n\t\tvar form = document.getElementById(\'form-644554648387987849\');\n\t\tif (form.requestSubmit) form.requestSubmit(); else form.submit();\n\t});\n\t</script>', 1],
];

// Draft meta descriptions for pages that never had one on the Weebly site.
// PENDING USER REVIEW before launch — see DESCRIPTIONS-REVIEW.md at repo root.
// Applied only when the scraped head has no <meta name="description">.
const DRAFT_DESCRIPTIONS = {
  'checkup.html': 'Comprehensive dental checkup and clean in Marrickville. Gentle, thorough examinations with scale and polish at Dental Residence. Call (02) 8384 6667.',
  'childrens-dentist.html': "Children's dentist in Marrickville providing gentle, friendly dental care for kids, including the Child Dental Benefits Schedule. Book online today.",
  'contact.html': 'Contact Dental Residence, your Marrickville dentist at 4/2 Albert St. Call (02) 8384 6667 or book online for general, cosmetic and emergency dentistry.',
  'cosmetic-dentistry.html': 'Cosmetic dentistry in Marrickville: porcelain veneers, teeth whitening, crowns and Invisalign to transform your smile. Book at Dental Residence.',
  'covid-safety.html': 'COVID safety at Dental Residence Marrickville: enhanced infection control, screening and hygiene protocols keeping our patients and team safe.',
  'crowns.html': 'Same-day 1-hour porcelain crowns in Marrickville using CAD/CAM technology. Strong, natural-looking crowns in a single visit at Dental Residence.',
  'dental-fillings.html': 'Tooth-coloured dental fillings in Marrickville. Repair decay and restore your smile with natural-looking composite fillings at Dental Residence.',
  'enquiry.html': 'Send an enquiry to Dental Residence, Marrickville. Ask about treatments, health funds or appointments and our friendly team will get back to you.',
  'general-dental.html': 'Complete general and complex dental services in Marrickville, from checkups, cleans and fillings to root canal therapy and wisdom tooth removal.',
  'general.html': 'General dental care in Marrickville including checkups, cleans, fillings, toothache and gum disease treatment at Dental Residence. Book online today.',
  'gum-disease.html': 'Gum disease diagnosis and treatment in Marrickville. Protect your teeth and gums from gingivitis and periodontitis at Dental Residence.',
  'invisalign.html': 'Invisalign® clear aligners in Marrickville. Straighten your teeth discreetly without traditional braces at Dental Residence. Book a consultation.',
  'privacy.html': 'Read the Dental Residence privacy policy explaining how we collect, use and protect your personal and health information.',
  'root-canal.html': 'Gentle root canal therapy in Marrickville to save infected teeth and relieve pain. Modern, comfortable endodontic treatment at Dental Residence.',
  'thank-you.html': 'Thank you for your booking with Dental Residence, Marrickville. We look forward to seeing you soon.',
  'thank-you-enquiry.html': 'Thank you for your enquiry with Dental Residence, Marrickville. Our friendly team will be in touch shortly.',
  'toothache.html': 'Toothache relief in Marrickville. Fast diagnosis and gentle treatment of dental pain, including emergency appointments at Dental Residence.',
  'tutorial.html': 'Dental care tutorials from Dental Residence Marrickville: how to floss correctly and use floss picks and interdental brushes for healthy gums.',
  'veneers.html': 'Porcelain veneers in Marrickville to instantly improve your smile. Natural-looking, custom-made veneers at Dental Residence. Book a consultation.',
  'why-choose-us.html': 'Why choose Dental Residence? Award-winning Marrickville dentist with modern technology, gentle care and all major health funds accepted.',
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
  // per-page head extras: hero pages carry Google css2 font links + Typekit
  const headLinks = [
    ...head.matchAll(/<link href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]*"[^>]*>/g),
    ...head.matchAll(/<link rel="stylesheet" href="https:\/\/use\.typekit\.net\/[^"]*">/g),
  ].map(m => m[0]);
  if (headLinks.length) fm.headLinks = headLinks;

  const desc = grab(/<meta name="description" content="([^"]*)"/);
  const keywords = grab(/<meta name="keywords" content="([^"]*)"/);
  if (desc) fm.description = desc;
  else if (DRAFT_DESCRIPTIONS[page]) {
    fm.description = DRAFT_DESCRIPTIONS[page];
    log.push(`${page}: DRAFT meta description added (review before launch)`);
  }
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

// ---- footer partial (identical on all pages bar incidental drift; veneers is the reference)
{
  const html = readFileSync(join(SCRAPE, 'veneers.html'), 'utf8');
  const fc = html.indexOf('<div id="footer-content">');
  const nm = html.indexOf('<div class="navmobile-wrapper">');
  if (fc < 0 || nm < fc) throw new Error('footer markers not found in veneers.html');
  let footer = html.slice(fc, nm).replace(/\s+$/, '\n');
  const footerStamps = new Map();
  footer = footer.replace(/<style type="text\/css">([\s\S]*?)<\/style>/g, (full, css) => {
    const uuids = [...new Set([...css.matchAll(/#element-([0-9a-f-]+)/g)].map(m => m[1]))];
    if (!uuids.length) return full;
    const norm = css.replace(/#element-[0-9a-f-]+/g, '@EL@');
    const hash = createHash('md5').update(norm).digest('hex');
    if (!styleBlocks.has(hash)) styleBlocks.set(hash, { norm, count: 0, sample: 'footer', cls: `pe-v${styleBlocks.size + 1}` });
    const b = styleBlocks.get(hash);
    b.count++;
    for (const u of uuids) footerStamps.set(u, b.cls);
    return '';
  });
  for (const [uuid, cls] of footerStamps) {
    const tag = new RegExp(`(<div id="element-${uuid}"[^>]*class=")`);
    if (!tag.test(footer)) throw new Error(`footer: no content div for element-${uuid}`);
    footer = footer.replace(tag, `$1${cls} `);
  }
  footer = footer.replace(/<script type="text\/javascript" class="element-script">[\s\S]*?<\/script>/g, '');
  footer = footer.replace(/<link href="https:\/\/fonts\.googleapis\.com\/css\?family=[^"]*"[^>]*>\n?/g, '');
  if (/\{\{|\{%/.test(footer)) throw new Error('footer contains template braces');
  writeFileSync(fileURLToPath(new URL('../src/_includes/partials/footer-content.njk', import.meta.url)), footer);
  console.log('wrote partials/footer-content.njk');
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
