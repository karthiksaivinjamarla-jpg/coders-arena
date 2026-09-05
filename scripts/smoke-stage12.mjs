import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(root, file));

const required = [
  'package.json', 'pnpm-workspace.yaml', 'vercel.json', '.env.example',
  '.github/workflows/ci.yml', '.github/workflows/deploy-supabase.yml',
  '.github/workflows/deploy-judge.yml',
  'apps/web/app/page.tsx', 'apps/web/app/api/health/route.ts',
  'apps/web/app/api/submissions/route.ts', 'apps/web/proxy.ts',
  'apps/web/lib/env.ts', 'apps/web/lib/supabase/admin.ts',
  'apps/judge-worker/src/index.ts', 'apps/judge-worker/src/executor.ts',
  'apps/judge-worker/src/languages.ts',
  'infrastructure/production/docker-compose.judge.yml',
  'supabase/migrations/0001_initial_schema.sql',
  'supabase/migrations/0003_stage6_realtime_leaderboard.sql',
  'supabase/migrations/0004_stage7_scoring_freeze.sql',
  'supabase/migrations/0005_stage9_production_hardening.sql',
  'supabase/tests/rls_smoke.sql'
];
for (const file of required) assert.ok(exists(file), `Missing required file: ${file}`);

// Prevent accidental secret/key leakage in committed source/config examples.
for (const file of ['.env.example', 'infrastructure/production/.env.judge.example']) {
  const text = read(file);
  assert.ok(!/sb_secret_[A-Za-z0-9_-]{10,}/.test(text), `Secret-like value in ${file}`);
  assert.ok(!/service_role.{0,10}=\s*[^\n#]+/i.test(text), `Legacy service_role value in ${file}`);
}

const worker = read('apps/judge-worker/src/index.ts');
assert.ok(worker.includes('process.env.SUPABASE_SECRET_KEY'), 'Worker must use SUPABASE_SECRET_KEY');
assert.ok(!worker.includes('SUPABASE_SERVICE_ROLE_KEY'), 'Worker must not use legacy service role key');

const ci = read('.github/workflows/ci.yml');
assert.ok(!ci.includes('cache: pnpm'), 'CI should not require a pnpm lockfile that is not committed');
assert.ok(ci.includes('pnpm install --frozen-lockfile=false'), 'CI install strategy missing');

const vercel = JSON.parse(read('vercel.json'));
assert.equal(vercel.framework, 'nextjs');
assert.equal(vercel.buildCommand, 'corepack pnpm --filter web build');

const env = read('.env.example');
for (const key of ['NEXT_PUBLIC_SUPABASE_URL=', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=', 'SUPABASE_SECRET_KEY=', 'REDIS_REST_URL=', 'REDIS_REST_TOKEN=']) {
  assert.ok(env.includes(key), `Missing env declaration: ${key}`);
}

const compose = read('infrastructure/production/docker-compose.judge.yml');
for (const marker of ['read_only: true', 'cap_drop: [ALL]', 'no-new-privileges:true']) {
  assert.ok(compose.includes(marker), `Missing judge hardening: ${marker}`);
}

const languages = read('apps/judge-worker/src/languages.ts');
for (const slug of ['cpp', 'python', 'java', 'javascript']) assert.ok(languages.includes(`slug: "${slug}"`), `Missing language: ${slug}`);

const routes = [
  'apps/web/app/api/health/route.ts',
  'apps/web/app/api/registrations/route.ts',
  'apps/web/app/api/submissions/route.ts',
  'apps/web/app/api/integrity-events/route.ts',
  'apps/web/app/api/admin/contests/[contestId]/freeze/route.ts',
  'apps/web/app/api/admin/contests/[contestId]/finalize/route.ts'
];
for (const route of routes) assert.ok(exists(route), `Missing API route: ${route}`);

console.log('Stage 12 launch-readiness smoke test: PASS');
console.log(`Checked ${required.length} required artifacts, production secrets policy, CI, Vercel, judge hardening, languages, and API routes.`);
console.log('External E2E: PENDING — requires package installation plus real Supabase, Redis, Docker, and Vercel/GitHub infrastructure.');
