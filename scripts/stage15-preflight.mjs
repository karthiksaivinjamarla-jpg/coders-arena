import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const required = [
  'package.json',
  'pnpm-workspace.yaml',
  'vercel.json',
  '.vercelignore',
  '.env.example',
  'supabase/config.toml',
  'apps/web/package.json',
  'apps/web/next.config.ts',
  'apps/web/lib/env.ts',
  'apps/web/proxy.ts',
  'apps/web/app/api/health/route.ts',
  'apps/web/app/api/submissions/route.ts',
  'apps/judge-worker/package.json',
  'apps/judge-worker/src/index.ts',
  'apps/judge-worker/src/languages.ts',
  'docs/STAGE-15-DEPLOYMENT.md'
];

const missing = required.filter((p) => !existsSync(join(process.cwd(), p)));
if (missing.length) {
  console.error('Stage 15 preflight FAILED');
  console.error(missing.join('\n'));
  process.exit(1);
}

const env = readFileSync('.env.example', 'utf8');
for (const name of ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY']) {
  if (!env.includes(`${name}=`)) throw new Error(`Missing ${name} in .env.example`);
}
if (/NEXT_PUBLIC_.*SECRET|NEXT_PUBLIC_.*SERVICE_ROLE/i.test(env)) {
  throw new Error('Potential privileged secret exposed through NEXT_PUBLIC_*');
}

console.log('Stage 15 preflight PASSED');
console.log(`Checked ${required.length} deployment artifacts and secret-boundary policy.`);
console.log('Real deployment remains pending until the project is connected to the user-owned GitHub, Supabase, Vercel, Redis, and judge-host infrastructure.');
