import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  '.env.example',
  '.github/workflows/ci.yml',
  '.github/workflows/deploy-supabase.yml',
  '.github/workflows/deploy-vercel.yml',
  '.github/workflows/deploy-judge.yml',
  'vercel.json',
  'infrastructure/production/docker-compose.judge.yml',
  'infrastructure/production/.env.web.example',
  'infrastructure/production/.env.judge.example',
  'supabase/migrations/0001_initial_schema.sql',
  'supabase/migrations/0002_stage3_constraints.sql',
  'supabase/migrations/0003_stage6_realtime_leaderboard.sql',
  'supabase/migrations/0004_stage7_scoring_freeze.sql',
  'supabase/migrations/0005_stage9_production_hardening.sql',
  'supabase/tests/rls_smoke.sql',
  'apps/web/app/page.tsx',
  'apps/web/app/api/health/route.ts',
  'apps/judge-worker/src/languages.ts',
];

for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) throw new Error(`Missing: ${rel}`);
}

const text = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
for (const key of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_SECRET_KEY', 'REDIS_URL']) {
  if (!text.includes(key)) throw new Error(`Missing env key: ${key}`);
}

const scanned = ['.env.example', '.github/workflows/ci.yml', '.github/workflows/deploy-supabase.yml', '.github/workflows/deploy-vercel.yml', '.github/workflows/deploy-judge.yml', 'infrastructure/production/.env.web.example', 'infrastructure/production/.env.judge.example'].map((r) => fs.readFileSync(path.join(root, r), 'utf8')).join('\n');
for (const forbidden of ['SUPABASE_SERVICE_ROLE_KEY=', 'NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=']) {
  if (scanned.includes(forbidden)) throw new Error(`Potential secret leakage pattern: ${forbidden}`);
}
if (/SUPABASE_SECRET_KEY=sb_secret_(?!REPLACE_ME)/.test(scanned)) {
  throw new Error('Potential real Supabase secret key found in deployment templates');
}

console.log('Stage 14 preflight PASSED');
console.log(`Checked ${required.length} deployment artifacts and secret-key policy.`);
console.log('External deployment remains pending until real GitHub/Vercel/Supabase/Redis/Docker credentials are supplied.');
