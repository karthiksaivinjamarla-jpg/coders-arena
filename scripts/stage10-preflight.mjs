import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const mustExist = [
  'vercel.json', '.vercelignore', '.github/workflows/ci.yml',
  '.github/workflows/deploy-supabase.yml', '.github/workflows/deploy-judge.yml',
  'infrastructure/production/docker-compose.judge.yml',
  'infrastructure/production/.env.judge.example',
  'apps/web/lib/env.ts', 'apps/web/app/api/health/route.ts',
  'supabase/migrations/0005_stage9_production_hardening.sql',
  'supabase/tests/rls_smoke.sql'
];
for (const f of mustExist) if (!fs.existsSync(path.join(root, f))) throw new Error(`Missing ${f}`);

const env = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
if (!env.includes('SUPABASE_SECRET_KEY=')) throw new Error('Missing server secret example');
const judgeEnv = fs.readFileSync(path.join(root, 'infrastructure/production/.env.judge.example'), 'utf8');
if (!judgeEnv.includes('NEXT_PUBLIC_SUPABASE_URL=')) throw new Error('Judge env uses inconsistent Supabase URL variable');
if (judgeEnv.includes('\nSUPABASE_URL=')) throw new Error('Legacy SUPABASE_URL variable remains');

const ignore = fs.readFileSync(path.join(root, '.vercelignore'), 'utf8');
if (!ignore.includes('.env')) throw new Error('Vercel env files are not ignored');
const vercel = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
if (vercel.buildCommand !== 'corepack pnpm --filter web build') throw new Error('Unexpected Vercel build command');

const compose = fs.readFileSync(path.join(root, 'infrastructure/production/docker-compose.judge.yml'), 'utf8');
for (const marker of ['read_only: true', 'cap_drop: [ALL]', 'no-new-privileges:true']) {
  if (!compose.includes(marker)) throw new Error(`Missing judge hardening: ${marker}`);
}

const workflows = fs.readFileSync(path.join(root, '.github/workflows/deploy-supabase.yml'), 'utf8');
for (const secret of ['SUPABASE_ACCESS_TOKEN', 'SUPABASE_PROJECT_ID']) if (!workflows.includes(secret)) throw new Error(`Missing workflow secret: ${secret}`);

console.log('Stage 10 preflight: PASS');
console.log('External deployment checks: PENDING — requires Vercel/Supabase/GitHub/Docker credentials.');
