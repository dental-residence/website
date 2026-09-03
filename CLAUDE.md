# CLAUDE.md

Eleventy static site for dentalresidence.com.au (dental practice in
Marrickville, Sydney). Migrated from Weebly 2026-08-22; served by Netlify from
GitHub (dental-residence/website). See README.md for the folder map.

## Hard rules

- **SEO is business-critical** (site ranks ~#4 for target keywords; Google Ads
  is the main marketing channel). Never change page URLs, titles, headings, or
  body copy without being asked. Renamed/removed pages need a 301 in
  `src/_redirects`.
- **Never remove tracking**: GTM `GTM-TSWZZVL9`, GA4 `G-J9LBF4ZD0T`, Ads
  conversions `AW-357358707` (fire on the two thank-you pages), Meta Pixel,
  Typekit, MyHealth1st widget script. They live in
  `src/_includes/partials/tracking-head.njk` and `layouts/base.njk`.
- `netlify.toml` disables Netlify post-processing so `.html` URLs are never
  rewritten — do not remove `skip_processing`.
- **`scripts/extract.mjs` is FROZEN** (it exits unless forced). `src/pages/`
  and `partials/footer-content.njk` are the source of truth and contain manual
  SEO edits (titles, emergency-page rewrite, footer fixes, alt text) that the
  extractor does not encode. Never regenerate.
- `marrickville-dentist.html` is a **Google Ads landing page**: kept live but
  `noindex` and excluded from the sitemap so the homepage is the sole organic
  target for "Marrickville Dentist". Don't index it or link it into the sitemap;
  don't delete it (Ads traffic lands there).

## Architecture notes

- Page bodies in `src/pages/*.html` are raw HTML (Weebly `wsite-*` markup)
  with JSON front matter; `htmlTemplateEngine: false` so bodies are never
  template-processed. Layout chrome is Nunjucks.
- Nav renders twice (desktop `#navigation`, mobile `#navmobile`) from
  `src/_data/nav.json` via `partials/nav.njk`. Interactive behaviour
  (flyouts, hamburger, mobile drill menu) is `src/assets/js/nav.js` — it
  recreates the old Weebly runtime's DOM contract (`#wsite-menus`,
  `body.menu-open`, `.wsite-menu-slide`), which the theme CSS
  (`files/main_style.css`, `src/assets/css/vendor/sites.css`) depends on.
- Platform-element CSS was deduplicated into
  `src/assets/css/platform-elements.css` with `.pe-vN` classes stamped on the
  matching content divs.
- The enquiry form is a Netlify Form (`name="enquiry"`); notifications are
  configured in the Netlify UI, not in code.
- Fonts and Weebly vendor CSS are self-hosted under `src/assets/`;
  `files/main_style.css` must stay at that path (relative url() refs).

## Verification

- `node scripts/compare-live.mjs [page.html]` — word-level content diff of
  built pages vs the live site (only useful while Weebly original is up).
- Screenshot comparison: headless Chrome at 1440/375px against production.
