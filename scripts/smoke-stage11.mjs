import fs from 'node:fs';
import assert from 'node:assert/strict';

const root = new URL('..', import.meta.url).pathname;
const read = (p) => fs.readFileSync(new URL(p, `file://${root}`), 'utf8');
const page = read('apps/web/app/page.tsx');
const css = read('apps/web/app/globals.css');
const pkg = JSON.parse(read('apps/web/package.json'));

for (const text of ['Coders Arena', 'Explore contests', 'Live judging', 'Live rankings', 'HOW IT WORKS']) assert.ok(page.includes(text));
for (const text of ['promo-hero', 'feature-grid', 'steps-grid', 'contest-cta', '@media']) assert.ok(css.includes(text));
assert.equal(pkg.dependencies.next, '^16.2.6');
console.log('Stage 11 smoke test: PASSED');
