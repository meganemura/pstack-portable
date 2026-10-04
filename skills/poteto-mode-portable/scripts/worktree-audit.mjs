// Collect Git evidence without chat-history access. Unknown merge or activity evidence never authorizes deletion.
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const repository = resolve(process.argv[2] || '.');
const base = process.argv[3] || 'origin/main';
function git(path, args) {
  const result = spawnSync('git', ['-C', path, ...args], { encoding: 'utf8', timeout: 10000 });
  return { ok: result.status === 0, output: result.stdout || '', error: result.stderr || '' };
}
const listing = git(repository, ['worktree', 'list', '--porcelain', '-z']);
if (!listing.ok) { console.error(listing.error); process.exit(2); }
const records = [];
let record;
for (const field of listing.output.split('\0')) {
  if (field.startsWith('worktree ')) { record = { path: field.slice(9) }; records.push(record); }
  else if (record && field.startsWith('HEAD ')) record.head = field.slice(5);
  else if (record && field.startsWith('branch ')) record.branch = field.slice(7);
  else if (record && field === 'prunable') record.prunable = true;
}
const baseExists = git(repository, ['rev-parse', '--verify', `${base}^{commit}`]).ok;
// Split status the way the upstream audit does: tracked edits are wip that blocks cleanup; untracked files are scratch the user must see named.
function changes(output) {
  const tracked = [];
  const untracked = [];
  const fields = output.split('\0');
  for (let at = 0; at < fields.length; at++) {
    const entry = fields[at];
    if (!entry) continue;
    if (entry.startsWith('?? ')) untracked.push(entry.slice(3));
    else tracked.push(entry.slice(3));
    if (/^[RC]/.test(entry)) at++;
  }
  return { tracked, untracked };
}
const worktrees = records.map(record => {
  const status = git(record.path, ['status', '--porcelain', '-z']);
  const found = status.ok ? changes(status.output) : null;
  const merged = baseExists && record.head ? git(repository, ['merge-base', '--is-ancestor', record.head, base]) : null;
  return {
    ...record,
    workingTree: !found ? 'unknown' : found.tracked.length ? `wip:${found.tracked.length}` : found.untracked.length ? `scratch:${found.untracked.length}` : 'clean',
    untrackedFiles: found ? found.untracked : [],
    mergedByAncestry: !merged ? 'unknown' : merged.ok ? 'yes' : 'not-proven',
    chatRecency: 'unknown',
    pullRequestState: 'not-queried',
    disposition: !found ? 'needs-review' : found.tracked.length ? 'hold-wip' : 'needs-review',
  };
});
console.log(JSON.stringify({ repository, base, baseExists, fetchPerformed: false, deletionAuthorized: false, worktrees }, null, 2));
