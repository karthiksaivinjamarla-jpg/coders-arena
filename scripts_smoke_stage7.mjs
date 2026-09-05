import fs from 'node:fs';
import path from 'node:path';

const root = new URL('.', import.meta.url).pathname;
const required = [
  'supabase/migrations/0004_stage7_scoring_freeze.sql',
  'apps/web/components/contest-freeze-button.tsx',
  'apps/web/app/api/admin/contests/[contestId]/freeze/route.ts',
  'apps/web/app/api/admin/contests/[contestId]/finalize/route.ts',
  'apps/web/app/admin/contests/[contestId]/page.tsx',
  'apps/web/app/admin/contests/[contestId]/leaderboard/page.tsx',
];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing ${file}`);
}
const sql = fs.readFileSync(path.join(root, required[0]), 'utf8');
for (const needle of [
  'penalty_minutes',
  'leaderboard_public_entries',
  'refresh_leaderboard_for_user',
  'wrong_answer','runtime_error','time_limit','memory_limit',
  'freeze_time',
  'alter publication supabase_realtime drop table public.leaderboard_entries',
  'last_solved_at',
]) {
  if (!sql.includes(needle)) throw new Error(`Stage 7 SQL missing ${needle}`);
}
const leaderboard = fs.readFileSync(path.join(root, 'apps/web/components/live-leaderboard.tsx'), 'utf8');
if (!leaderboard.includes('leaderboard_public_entries')) throw new Error('Leaderboard still targets private entries');
if (!leaderboard.includes('Frozen')) throw new Error('Frozen state missing');
const freeze = fs.readFileSync(path.join(root, 'apps/web/components/contest-freeze-button.tsx'), 'utf8');
if (!freeze.includes('change("freeze")') || !freeze.includes('change("finalize")')) throw new Error('Freeze/finalize controls incomplete');
console.log('Stage 7 smoke checks passed.');
