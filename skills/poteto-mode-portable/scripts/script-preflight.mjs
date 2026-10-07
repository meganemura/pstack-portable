// Classify upstream entry points before execution. This tool never runs scripts or installs dependencies.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
function option(name) {
  const at = args.indexOf(name);
  if (at < 0 || !args[at + 1] || args[at + 1].startsWith('--')) throw new Error(`Missing ${name}`);
  return args[at + 1];
}
function available(command) {
  return spawnSync(command, ['--version'], { stdio: 'ignore', timeout: 5000 }).status === 0;
}
function digest(path) { return createHash('sha256').update(readFileSync(path)).digest('hex'); }
function inspect() {
  const root = realpathSync(option('--upstream-root'));
  const environment = option('--environment');
  const script = option('--script');
  if (!['codex', 'claude-code', 'cursor'].includes(environment)) throw new Error('Unknown environment');
  const manifest = JSON.parse(readFileSync(resolve(here, 'upstream-scripts.json'), 'utf8'));
  const prefix = 'skills/poteto-mode/scripts/';
  const runtime = ['bootstrap.ts', 'package.json', 'bun.lock'];
  const dependencies = {
    'skills/show-me-your-work/scripts/log.sh': [],
    [`${prefix}worktree-audit.sh`]: [],
    [`${prefix}check-plan.mjs`]: [],
    [`${prefix}orch/orch.ts`]: [...runtime, 'orch/store.ts'].map(path => prefix + path),
    [`${prefix}watch-pr/watch-pr`]: [...runtime, ...['cli', 'github', 'policy', 'render', 'types'].map(name => `watch-pr/${name}.ts`)].map(path => prefix + path),
  };
  if (!Object.hasOwn(dependencies, script)) return { status: 'BLOCKED', reason: 'Unknown or unsupported entry point; inspect and add a compatibility mapping first.' };
  for (const required of [script, ...dependencies[script]]) {
    const file = manifest.files.find(file => file.path === required);
    if (!file) return { status: 'BLOCKED', reason: `Missing compatibility fingerprint: ${required}` };
    const path = resolve(root, file.path);
    if (!existsSync(path)) return { status: 'BLOCKED', reason: `Missing upstream file: ${file.path}` };
    const real = realpathSync(path);
    const inside = relative(root, real);
    if (inside === '..' || inside.startsWith('../') || isAbsolute(inside)) return { status: 'BLOCKED', reason: `File escapes upstream root: ${file.path}` };
    if (digest(real) !== file.sha256) return { status: 'BLOCKED', reason: `Upstream changed: ${file.path}. Reassess compatibility before updating the fingerprint.` };
  }
  const scripts = resolve(root, 'skills/poteto-mode/scripts');
  if (script === `${prefix}worktree-audit.sh`) {
    return { status: 'ADAPTER', command: ['node', resolve(here, 'worktree-audit.mjs'), '<repository>'], reason: 'Use Git-only evidence; Cursor chat recency is unavailable and cleanup approval stays unresolved.' };
  }
  if (script === `${prefix}check-plan.mjs`) {
    // The checker requires the program to arm `/loop 1h`. Cursor and Claude Code expose a native `/loop`; Codex has no verified equivalent.
    if (environment === 'codex') return { status: 'BLOCKED', workflow: 'multi-phase-plan', reason: 'The upstream multi-phase plan checker requires a `/loop 1h` audit tick, and Codex has no verified recurring loop command. This is not a general Feature gate. For a selected multi-phase-plan workflow, review shared criteria manually and report that automated gate unresolved.' };
    return { status: 'READY', command: ['node', resolve(root, script), '<plan.md>'], requirements: ['A passing check proves plan structure only. Arm the `/loop 1h` tick in a session that stays open.', 'Outside a repository that carries pstack on trunk, report the `git show origin/main:` marker as a translation mismatch; see capabilities.md.'] };
  }
  if (script === 'skills/show-me-your-work/scripts/log.sh') {
    return available('bash') ? { status: 'READY', command: ['bash', resolve(root, script), '<six log arguments>'] } : { status: 'BLOCKED', reason: 'Bash is unavailable.' };
  }
  if (![`${prefix}orch/orch.ts`, `${prefix}watch-pr/watch-pr`].includes(script)) return { status: 'BLOCKED', reason: 'This is a library or bootstrap resource, not a supported standalone entry point.' };
  if (!available('bun')) return { status: 'BLOCKED', reason: 'Bun is unavailable. Do not substitute Node for Bun APIs.' };
  const key = createHash('sha256').update(readFileSync(resolve(scripts, 'package.json'))).update('\0').update(readFileSync(resolve(scripts, 'bun.lock'))).digest('hex');
  const marker = resolve(scripts, 'node_modules/.poteto-mode-tools-install-key');
  const commander = resolve(scripts, 'node_modules/commander/package.json');
  if (!existsSync(marker) || !existsSync(commander) || readFileSync(marker, 'utf8').trim() !== key) return { status: 'BLOCKED', reason: 'The bootstrap would install dependencies. Review the existing lockfile and obtain dependency-install authorization before preparing this runtime.' };
  if (script === `${prefix}watch-pr/watch-pr` && !available('gh')) return { status: 'BLOCKED', reason: 'GitHub CLI is unavailable.' };
  return { status: 'READY', command: ['bun', resolve(root, script)], requirements: script.endsWith('orch.ts') ? ['Pass --store with an explicit task-owned directory.'] : ['Verify GitHub authentication and repository context.', 'Polling output alone does not resume the agent.'] };
}
try {
  const result = inspect();
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.status === 'BLOCKED' ? 2 : 0;
} catch (error) {
  console.log(JSON.stringify({ status: 'BLOCKED', reason: error.message }, null, 2));
  process.exitCode = 2;
}
