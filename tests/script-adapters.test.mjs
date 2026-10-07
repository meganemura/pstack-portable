// Verify executable verdicts and conservative worktree evidence using isolated fixtures.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, copyFileSync, readFileSync, writeFileSync, rmSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const scripts = resolve(root, 'skills/poteto-mode-portable/scripts');
const pinned = resolve(root, 'upstream/plugins/pstack');
const source = process.env.PSTACK_UPSTREAM_ROOT || (existsSync(resolve(pinned, 'skills/poteto-mode/SKILL.md')) ? pinned : undefined);
function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 15000 });
  if (result.error) throw result.error;
  return result;
}
// The index entry is the pin a commit records, so the check also holds before the submodule is checked out.
test('pinned upstream matches the executable fingerprints', () => {
  const entry = run('git', ['-C', root, 'ls-files', '--stage', '--', 'upstream/plugins']).stdout.trim();
  assert.match(entry, /^160000 [0-9a-f]{40} 0\tupstream\/plugins$/);
  const manifest = JSON.parse(readFileSync(resolve(scripts, 'upstream-scripts.json'), 'utf8'));
  assert.equal(entry.split(' ')[1], manifest.commit);
});
function git(path, ...args) {
  const result = run('git', ['-C', path, ...args]);
  assert.equal(result.status, 0, result.stderr);
}
function preflight(upstream, script, environment = 'codex') {
  const result = run(process.execPath, [resolve(scripts, 'script-preflight.mjs'), '--upstream-root', upstream, '--environment', environment, '--script', script]);
  return { exit: result.status, ...JSON.parse(result.stdout) };
}
test('upstream root selection rejects a stale configured checkout', () => {
  const fixture = mkdtempSync(resolve(tmpdir(), 'pstack-root-test-'));
  try {
    const repo = resolve(fixture, 'configured checkout');
    const skill = resolve(repo, 'pstack/skills/poteto-mode/SKILL.md');
    mkdirSync(dirname(skill), { recursive: true });
    git(repo, 'init', '-b', 'main');
    const commit = message => git(repo, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-am', message);
    writeFileSync(skill, 'pinned');
    git(repo, 'add', '.');
    commit('Pinned');
    const pinnedCommit = run('git', ['-C', repo, 'rev-parse', 'HEAD']).stdout.trim();
    writeFileSync(skill, 'later');
    commit('Later');
    const pinnedTree = resolve(fixture, 'pinned checkout');
    git(repo, 'worktree', 'add', '--detach', pinnedTree, pinnedCommit);
    const manifest = resolve(fixture, 'manifest.json');
    writeFileSync(manifest, JSON.stringify({ commit: pinnedCommit }));
    const config = resolve(fixture, 'upstream.json');
    writeFileSync(config, JSON.stringify({ root: resolve(repo, 'pstack') }));
    const select = (...extra) => {
      const result = run(process.execPath, [resolve(scripts, 'upstream-root.mjs'), '--manifest', manifest, '--config', config, ...extra]);
      return { exit: result.status, ...JSON.parse(result.stdout) };
    };

    const pinned = select('--submodule', resolve(pinnedTree, 'pstack'));
    assert.equal(pinned.exit, 0);
    assert.equal(pinned.status, 'MATCHED');
    assert.equal(pinned.selected, realpathSync(resolve(pinnedTree, 'pstack')));
    assert.match(pinned.notes.join('\n'), /points at a different upstream/);

    const stale = select('--submodule', resolve(fixture, 'absent'));
    assert.equal(stale.exit, 2);
    assert.equal(stale.status, 'MISMATCH');

    const requested = select('--submodule', resolve(pinnedTree, 'pstack'), '--root', resolve(repo, 'pstack'));
    assert.equal(requested.exit, 2);
    assert.equal(requested.selected, realpathSync(resolve(repo, 'pstack')));

    writeFileSync(resolve(pinnedTree, 'pstack/skills/poteto-mode/SKILL.md'), 'edited');
    assert.equal(select('--submodule', resolve(pinnedTree, 'pstack')).status, 'MISMATCH');
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});
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
test('script preflight rejects unsupported execution and changed upstream', { skip: !source && 'Run git submodule update --init, or set PSTACK_UPSTREAM_ROOT.' }, () => {
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
    const logger = 'skills/show-me-your-work/scripts/log.sh';
    assert.equal(preflight(fixture, logger).status, 'READY');
    writeFileSync(resolve(fixture, 'skills/poteto-mode/scripts/check-plan.mjs'), 'changed');
    assert.equal(preflight(fixture, logger).status, 'READY');
    assert.match(preflight(fixture, 'skills/poteto-mode/scripts/check-plan.mjs', 'cursor').reason, /Upstream changed/);
    writeFileSync(resolve(fixture, 'skills/poteto-mode/scripts/bootstrap.ts'), 'changed');
    assert.equal(preflight(fixture, logger).status, 'READY');
    assert.match(preflight(fixture, 'skills/poteto-mode/scripts/orch/orch.ts').reason, /Upstream changed:.*bootstrap/);
    assert.match(preflight(fixture, 'skills/poteto-mode/scripts/watch-pr/watch-pr').reason, /Upstream changed:.*bootstrap/);
    writeFileSync(resolve(fixture, logger), 'changed');
    const changed = preflight(fixture, logger);
    assert.equal(changed.exit, 2);
    assert.match(changed.reason, /Upstream changed/);
  } finally { rmSync(fixture, { recursive: true, force: true }); }
});
