// Coverage gate (mission §MANDATORY CI/CD): fail the build under 80% overall and
// under 90% on the domain layer (packages/shared/src/domain/** — the RSVP state
// machine, feed ranking, reputation, location privacy & entitlement logic that
// safety/payments decisions ride on). Reads Vitest's coverage-summary.json so the
// threshold is enforced on machine-parseable numbers, not scraped log text.
//
// Usage: node coverage-gate.mjs <path-to-coverage-summary.json>
import { readFileSync } from 'node:fs';

const OVERALL_MIN = 80;
const DOMAIN_MIN = 90;
// Lines is the headline metric we gate on; statements is reported alongside.
const METRIC = 'lines';

const summaryPath = process.argv[2];
if (!summaryPath) {
  console.error('coverage-gate: missing path to coverage-summary.json');
  process.exit(2);
}

let summary;
try {
  summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
} catch (err) {
  console.error(`coverage-gate: cannot read ${summaryPath}: ${err.message}`);
  process.exit(2);
}

const pct = (entry) => (entry && entry[METRIC] ? entry[METRIC].pct : 0);

// Overall: Vitest's "total" rollup across the package under test.
const overall = pct(summary.total);

// Domain: aggregate the per-file entries whose path is inside src/domain. We sum
// covered/total so the threshold reflects real line counts, not a mean of means.
let domainCovered = 0;
let domainTotal = 0;
for (const [file, entry] of Object.entries(summary)) {
  if (file === 'total') continue;
  const normalized = file.replaceAll('\\', '/');
  if (!/\/(src\/)?domain\//.test(normalized)) continue;
  const m = entry[METRIC];
  if (!m) continue;
  domainCovered += m.covered;
  domainTotal += m.total;
}
const domain = domainTotal === 0 ? 0 : (domainCovered / domainTotal) * 100;

const round = (n) => Math.round(n * 100) / 100;
const failures = [];
if (overall < OVERALL_MIN) {
  failures.push(`overall ${round(overall)}% < ${OVERALL_MIN}% (${METRIC})`);
}
if (domainTotal === 0) {
  failures.push('domain layer produced no coverage data — expected src/domain/** files');
} else if (domain < DOMAIN_MIN) {
  failures.push(`domain ${round(domain)}% < ${DOMAIN_MIN}% (${METRIC})`);
}

console.log('─────────────────────────────────────────────');
console.log(' Tayfa coverage gate');
console.log(`  overall ${METRIC}: ${round(overall)}%  (min ${OVERALL_MIN}%)`);
console.log(`  domain  ${METRIC}: ${round(domain)}%  (min ${DOMAIN_MIN}%, ${domainTotal} lines)`);
console.log('─────────────────────────────────────────────');

if (failures.length > 0) {
  for (const f of failures) console.error(`::error title=Coverage gate::${f}`);
  process.exit(1);
}
console.log('Coverage gate passed ✓');
