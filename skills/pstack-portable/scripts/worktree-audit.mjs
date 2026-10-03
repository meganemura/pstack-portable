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
const worktrees = records.map(record => {
  const status = git(record.path, ['status', '--porcelain', '-z']);
  const merged = baseExists && record.head ? git(repository, ['merge-base', '--is-ancestor', record.head, base]) : null;
  return {
    ...record,
    workingTree: !status.ok ? 'unknown' : status.output ? 'dirty' : 'clean',
    mergedByAncestry: !merged ? 'unknown' : merged.ok ? 'yes' : 'not-proven',
    chatRecency: 'unknown',
    pullRequestState: 'not-queried',
    disposition: status.ok && status.output ? 'hold-dirty' : 'needs-review',
  };
});
console.log(JSON.stringify({ repository, base, baseExists, fetchPerformed: false, deletionAuthorized: false, worktrees }, null, 2));
