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
  if (!manifest.files.some(file => file.path === script)) return { status: 'BLOCKED', reason: 'Unknown entry point; inspect and add a compatibility mapping first.' };
  for (const file of manifest.files) {
    const path = resolve(root, file.path);
    if (!existsSync(path)) return { status: 'BLOCKED', reason: `Missing upstream file: ${file.path}` };
    const real = realpathSync(path);
    const inside = relative(root, real);
    if (inside === '..' || inside.startsWith('../') || isAbsolute(inside)) return { status: 'BLOCKED', reason: `File escapes upstream root: ${file.path}` };
    if (digest(real) !== file.sha256) return { status: 'BLOCKED', reason: `Upstream changed: ${file.path}. Reassess compatibility before updating the fingerprint.` };
  }
  const scripts = resolve(root, 'skills/poteto-mode/scripts');
  const prefix = 'skills/poteto-mode/scripts/';
  if (script === `${prefix}worktree-audit.sh`) {
    return { status: 'ADAPTER', command: ['node', resolve(here, 'worktree-audit.mjs'), '<repository>'], reason: 'Use Git-only evidence; Cursor chat recency is unavailable and cleanup approval stays unresolved.' };
  }
  if (script === `${prefix}check-plan.mjs`) {
    if (environment !== 'cursor') return { status: 'BLOCKED', reason: 'The upstream plan checker requires Cursor program markers. Review shared plan criteria manually and report the automated gate unresolved.' };
    return { status: 'READY', command: ['node', resolve(root, script), '<plan.md>'] };
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
