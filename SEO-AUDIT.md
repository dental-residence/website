# SEO Audit — Dental Residence (dentalresidence.com.au)

**Date:** 22 August 2026
**Audited:** Netlify deploy (dentalresidenceproject.netlify.app), 33 pages, pre-DNS-cutover
**Target keywords:** Marrickville Dentist · Petersham Dentist · Emergency Dentist
**Current position:** ~#4 for target keywords (per owner)

**Method:** full crawl of all pages (titles, headings, word counts, internal-link graph,
image alts, structured data), Lighthouse mobile audits, live checks of external links,
and keyword-targeting analysis of the four landing pages.

---

## Executive summary

The site's technical foundation is now strong after the Weebly migration (pages are ~85%
smaller, canonicals fixed, sitemap cleaned, dead scripts gone). The audit found that the
biggest remaining problems are **not technical — they are targeting problems**, and two of
them directly explain why the three target keywords underperform:

1. **The two pages built to rank for "Petersham Dentist" and "Marrickville Dentist" have
   zero internal links.** Nothing on the site links to them — the footer links labelled
   "Petersham" and "Marrickville" point to the homepage instead. To Google, an orphaned
   page is a page the site itself doesn't consider important.
2. **The Emergency Dentist page doesn't target "emergency dentist."** Its title tag and H1
   are copies of the homepage's ("Top Marrickville Dentist…"), and the word "emergency"
   appears just 4 times in its copy. As written, this page cannot rank for emergency terms.

These are cheap fixes with outsized impact. Below: all findings by priority, then an
uplift estimate.

---

## Scorecard (Lighthouse, mobile, throttled)

| Page | Performance | SEO | Accessibility | Notes |
|---|---|---|---|---|
| Homepage | 58 | 85 | 70 | LCP 17.5s — hero `<video>` with no poster image |
| Veneers (typical service page) | 59 | 85 | — | LCP 14.4s — 1.2MB PNG banner background |

CLS is essentially perfect (0.002) and total blocking time is low — the slow LCP is
entirely a **media weight** problem, which is very fixable.

---

## Findings

### 🔴 Critical (directly blocks the target keywords)

**C1. `petersham-dentist.html` and `marrickville-dentist.html` are orphaned (0 internal links).**
The footer's "Other Links" column has anchors labelled *Petersham* and *Marrickville* that
`href` to `/` instead of the location pages. No other page links to them either.
*Fix:* point those two footer links at the correct pages (site-wide = 33 links each,
instantly), and add contextual links from the homepage, About ("servicing Petersham and
Marrickville"), and relevant service pages. Consider adding both to the nav under About
or a "Locations" item.

**C2. Emergency Dentist page doesn't target its keyword.**
- Title: `Top Marrickville Dentist | Dental Residence Marrickville` (homepage's title)
- H1: `Award-Winning Marrickville Dentist` (homepage's H1)
- "emergency dentist" appears 2× in body; "emergency" 4× total; content is ~an 80% clone
  of the homepage.
*Fix:* retitle (e.g. `Emergency Dentist Marrickville & Petersham | Same-Day Appointments —
Dental Residence`), new H1 ("Emergency Dentist in Marrickville"), and rewrite/extend the
copy around urgent scenarios: toothache, knocked-out tooth, broken crown, after-hours
guidance, "same-day appointments", suburbs served. Link to it from toothache.html and
tooth-extraction.html (and vice versa). Note the page already has its own Google Maps
embed pin named "Emergency Dentist - Marrickville/Petersham" — good, keep it.

**C3. Keyword cannibalization: homepage vs marrickville-dentist.html.**
Both carry the identical title *and* H1 ("Top Marrickville Dentist…" / "Award-Winning
Marrickville Dentist") and ~74% of the same copy. Google must pick one — and split signals
usually mean neither ranks as well as one strong page would.
*Fix (choose one):*
- **Recommended:** keep the **homepage** as the "Marrickville Dentist" target (it holds the
  domain's link equity), and repurpose marrickville-dentist.html as a genuinely different
  suburb/landing page (unique copy, testimonials, directions, parking, suburb-specific
  FAQs) — or
- 301 marrickville-dentist.html → `/` if it serves no separate purpose (check Google Ads
  first — if it's an Ads landing page, keep it and differentiate instead).

### 🟠 High (site-wide ranking signals)

**H1. Page speed — media weight (biggest Core Web Vitals win).**
- Hero video has no `poster` attribute → mobile LCP 17.5s on the homepage and the three
  hero landing pages. *Fix:* export one frame as an optimized JPEG/WebP poster (~60KB) and
  add `poster="..."` + `preload="metadata"`. LCP becomes the poster; expect LCP to drop
  under ~3s.
- Service-page banner backgrounds are 0.5–1.9MB PNGs (26 images, 16MB total). *Fix:*
  recompress to WebP/quality-80 JPEG at ~1920px (keep the same filenames+paths, as we did
  for video). Est. 80–90% smaller; Lighthouse flags 2.6MB savings from formats alone.
- Tutorial video poster PNGs are 5.6–5.9MB each; CosmeticDentistry1.PNG is 3.9MB;
  several 1–2MB screenshots. Same recompression treatment.
- Add `<link rel="preconnect">` for fonts.googleapis.com / fonts.gstatic.com /
  use.typekit.net (~700ms est.), and consider inlining the small theme CSS or deferring
  non-critical stylesheets (~1.6s est. render-blocking savings).

**H2. Every page has three junk H1s in the footer.**
"Other Links", "Accepting All Major Funds", "Affiliations" are `<h1>` elements on all 33
pages, diluting the topical signal of every page (service pages have up to 7 H1s).
*Fix:* change the three footer headings to `<h2>` (or `<div class="...">` styled
identically) in `partials/footer-content.njk`. One-file fix, site-wide effect.

**H3. Duplicate / weak title tags.**
- `bridges.html`, `dental-implants.html`, `dentures.html` all share the exact title
  *"Dental Implants and Dentures - Dental Residence"* — three pages competing for one
  phrase, none saying "bridges".
- Several titles are ALL-CAPS labels with no locality or intent ("CONTACT", "CHECKUP AND
  CLEAN", "GENERAL DENTAL"). Titles are the single strongest on-page signal — each should
  lead with the service + a locality. Suggested pattern:
  `Porcelain Veneers Marrickville | Dental Residence` /
  `Dental Bridges Marrickville & Petersham | Dental Residence` etc.

**H4. Image alt text missing on ~90 content images** (158 of 226 `<img>` lack alt; ~68 of
those are tracking pixels/logo, the rest are real content images including dentist photos
and service imagery). Alt text is a direct relevance signal and an accessibility
requirement. *Fix:* one pass through `src/pages/*.html` adding descriptive, locality-aware
alts ("Dentist performing a checkup at Dental Residence Marrickville").

**H5. Structured data gaps.**
Current: solid `Dentist` schema on 4 pages (NAP, geo, hours, priceRange) + FAQPage on the
teeth-whitening page. Gaps:
- petersham-dentist.html's schema is thinner (no geo, hours, or priceRange) **and is named
  "Dental Residence - Marrickville Dentist"** — on the Petersham page.
- No `sameAs` links (Facebook, Instagram, LinkedIn profiles exist in the footer).
- No schema at all on the 29 other pages (fine, but service pages could carry a minimal
  `Dentist` reference or `BreadcrumbList`).
*Fix:* bring the Petersham schema to parity (Petersham-appropriate naming/area), add
`sameAs` arrays, and add `areaServed` (Marrickville, Petersham, Stanmore, Newtown).

### 🟡 Medium

**M1. Meta descriptions**: 20 pages now have drafted descriptions (pending your review in
DESCRIPTIONS-REVIEW.md) — approve/adjust before cutover. Descriptions don't affect rank
but materially affect click-through from results.

**M2. Thin/duplicated service content.** `dental-implants.html` and `general.html` vs
`general-dental.html` are near-duplicates of sibling pages; several service pages run
250–350 words. Competitive service terms generally need 600+ words of genuinely useful
content (procedure, pricing guidance, recovery, FAQs). Prioritize: emergency (C2),
dental-implants (high-value keyword, currently duplicated title + thin).

**M3. Add FAQ content + FAQPage schema to key pages.** There's already one working
FAQPage (teeth whitening). Emergency, implants, and the two suburb pages are natural fits
("How fast can I be seen?", "Do you bulk bill…", "Is parking available…").

**M4. Wrong footer link:** the health-funds column's ING link points to
`www.ing.com.tr` (ING **Turkey**'s insurance page). Fix or remove. (All goo.gl maps
short-links were tested and still redirect correctly — no action needed.)

**M5. Contextual internal linking.** Beyond the nav, body copy almost never cross-links
services (e.g. toothache → emergency; checkup → gum disease). 5–10 natural in-copy links
per cluster strengthens topical structure.

### ⚪ Low / housekeeping

- **Staging URL indexing:** until DNS cutover, the netlify.app URL is crawlable. The
  canonicals already point to dentalresidence.com.au (correct), but adding an
  `X-Robots-Tag: noindex` header on the netlify.app host (removed at cutover) is cleaner.
- Accessibility: color-contrast failures (some grey-on-cream text), iframe missing title
  (Google Maps embeds), button-name on carousel arrows. Modest effort; won't move
  rankings directly but improves quality signals and UX.
- Sitemap: consider adding `<lastmod>` once content editing begins.
- The enquiry "Submit" anchor has no `href` (flagged as non-crawlable anchor — harmless,
  but converting it to a real `<button>` also fixes an accessibility flag).

---

## Already banked by the migration (your new baseline)

These were fixed during the Weebly → Netlify migration and are already better than the
site Google has been ranking #4:

- Page weight cut ~85–90% (Weebly runtime, jQuery, 450KB of dead widgets removed)
- Canonical tags fixed (7 pages previously canonicalised themselves *to the homepage* —
  actively telling Google to ignore them; now all self-referencing)
- Draft/test homepages removed from the index (were duplicate-content liabilities in the
  sitemap), 301'd to `/`
- Sitemap and robots.txt cleaned; broken internal links fixed; 100MB of video → 32MB

---

## Expected uplift

Honest framing: nobody can promise positions — competitors, Google Business Profile
strength, and reviews all sit outside the website. But the findings above are unusually
concrete, and two of your three keywords are currently handicapped by *self-inflicted,
fully fixable* problems. Directionally:

**"Marrickville Dentist" (currently ~#4).**
You're ranking #4 *with* cannibalization, junk H1s, and a 17s mobile LCP. Fixing C3 +
H1/H2/H3 consolidates your strongest page and removes drag. Moving #4 → #2–3 is a
realistic 2–4 month outcome; #1 depends more on Google Business Profile + reviews than on
the site. **CTR math:** organic position #4 typically earns ~4–6% of clicks, #3 ~8–11%,
#2 ~12–16%, #1 ~25–30%. Even one position gained roughly **doubles traffic for that
query**; #4 → #2 is typically a **2.5–3× click uplift** on that term.

**"Petersham Dentist."**
The dedicated page is orphaned — it's effectively invisible to Google today, so whatever
it ranks now, it does so despite the site, not because of it. Internal links (C1) +
schema parity (H5) + title cleanup is the closest thing to a free win in this audit.
Where a page goes from orphaned to properly linked and optimized, first-page movement
within 4–8 weeks is common in low-competition suburb terms (Petersham is a small
suburb with few competing practices). This keyword has the **highest expected percentage
uplift** of the three.

**"Emergency Dentist."**
Two different games: the unmodified term "emergency dentist" is Sydney-wide and dominated
by dedicated emergency clinics — a single service page won't win that. But
**"emergency dentist Marrickville" / "Petersham" / "Inner West"** are winnable, and today
your page doesn't even enter the contest (its title says "Marrickville Dentist"). Fixing
C2 takes this from ~no eligibility to genuine top-5 contention on the geo-modified terms,
which is where the bookable intent is anyway. Expect movement 4–10 weeks after the
rewrite. This is also your highest-value traffic (urgent intent converts at multiples of
research intent).

**Site-wide:** the Core Web Vitals fixes (H1) affect every query. Google's page-experience
signal is a tiebreaker rather than a primary factor — think of it as protecting and
sharpening every other gain rather than producing its own jump. The faster pages will
also measurably lift **Google Ads Quality Score** (landing-page experience), which can
lower cost-per-click on the existing campaigns — often the most immediate dollar impact.

**Sequencing note:** implement before or immediately after DNS cutover, then submit the
sitemap in Search Console and annotate the date. Expect a few weeks of ranking noise
after any migration; judge results at 6–8 weeks, not 2.

---

## Suggested implementation order

| Phase | Items | Effort | Impact |
|---|---|---|---|
| 1 (same day) | C1 footer links, H2 footer H1s→H2s, M4 ING link | ~1 hour | High |
| 2 (this week) | C2 emergency rewrite, C3 cannibalization decision, H3 titles | half day + copy decisions | Highest |
| 3 (this week) | H1 media: video poster, banner/image recompression, preconnect | half day, scripted | High (CWV + Ads QS) |
| 4 (next) | H4 alt text, H5 schema, M1 descriptions sign-off | half day | Medium-high |
| 5 (ongoing) | M2/M3/M5 content depth, FAQs, contextual links | iterative | Compounding |

**Measurement:** record current Search Console positions for the three terms (+ variants)
before changes; compare 6–8 weeks post-implementation. Off-site (not in this audit's
scope but material to the local pack): Google Business Profile completeness, review
velocity and replies, and consistent NAP citations remain roughly half the local-ranking
equation.

---

## Implementation log (2026-08-22)

Implemented same day as the audit:

- ✅ **C1** Footer "Petersham" link → petersham-dentist.html (33 inbound links).
  Footer "Marrickville" intentionally stays → homepage (see C3 resolution).
- ✅ **C2** Emergency page fully retargeted: new title/meta/H1, same-day emergency copy,
  "Emergencies we treat" + "What to do right now" sections, 4 FAQs with FAQPage schema,
  cross-links from toothache.html and tooth-extraction.html.
- ✅ **C3** marrickville-dentist.html confirmed as a Google Ads landing page → kept live,
  `noindex`, removed from sitemap. Homepage is now the sole organic target for
  "Marrickville Dentist".
- ✅ **H2** Footer H1s demoted to H2 (rendering pinned identical via site.css).
- ✅ **H3** All 32 titles rewritten — service + locality + brand pattern; duplicate
  implants/dentures/bridges titles resolved.
- ✅ **H1 (perf)** Hero video poster + preload=metadata; 40 heavy images converted to
  WebP (~48MB saved; banner LCP image 1.2MB → 96KB; tutorial thumbs 5.9MB → ~100KB);
  preconnects for fonts/GTM; self-hosted @font-face inlined with font-display:swap +
  core woff2 preloads (hero H1 text was font-blocked).
- ✅ **H4** 90 alt attributes added (review cards, affiliate logos, decorative icons,
  header logo — now also linked to home).
- ✅ **H5** Dentist schema: sameAs (FB/IG/LinkedIn) + areaServed (6 suburbs) on all four
  landing pages; Petersham schema brought to parity (geo/hours/priceRange).
- ✅ **M4** ING footer link fixed (ing.com.tr → ing.com.au/health-insurance).
- **Measured result (Lighthouse mobile, homepage):** performance 58 → 71,
  LCP 17.5s → 4.8s, SEO 85 → 92, accessibility 70 → 79.

Still open: **M1** meta-description sign-off (DESCRIPTIONS-REVIEW.md), **M2/M3/M5**
content-depth work (implants page, service FAQs, more contextual links), remaining
accessibility contrast items.
