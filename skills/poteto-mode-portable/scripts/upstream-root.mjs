// Select the upstream pstack root and compare it with the fingerprinted commit. Reads Git state only; never fetches or edits.
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
function option(name, fallback) {
  const at = args.indexOf(name);
  return at < 0 ? fallback : args[at + 1];
}
function git(root, ...rest) {
  const result = spawnSync('git', ['-C', root, ...rest], { encoding: 'utf8', timeout: 10000 });
  return result.status === 0 ? result.stdout.trim() : null;
}
const manifest = JSON.parse(readFileSync(option('--manifest', resolve(here, 'upstream-scripts.json')), 'utf8'));
const config = option('--config', resolve(homedir(), '.agents/pstack-upstream.json'));

// A tree comparison accepts a later upstream commit that leaves pstack/ unchanged; uncommitted edits still count as drift.
function inspect(source, path) {
  if (!path) return null;
  const root = resolve(path);
  if (!existsSync(resolve(root, 'skills/poteto-mode/SKILL.md'))) return { source, root, status: 'INVALID', reason: 'No skills/poteto-mode/SKILL.md under this root.' };
  const real = realpathSync(root);
  const prefix = git(real, 'rev-parse', '--show-prefix');
  if (prefix === null) return { source, root: real, status: 'UNVERIFIED', reason: 'Not a Git checkout; the commit cannot be compared.' };
  const current = git(real, 'rev-parse', `HEAD:${prefix}`);
  const pinned = git(real, 'rev-parse', `${manifest.commit}:${prefix}`);
  if (!pinned) return { source, root: real, status: 'UNVERIFIED', reason: `The checkout lacks commit ${manifest.commit}.` };
  if (current !== pinned) return { source, root: real, status: 'MISMATCH', head: git(real, 'rev-parse', 'HEAD'), reason: `The pstack tree differs from ${manifest.commit}.` };
  if (git(real, 'status', '--porcelain', '--', '.')) return { source, root: real, status: 'MISMATCH', head: git(real, 'rev-parse', 'HEAD'), reason: 'The pstack tree has uncommitted changes.' };
  return { source, root: real, status: 'MATCHED' };
}

let configured = null;
if (existsSync(config)) {
  try { configured = JSON.parse(readFileSync(config, 'utf8')).root ?? null; } catch { configured = null; }
}
const candidates = [
  inspect('request', option('--root')),
  inspect('config', configured),
  inspect('submodule', option('--submodule', resolve(here, '../../../upstream/plugins/pstack'))),
].filter(candidate => candidate && !(candidate.source === 'submodule' && candidate.status === 'INVALID'));

const usable = candidates.filter(candidate => candidate.status !== 'INVALID');
const explicit = usable.find(candidate => candidate.source === 'request');
const matched = usable.find(candidate => candidate.status === 'MATCHED');
const selected = explicit ?? matched ?? usable.find(candidate => candidate.status === 'UNVERIFIED') ?? usable[0] ?? null;
const notes = [];
const stale = usable.find(candidate => candidate.source === 'config' && candidate.status === 'MISMATCH');
if (stale && selected && selected !== stale) notes.push(`${config} points at a different upstream. Remove it or point it at ${selected.root}.`);
const invalid = candidates.find(candidate => candidate.source === 'request' && candidate.status === 'INVALID');
if (invalid && selected) notes.push(`The requested root is not a pstack root. Selected ${selected.root} instead.`);
if (!selected) notes.push('No upstream root found. Initialize the submodule or record a root.');
else if (selected.status === 'MISMATCH') notes.push('Report the version gap before you follow upstream instructions from this root.');

const status = selected?.status ?? 'MISSING';
console.log(JSON.stringify({ commit: manifest.commit, status, selected: selected?.root ?? null, candidates, notes }, null, 2));
process.exitCode = status === 'MATCHED' || status === 'UNVERIFIED' ? 0 : 2;
