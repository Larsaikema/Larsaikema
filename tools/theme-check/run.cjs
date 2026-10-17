// Usage: node run.js <theme-root> [config.yml] [--json]
// Prints offenses like `shopify theme check` (severity 0 error, 1 warning, 2 info) and exits 1 on errors.
const path = require('node:path');
const { themeCheckRun } = require('@shopify/theme-check-node');

(async () => {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const pos = args.filter((a) => !a.startsWith('--'));
  const root = path.resolve(pos[0]);
  const cfg = pos[1] ? path.resolve(pos[1]) : undefined;
  const { offenses, theme } = await themeCheckRun(root, cfg, () => {});
  const sev = ['error', 'warning', 'info'];
  if (json) {
    console.log(JSON.stringify(offenses.map((o) => ({ check: o.check, severity: sev[o.severity], file: o.uri.replace('file://' + root + '/', ''), line: o.start.line + 1, message: o.message })), null, 1));
  } else {
    const rows = offenses
      .map((o) => `${sev[o.severity].padEnd(7)} ${o.uri.replace('file://' + root + '/', '')}:${o.start.line + 1}  [${o.check}] ${o.message}`)
      .sort();
    rows.forEach((r) => console.log(r));
    const counts = sev.map((s, i) => `${offenses.filter((o) => o.severity === i).length} ${s}s`).join(', ');
    console.log(`\n${theme.length} files inspected, ${offenses.length} offenses: ${counts}`);
  }
  process.exit(offenses.some((o) => o.severity === 0) ? 1 : 0);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
