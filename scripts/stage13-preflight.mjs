import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  '.env.example',
  'vercel.json',
  'supabase/config.toml',
  'supabase/migrations/0001_initial_schema.sql',
  'supabase/migrations/0005_stage9_production_hardening.sql',
  'supabase/tests/rls_smoke.sql',
  'apps/web/app/api/health/route.ts',
  'apps/web/app/api/submissions/route.ts',
  'apps/judge-worker/src/index.ts',
  'apps/judge-worker/src/queue.ts',
  'infrastructure/production/docker-compose.judge.yml',
  'infrastructure/production/.env.judge.example',
  '.github/workflows/ci.yml',
  '.github/workflows/deploy-supabase.yml',
  '.github/workflows/deploy-judge.yml',
];

const forbidden = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_SECRET_KEY',
  'NEXT_PUBLIC_REDIS_REST_TOKEN',
];

const failures = [];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`missing: ${file}`);
}

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && !['node_modules', '.next', '.git'].includes(entry.name)) out.push(...walk(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

for (const file of [...walk(path.join(root, 'apps')), ...walk(path.join(root, 'infrastructure')), ...walk(path.join(root, '.github')), ...walk(path.join(root, 'supabase'))]) {
  const rel = path.relative(root, file);
  if (rel.startsWith('.git/')) continue;
  const text = fs.readFileSync(file, 'utf8');
  for (const token of forbidden) {
    if (text.includes(token)) failures.push(`forbidden secret identifier ${token} in ${rel}`);
  }
}

const envExample = fs.readFileSync(path.join(root, '.env.example'), 'utf8');
for (const key of ['NEXT_PUBLIC_SUPABASE_URL=', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=', 'SUPABASE_SECRET_KEY=', 'REDIS_REST_URL=', 'REDIS_REST_TOKEN=', 'JUDGE_QUEUE_NAME=']) {
  if (!envExample.includes(key)) failures.push(`missing env key: ${key}`);
}

const compose = fs.readFileSync(path.join(root, 'infrastructure/production/docker-compose.judge.yml'), 'utf8');
for (const token of ['read_only: true', 'cap_drop: [ALL]', 'no-new-privileges:true', 'tmpfs:']) {
  if (!compose.includes(token)) failures.push(`judge hardening missing: ${token}`);
}

if (failures.length) {
  console.error('Stage 13 preflight FAILED');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Stage 13 preflight PASSED');
console.log(`Checked ${required.length} deployment-critical files plus repository secret identifiers.`);
