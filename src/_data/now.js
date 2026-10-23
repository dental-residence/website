// Build-time clock. Used for the footer copyright year so it can't go stale,
// and as a per-build version stamp on CSS/JS links (assets are cached for a
// week by netlify.toml, so the URL must change for an update to be seen).
const d = new Date();
export default () => ({ year: d.getFullYear(), build: d.getTime().toString(36) });
