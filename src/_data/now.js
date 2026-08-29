// Build-time clock. Used for the footer copyright year so it can't go stale.
export default () => ({ year: new Date().getFullYear() });
