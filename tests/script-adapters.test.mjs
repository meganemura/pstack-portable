// Verify executable verdicts and conservative worktree evidence using isolated fixtures.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scripts = resolve(root, 'skills/poteto-mode-portable/scripts');
const source = process.env.PSTACK_UPSTREAM_ROOT;
function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 15000 });
  if (result.error) throw result.error;
  return result;
}
function git(path, ...args) {
  const result = run('git', ['-C', path, ...args]);
  assert.equal(result.status, 0, result.stderr);
}
function preflight(upstream, script, environment = 'codex') {
  const result = run(process.execPath, [resolve(scripts, 'script-preflight.mjs'), '--upstream-root', upstream, '--environment', environment, '--script', script]);
  return { exit: result.status, ...JSON.parse(result.stdout) };
}
test('worktree audit separates wip from scratch and preserves unknown evidence', () => {
  const fixture = mkdtempSync(resolve(tmpdir(), 'pstack-worktree-test-'));
  try {
    const repo = resolve(fixture, 'repository with spaces');
    mkdirSync(repo);
    git(repo, 'init', '-b', 'main');
    git(repo, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '--allow-empty', '-m', 'Fixture');
    const child = resolve(fixture, 'child with spaces');
    git(repo, 'worktree', 'add', '-b', 'child', child);
    writeFileSync(resolve(child, 'untracked.txt'), 'preserve me');
    const edited = resolve(fixture, 'edited with spaces');
    writeFileSync(resolve(repo, 'tracked.txt'), 'base');
    git(repo, 'add', 'tracked.txt');
    git(repo, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-m', 'Track');
    git(repo, 'worktree', 'add', '-b', 'edited', edited);
    writeFileSync(resolve(edited, 'tracked.txt'), 'changed');
    writeFileSync(resolve(edited, 'scratch.txt'), 'scratch');
    const result = run(process.execPath, [resolve(scripts, 'worktree-audit.mjs'), repo, 'missing-base']);
    assert.equal(result.status, 0, result.stderr);
    const audit = JSON.parse(result.stdout);
    assert.equal(audit.deletionAuthorized, false);
    assert.equal(audit.fetchPerformed, false);
    assert.equal(audit.baseExists, false);
    const row = audit.worktrees.find(item => item.path === realpathSync(child));
    assert.equal(row.workingTree, 'scratch:1');
    assert.deepEqual(row.untrackedFiles, ['untracked.txt']);
    assert.equal(row.disposition, 'needs-review');
    const wip = audit.worktrees.find(item => item.path === realpathSync(edited));
    assert.equal(wip.workingTree, 'wip:1');
    assert.deepEqual(wip.untrackedFiles, ['scratch.txt']);
    assert.equal(wip.disposition, 'hold-wip');
    assert.equal(row.chatRecency, 'unknown');
    assert.equal(row.mergedByAncestry, 'unknown');
    assert.equal(readFileSync(resolve(child, 'untracked.txt'), 'utf8'), 'preserve me');
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});
test('script preflight rejects unsupported execution and changed upstream', { skip: !source && 'Set PSTACK_UPSTREAM_ROOT to the fingerprinted pstack checkout.' }, () => {
  const fixture = mkdtempSync(resolve(tmpdir(), 'pstack-preflight-test-'));
  try {
    const manifest = JSON.parse(readFileSync(resolve(scripts, 'upstream-scripts.json'), 'utf8'));
    for (const file of manifest.files) {
      const target = resolve(fixture, file.path);
      mkdirSync(dirname(target), { recursive: true });
      copyFileSync(resolve(source, file.path), target);
    }
    assert.equal(preflight(fixture, 'skills/poteto-mode/scripts/worktree-audit.sh').status, 'ADAPTER');
    assert.equal(preflight(fixture, 'skills/poteto-mode/scripts/check-plan.mjs').exit, 2);
    assert.equal(preflight(fixture, 'skills/poteto-mode/scripts/check-plan.mjs', 'cursor').status, 'READY');
    assert.equal(preflight(fixture, 'skills/poteto-mode/scripts/check-plan.mjs', 'claude-code').status, 'READY');
    assert.equal(preflight(fixture, 'skills/poteto-mode/scripts/orch/orch.ts').exit, 2);
    assert.equal(preflight(fixture, '../../unknown.sh').exit, 2);
    writeFileSync(resolve(fixture, 'skills/poteto-mode/scripts/bootstrap.ts'), 'changed');
    const changed = preflight(fixture, 'skills/show-me-your-work/scripts/log.sh');
    assert.equal(changed.exit, 2);
    assert.match(changed.reason, /Upstream changed/);
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});
