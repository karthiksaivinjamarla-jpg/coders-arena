import fs from 'node:fs';
import path from 'node:path';

const root = new URL('.', import.meta.url).pathname;
const required = [
  'supabase/migrations/0003_stage6_realtime_leaderboard.sql',
  'apps/web/components/submission-status.tsx',
  'apps/web/components/live-leaderboard.tsx',
  'apps/web/app/contests/[contestId]/leaderboard/page.tsx',
  'docs/STAGE-6-REALTIME.md',
];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing ${file}`);
}
const sql = fs.readFileSync(path.join(root, required[0]), 'utf8');
for (const needle of ['supabase_realtime', 'refresh_leaderboard_for_user', 'submissions_leaderboard', 'contest_registration_leaderboard']) {
  if (!sql.includes(needle)) throw new Error(`Missing SQL feature: ${needle}`);
}
const submission = fs.readFileSync(path.join(root, required[1]), 'utf8');
if (!submission.includes('postgres_changes') || !submission.includes('removeChannel')) throw new Error('Realtime submission subscription/cleanup missing');
const leaderboard = fs.readFileSync(path.join(root, required[2]), 'utf8');
if (!leaderboard.includes('postgres_changes') || !leaderboard.includes('removeChannel')) throw new Error('Realtime leaderboard subscription/cleanup missing');
console.log('Stage 6 smoke checks passed.');
