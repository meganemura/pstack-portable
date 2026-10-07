// Select the upstream pstack root and compare it with the fingerprinted commit. Reads files and Git state only; never fetches or edits.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
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
const treePath = option('--tree', resolve(here, 'upstream-tree.json'));
const tree = existsSync(treePath) ? JSON.parse(readFileSync(treePath, 'utf8')) : null;

// Plugin caches and copies drop .git, so compare each pinned file by its Git blob hash. Extra files, such as node_modules, do not count.
function blob(path) {
  const content = readFileSync(path);
  return createHash('sha1').update(`blob ${content.length}\0`).update(content).digest('hex');
}
function compareFiles(source, root, why) {
  if (!tree || tree.commit !== manifest.commit) return { source, root, status: 'UNVERIFIED', reason: `${why} No file list for ${manifest.commit}.` };
  const changed = Object.entries(tree.files).filter(([path, sha]) => !existsSync(resolve(root, path)) || blob(resolve(root, path)) !== sha).map(([path]) => path);
  if (changed.length) return { source, root, status: 'MISMATCH', reason: `${changed.length} pinned files are missing or differ, such as ${changed.slice(0, 3).join(', ')}.` };
  return { source, root, status: 'MATCHED', reason: `${why} All ${Object.keys(tree.files).length} pinned files match.` };
}

// A tree comparison accepts a later upstream commit that leaves pstack/ unchanged; uncommitted edits still count as drift.
function inspect(source, path) {
  if (!path) return null;
  const root = resolve(path);
  if (!existsSync(resolve(root, 'skills/poteto-mode/SKILL.md'))) return { source, root, status: 'INVALID', reason: 'No skills/poteto-mode/SKILL.md under this root.' };
  const real = realpathSync(root);
  const prefix = git(real, 'rev-parse', '--show-prefix');
  if (prefix === null) return compareFiles(source, real, 'Not a Git checkout.');
  const current = git(real, 'rev-parse', `HEAD:${prefix}`);
  const pinned = git(real, 'rev-parse', `${manifest.commit}:${prefix}`);
  if (!pinned) return compareFiles(source, real, `The checkout lacks commit ${manifest.commit}.`);
  if (current !== pinned) return { source, root: real, status: 'MISMATCH', head: git(real, 'rev-parse', 'HEAD'), reason: `The pstack tree differs from ${manifest.commit}.` };
  if (git(real, 'status', '--porcelain', '--', '.')) return { source, root: real, status: 'MISMATCH', head: git(real, 'rev-parse', 'HEAD'), reason: 'The pstack tree has uncommitted changes.' };
  return { source, root: real, status: 'MATCHED' };
}

// Claude Code and Codex cache each plugin at <marketplace>/<plugin>/<version>, so the pinned upstream plugin sits beside this one.
function pluginRoots() {
  const parent = option('--plugins', resolve(here, '../../../../../pstack'));
  if (!existsSync(parent)) return [];
  return readdirSync(parent, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => resolve(parent, entry.name));
}

let configured = null;
if (existsSync(config)) {
  try { configured = JSON.parse(readFileSync(config, 'utf8')).root ?? null; } catch { configured = null; }
}
const candidates = [
  inspect('request', option('--root')),
  inspect('config', configured),
  inspect('submodule', option('--submodule', resolve(here, '../../../upstream/plugins/pstack'))),
  ...pluginRoots().map(path => inspect('plugin', path)),
].filter(candidate => candidate && !(['submodule', 'plugin'].includes(candidate.source) && candidate.status === 'INVALID'));

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
