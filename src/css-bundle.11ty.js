// One render-blocking stylesheet instead of four (mobile speed). Concatenates
// the head CSS in the exact order base.njk used to load it, so the cascade is
// unchanged. Relative url() refs are rewritten to absolute paths because the
// bundle lives in a different folder from the sources (files/main_style.css
// itself stays where it is). Pages with "peExtra" get the variant that also
// carries platform-elements-extra.css in its original slot.
import fs from 'node:fs';
import path from 'node:path';

const read = (p) => fs.readFileSync(p, 'utf8');

// Rewrite url(relative) against the URL folder the source file is served from.
function absolutise(css, urlDir) {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, ref) => {
    if (/^(\/|data:|https?:|#|\.\.\.)/.test(ref)) return m;
    return `url(${q}${path.posix.join(urlDir, ref)}${q})`;
  });
}

// Inline <style> blocks from a partial, without the tags.
const styleBlocks = (p) =>
  [...read(p).matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');

function bundle(extra) {
  const parts = [
    absolutise(read('src/assets/css/vendor/sites.css'), '/assets/css/vendor/'),
    absolutise(read('src/assets/css/vendor/social-icons.css'), '/assets/css/vendor/'),
    absolutise(read('files/main_style.css'), '/files/'),
    styleBlocks('src/_includes/partials/fonts.njk'),
    styleBlocks('src/_includes/partials/head-styles.njk'),
    read('src/assets/css/platform-elements.css'),
    extra ? read('src/assets/css/platform-elements-extra.css') : '',
    read('src/assets/css/site.css'),
  ];
  return parts.join('\n').replace(/@charset[^;]*;/gi, '');
}

export const data = {
  pagination: { data: 'variants', size: 1, alias: 'variant' },
  variants: ['all', 'all-pe'],
  permalink: (d) => `/assets/css/${d.variant}.css`,
  eleventyExcludeFromCollections: true,
};

export function render({ variant }) {
  return bundle(variant === 'all-pe');
}
