# Dental Residence — dentalresidence.com.au

Static site for Dental Residence (Marrickville dentist), migrated from Weebly
in August 2026. Built with [Eleventy](https://www.11ty.dev/), served by Netlify.

## Quick start

```bash
npm install
npm run serve    # local dev at http://localhost:8080
npm run build    # production build to _site/
```

## Editing content

- **Page copy** lives in `src/pages/<name>.html` — raw HTML below the JSON
  front matter. The front matter holds the page title, og tags, meta
  description and nav-highlight state.
- **Navigation menu**: `src/_data/nav.json` (one source renders both the
  desktop and mobile menus).
- **Header/footer/tracking**: `src/_includes/layouts/base.njk` and
  `src/_includes/partials/` (footer content, tracking tags, nav macro).
- **Phone number / booking URL** and tag IDs are listed in
  `src/_data/site.json` for reference (several also appear inline in page
  content — search before changing).

## Marketing tags (do not remove)

| Tag | ID | Where |
|---|---|---|
| Google Tag Manager | GTM-TSWZZVL9 | `partials/tracking-head.njk` + noscript in base layout |
| GA4 | G-J9LBF4ZD0T | `partials/tracking-head.njk` |
| Google Ads conversions | AW-357358707 | thank-you pages fire on load (`adsConversion` front matter flag) |
| Meta Pixel | 1042136203074592 | `partials/tracking-head.njk` |
| Adobe Typekit fonts | yma5stg | `headLinks` front matter on hero pages |
| MyHealth1st booking widget | profile 9023 | script at end of base layout + Book Online links |

## Enquiry form

`src/pages/enquiry.html` is a **Netlify Form** named `enquiry`. Submissions
appear in the Netlify dashboard (Forms tab); configure email notifications
there. Redirects to `/thank-you-enquiry.html`, which fires the Google Ads
conversion.

## URL rules (SEO — important)

- Page URLs are `/<name>.html`, identical to the old Weebly site. Do not
  rename pages without adding a 301 in `src/_redirects`.
- Netlify post-processing is disabled in `netlify.toml` (`skip_processing`)
  so URLs are never rewritten. Keep it that way.
- Image/video URLs under `/files/` and `/uploads/` also match the old site.

## Folder map

```
scripts/          one-time migration tooling (extract.mjs regenerates
                  src/pages from the ../DR Website scrape — reruns will
                  overwrite manual page edits!)
rescue/           assets recovered from the live Weebly site before shutdown
files/, uploads/  media, served at their original URLs (videos are
                  ffmpeg-compressed; originals in ../DR Website)
src/              Eleventy input (pages, layouts, data, assets)
DESCRIPTIONS-REVIEW.md  drafted meta descriptions pending owner review
```

## History

Migrated from a Weebly scrape (`../DR Website`) on 2026-08-22. The Weebly
runtime (jQuery 1.8.3, main.js, ~1MB of platform JS/CSS), inactive Poptin and
Zotabox widgets, and a dead UA property were removed; nav/menu behaviour was
rebuilt in `src/assets/js/nav.js` (vanilla). Page copy is word-for-word
identical to the live site (verified by `scripts/compare-live.mjs`).
