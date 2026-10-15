// The Run of a poteto-mode session, derived from its tool uses by a pure reducer, and the
// registry that names which files are artifacts and how each is previewed.
// It knows nothing of `$`, the pane, the file system or the clock: a tool use in, a Run out.

import type { Artifact, ArtifactKind, Delegate, Run, RunEntry, Step } from '../types'

/** One finished tool use, shaped as `$.session.messages()` reports it (ToolUseSummary). */
export type Use = {
  tool: string
  tool_use_id: string
  input: Readonly<Record<string, unknown>>
  result?: unknown
  text?: string
  isError?: true
  /** On an Agent use: the id of the agent it spawned. */
  agentId?: string
  /** The agent loop that made the call; absent on the main loop. */
  loop?: string
}

export type PreviewMode = 'table' | 'markdown' | 'code' | 'by-extension'

export type RegistryRow = { kind: ArtifactKind; label: string; pattern: RegExp; preview: PreviewMode; language?: string }

export type PreviewAs = { mode: 'table' } | { mode: 'markdown' } | { mode: 'code'; language: string } | { mode: 'none' }

// First match wins, so the rows that name an exact file come before the folder rows, and `plan`
// (a loose name match) comes last.
export const REGISTRY: readonly RegistryRow[] = [
  { kind: 'decision-trail', label: 'decision trail', pattern: /(?:\/decisions?\.tsv|\/\.audit\/[^/]+\.tsv)$/, preview: 'table' },
  { kind: 'standing-orders', label: 'standing orders', pattern: /\/orchestrate\/[^/]+\/preferences\.md$/, preview: 'markdown' },
  { kind: 'status', label: 'status', pattern: /\/orchestrate\/[^/]+\/status\.md$/, preview: 'markdown' },
  { kind: 'human-gates', label: 'human gates', pattern: /\/orchestrate\/[^/]+\/gates\.md$/, preview: 'markdown' },
  { kind: 'units', label: 'units', pattern: /\/orchestrate\/[^/]+\/units\.tsv$/, preview: 'table' },
  { kind: 'ledger', label: 'ledger', pattern: /\/orchestrate\/[^/]+\/ledger\.tsv$/, preview: 'table' },
  { kind: 'frontier', label: 'frontier', pattern: /\/orchestrate\/[^/]+\/frontier\.json$/, preview: 'code', language: 'json' },
  { kind: 'overview', label: 'overview', pattern: /\/orchestrate\/[^/]+\/overview\.md$/, preview: 'markdown' },
  { kind: 'resume-note', label: 'resume note', pattern: /\/[^/]+-resume\.md$/, preview: 'markdown' },
  { kind: 'arena-candidate', label: 'arena candidate', pattern: /\/arena-[^/]+\/.+$/, preview: 'by-extension' },
  { kind: 'swarm-output', label: 'swarm output', pattern: /\/swarm-[^/]+\/.+$/, preview: 'by-extension' },
  // `plan` must start a word of the name, so `explanation.md` is not a plan.
  { kind: 'plan', label: 'plan', pattern: /\/(?:[^/]*[^/a-z])?plan[^/]*\.md$/i, preview: 'markdown' },
]

const LANGUAGES: Readonly<Record<string, string>> = {
  json: 'json',
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  mjs: 'javascript',
  py: 'python',
  sh: 'bash',
  yml: 'yaml',
  yaml: 'yaml',
  html: 'html',
  css: 'css',
}

const BINARY = /\.(?:png|jpe?g|gif|webp|bmp|ico|pdf|zip|gz|tgz|mp4|mov|wasm)$/i

const ENTRY_SKILL = /(?:^|[:/])(poteto-mode-portable|poteto-mode)$/
const ENTRY_READ = /\/(poteto-mode-portable|poteto-mode)\/SKILL\.md$/
const PLAYBOOK_READ = /\/poteto-mode\/playbooks\/([^/]+)\.md$/
const UPSTREAM_SKILL_READ = /\/pstack\/(?:[^/]+\/)*skills\/([^/]+)\/SKILL\.md$/
const ENTRIES: readonly string[] = ['poteto-mode-portable', 'poteto-mode']

export function emptyRun(): Run {
  return { entry: null, playbook: null, skills: [], steps: [], delegates: [], artifacts: [] }
}

export function rowOf(path: string): RegistryRow | undefined {
  return REGISTRY.find(row => row.pattern.test(path))
}

export function kindOf(path: string): ArtifactKind | null {
  return rowOf(path)?.kind ?? null
}

export function labelOf(kind: ArtifactKind): string {
  return REGISTRY.find(row => row.kind === kind)?.label ?? kind
}

export function previewOf(path: string): PreviewAs {
  const row = rowOf(path)
  if (row === undefined) return { mode: 'none' }
  if (row.preview === 'table' || row.preview === 'markdown') return { mode: row.preview }
  if (row.preview === 'code') return { mode: 'code', language: row.language ?? 'text' }
  if (BINARY.test(path)) return { mode: 'none' }
  const extension = /\.([^./]+)$/.exec(path)?.[1]?.toLowerCase() ?? ''
  if (extension === 'tsv') return { mode: 'table' }
  if (extension === 'md') return { mode: 'markdown' }
  return { mode: 'code', language: LANGUAGES[extension] ?? 'text' }
}

export function resolvePath(path: string, cwd: string): string {
  const joined = path.startsWith('/') ? path : `${cwd}/${path}`
  const parts: string[] = []
  for (const part of joined.split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') parts.pop()
    else parts.push(part)
  }
  return `/${parts.join('/')}`
}

export function relativeTo(path: string, cwd: string): string {
  const root = cwd.endsWith('/') ? cwd : `${cwd}/`
  return path.startsWith(root) ? path.slice(root.length) : path
}

export function runOf(uses: readonly Use[], cwd: string): Run {
  return uses.reduce((run, use) => foldUse(run, use, cwd), emptyRun())
}

export function foldUse(run: Run, use: Use, cwd: string): Run {
  if (use.isError) return use.tool === 'Agent' || use.tool === 'Task' ? withDelegate(run, use) : run
  switch (use.tool) {
    case 'Skill':
      return withSkillCall(run, stringOf(use.input.skill))
    case 'Read':
      return withRead(run, resolvedOf(use.input.file_path, cwd))
    case 'TodoWrite':
      return use.loop === undefined ? withTodos(run, use.input.todos) : run
    case 'TaskCreate':
      return use.loop === undefined ? withTaskCreated(run, use) : run
    case 'TaskUpdate':
      return use.loop === undefined ? withTaskUpdated(run, use.input) : run
    case 'Agent':
    case 'Task':
      return withDelegate(run, use)
    case 'Write':
    case 'Edit':
    case 'MultiEdit':
      return touched(run, [resolvedOf(use.input.file_path, cwd)])
    case 'NotebookEdit':
      return touched(run, [resolvedOf(use.input.notebook_path, cwd)])
    case 'Bash':
      return touched(run, pathTokensOf(stringOf(use.input.command)).map(token => resolvePath(token, cwd)))
    default:
      return run
  }
}

/** Gives delegates the state the engine reports now, by delegate id; ids not listed keep theirs. */
export function settleDelegates(run: Run, states: Readonly<Record<string, Delegate['state']>>): Run {
  const delegates = run.delegates.map(one => {
    const state = states[one.id]
    return state === undefined || state === one.state ? one : { ...one, state }
  })
  return { ...run, delegates }
}

function withSkillCall(run: Run, skill: string): Run {
  const entry = ENTRY_SKILL.exec(skill)?.[1]
  return entry === undefined || run.entry !== null ? run : { ...run, entry: entry as RunEntry }
}

function withRead(run: Run, path: string): Run {
  let next = run
  const entry = ENTRY_READ.exec(path)?.[1]
  if (entry !== undefined && next.entry === null) next = { ...next, entry: entry as RunEntry }
  const playbook = PLAYBOOK_READ.exec(path)?.[1]
  if (playbook !== undefined) next = { ...next, playbook }
  const skill = UPSTREAM_SKILL_READ.exec(path)?.[1]
  if (skill !== undefined && !ENTRIES.includes(skill) && !next.skills.includes(skill)) {
    next = { ...next, skills: [...next.skills, skill] }
  }
  return next
}

// TodoWrite rewrites the whole todo list, so its steps replace the previous TodoWrite's and leave
// TaskCreate's steps in place.
function withTodos(run: Run, todos: unknown): Run {
  if (!Array.isArray(todos)) return run
  const steps: Step[] = todos.flatMap((todo: unknown, index): Step[] => {
    const subject = stringOf(fieldOf(todo, 'content'))
    const status = statusOf(fieldOf(todo, 'status'))
    return subject === '' || status === undefined ? [] : [{ id: `todo-${index + 1}`, subject, status }]
  })
  return { ...run, steps: [...run.steps.filter(step => !step.id.startsWith('todo-')), ...steps] }
}

function withTaskCreated(run: Run, use: Use): Run {
  // A subagent's transcript stores no result record, only the text the model read.
  const id = stringOf(fieldOf(fieldOf(use.result, 'task'), 'id')) || (/#(\w+)/.exec(use.text ?? '')?.[1] ?? '')
  const subject = stringOf(use.input.subject)
  if (id === '' || subject === '') return run
  const step: Step = { id, subject, status: 'pending' }
  return { ...run, steps: replaceOrAppend(run.steps, step) }
}

function withTaskUpdated(run: Run, input: Use['input']): Run {
  const id = stringOf(input.taskId)
  if (input.status === 'deleted') return { ...run, steps: run.steps.filter(step => step.id !== id) }
  const status = statusOf(input.status)
  const subject = stringOf(input.subject)
  const steps = run.steps.map(step =>
    step.id !== id ? step : { ...step, ...(status === undefined ? {} : { status }), ...(subject === '' ? {} : { subject }) },
  )
  return { ...run, steps }
}

function withDelegate(run: Run, use: Use): Run {
  const id = use.agentId ?? (stringOf(fieldOf(use.result, 'agentId')) || use.tool_use_id)
  const delegate: Delegate = {
    id,
    description: stringOf(use.input.description),
    agentType: stringOf(use.input.subagent_type) || 'general-purpose',
    state: delegateStateOf(use),
  }
  return { ...run, delegates: replaceOrAppend(run.delegates, delegate) }
}

function delegateStateOf(use: Use): Delegate['state'] {
  if (use.isError) return 'failed'
  const status = fieldOf(use.result, 'status')
  if (status === 'completed') return 'done'
  if (status !== undefined) return 'running'
  // No record (a subagent's transcript stores none): an answered call is a finished one.
  return use.result === undefined && use.text !== undefined ? 'done' : 'running'
}

function touched(run: Run, paths: readonly string[]): Run {
  let artifacts = run.artifacts
  for (const path of new Set(paths)) {
    const kind = kindOf(path)
    if (kind === null) continue
    const seq = artifacts.reduce((top, one) => Math.max(top, one.seq), 0) + 1
    const touches = (artifacts.find(one => one.path === path)?.touches ?? 0) + 1
    const artifact: Artifact = { path, kind, touches, seq }
    artifacts = [artifact, ...artifacts.filter(one => one.path !== path)]
  }
  return artifacts === run.artifacts ? run : { ...run, artifacts }
}

// The words of a shell command that could name a file: split at blanks and shell operators, with
// quotes and redirections taken off. Flags, assignments and expansions are left out.
function pathTokensOf(command: string): string[] {
  return command
    .split(/[\s;|&<>()]+/)
    .map(word => word.replace(/^['"]+|['"]+$/g, ''))
    .filter(word => word !== '' && !word.startsWith('-') && !/[$=`*?]/.test(word))
}

function replaceOrAppend<T extends { id: string }>(list: readonly T[], item: T): T[] {
  return list.some(one => one.id === item.id) ? list.map(one => (one.id === item.id ? item : one)) : [...list, item]
}

function resolvedOf(value: unknown, cwd: string): string {
  const path = stringOf(value)
  return path === '' ? '' : resolvePath(path, cwd)
}

function statusOf(value: unknown): Step['status'] | undefined {
  return value === 'pending' || value === 'in_progress' || value === 'completed' ? value : undefined
}

function fieldOf(value: unknown, key: string): unknown {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>)[key] : undefined
}

function stringOf(value: unknown): string {
  return typeof value === 'string' ? value : ''
}
