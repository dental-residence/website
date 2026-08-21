# Rescued assets — 2026-08-22

Files referenced by the scraped pages but missing from the `DR Website/` scrape,
downloaded from the still-live https://www.dentalresidence.com.au before the
Weebly account closes. Fetched by `scripts/audit-refs.mjs --fetch`.

- Root of this folder: hand-fetched theme CSS/JS + favicon.
  - `main_style.css` — the site's entire theme stylesheet (ships in the new site
    as `/assets/css/vendor/main_style.css`).
  - `templateArtifacts.js`, `theme-*.js` — Weebly runtime/theme JS. Archived for
    reference only; NOT shipped (replaced by `src/assets/js/nav.js`).
- `fetched/` — mirror-pathed assets recovered by the audit script, including the
  CosmeticDentistry images and tutorial video thumbnails the scrape notes
  believed lost. These get copied into `files/` during the asset phase.

Confirmed dead on the live site (404 there too, pre-existing breakage — safe to
ignore): `files/theme/icons/{4,5,6}.png`, `files/theme/icons/{Phone,Map,Booking}_icon*.svg`
(referenced only from main_style.css), `files/theme/petersham-dentist/*.js`
(referenced only from commented-out markup).
