import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const required = [
  'apps/web/lib/env.ts',
  'apps/web/lib/supabase/admin.ts',
  'apps/web/lib/supabase/server.ts',
  'apps/web/proxy.ts',
  'apps/web/next.config.ts',
  'apps/web/app/api/health/route.ts',
  'infrastructure/production/docker-compose.judge.yml',
  'infrastructure/production/.env.judge.example',
  'supabase/migrations/0005_stage9_production_hardening.sql',
  'supabase/tests/rls_smoke.sql'
];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing ${file}`);
}
const env = fs.readFileSync(path.join(root, 'apps/web/lib/env.ts'), 'utf8');
if (!env.includes('SUPABASE_SECRET_KEY')) throw new Error('Server secret validation missing');
const next = fs.readFileSync(path.join(root, 'apps/web/next.config.ts'), 'utf8');
for (const h of ['X-Content-Type-Options','X-Frame-Options','Strict-Transport-Security']) if (!next.includes(h)) throw new Error(`Missing security header ${h}`);
const compose = fs.readFileSync(path.join(root, 'infrastructure/production/docker-compose.judge.yml'), 'utf8');
for (const x of ['read_only: true','cap_drop: [ALL]','no-new-privileges:true']) if (!compose.includes(x)) throw new Error(`Missing sandbox hardening ${x}`);
console.log('Stage 9 smoke test: PASS');
