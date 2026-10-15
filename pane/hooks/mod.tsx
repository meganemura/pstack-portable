// pstack-pane's hooks module: keeps the session's Run in $.state, rebuilt from the transcript at
// session.start and turn.complete and folded per finished tool call between them, and draws it
// in a pane with a preview of the selected artifact. What a tool use means for the Run is
// run.ts's business; this module does not know any tool's or artifact's name.

import { atom, read, update } from 'claude-code'
import type { AgentStatus, Elements, EngineInterface, Register, SessionMessage, ToolCallResult } from 'claude-code'

import type { Delegate, Preview, Run, Step } from '../types'
import { emptyRun, foldUse, labelOf, previewOf, relativeTo, runOf, settleDelegates } from './run'
import type { Use } from './run'

const PANE = 'pstack-pane'
const TITLE = 'pstack'
const AUTO_OPEN = 'autoOpen'
const TABLE_ROWS = 200
const EMPTY = 'No poteto-mode run in this session.'

const runAtom = atom({ plugin: 'pstack-pane', key: 'run' } as const, emptyRun())
const previewAtom = atom({ plugin: 'pstack-pane', key: 'preview' } as const, null)
const cwdAtom = atom({ plugin: 'pstack-pane', key: 'cwd' } as const, '')
const autoOpenedAtom = atom({ plugin: 'pstack-pane', key: 'hasAutoOpened' } as const, false)

// The elements all three drawing surfaces carry: a prop one of them lacks does not type-check.
type Kit = Pick<Elements['terminal' | 'desktop' | 'mobile'], 'Box' | 'Text' | 'Button' | 'Markdown' | 'Code'>

const MARKS: Readonly<Record<Step['status'], string>> = { completed: '[x]', in_progress: '[>]', pending: '[ ]' }

const AGENT_STATES: Readonly<Record<AgentStatus, Delegate['state']>> = {
  pending: 'running',
  running: 'running',
  waiting: 'running',
  idle: 'running',
  completed: 'done',
  failed: 'failed',
  killed: 'failed',
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    try {
      await update($, cwdAtom, () => e.cwd)
      await $.command.register({ name: 'pstack-pane', description: 'Show or hide the pane of the poteto-mode run in this session' })
      await rebuild($)
    } catch (error) {
      logFailure($, 'session.start', error)
    }
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const result = await next(e)
    try {
      await foldCall($, e, result)
    } catch (error) {
      logFailure($, 'tool.call', error)
    }
    return result
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    try {
      await rebuild($)
      const preview = await read($, previewAtom)
      if (preview !== null) await loadPreview($, preview.path)
    } catch (error) {
      logFailure($, 'turn.complete', error)
    }
    return result
  })

  on('ui.close', { id: PANE }, async ($, e, next) => {
    const result = await next(e)
    try {
      if (e.origin.kind !== 'unload') await $.store.set(AUTO_OPEN, false)
      await syncStatus($, await read($, runAtom))
    } catch (error) {
      logFailure($, 'ui.close', error)
    }
    return result
  }).catch(($, e, next) => next(e))

  on('command.run', { command: 'pstack-pane' }, async $ => {
    try {
      if (await isShown($)) {
        await $.ui.close({ id: PANE })
        return { text: 'pstack-pane hidden.' }
      }
      await $.store.set(AUTO_OPEN, true)
      const opened = await $.ui.open({ id: PANE, title: TITLE })
      const run = await read($, runAtom)
      await syncStatus($, run)
      return { text: opened.isPlaced ? 'pstack-pane shown.' : summaryOf(run, await read($, cwdAtom)) }
    } catch (error) {
      logFailure($, 'command.run', error)
      return { text: `pstack-pane: ${messageOf(error)}` }
    }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e, next) => {
    if (e.surface !== 'terminal' && e.surface !== 'desktop' && e.surface !== 'mobile') return next(e)
    const kit: Kit = $.ui.resolve(e)
    const run = await read($, runAtom)
    const preview = await read($, previewAtom)
    const cwd = await read($, cwdAtom)
    return paneOf(kit, $, { run, preview, cwd, columns: e.props.bodyColumns })
  })
}

async function rebuild($: EngineInterface): Promise<void> {
  const cwd = await read($, cwdAtom)
  const uses = await usesOf($, await $.session.messages(), undefined, new Set())
  const run = settleDelegates(runOf(uses, cwd), await agentStatesOf($))
  await update($, runAtom, () => run)
  await afterRunChanged($, run)
}

// Each delegate's uses follow the Agent use that started it, so its artifacts are as new as that.
async function usesOf($: EngineInterface, messages: readonly SessionMessage[], loop: string | undefined, seen: Set<string>): Promise<Use[]> {
  const uses: Use[] = []
  for (const message of messages) {
    for (const summary of message.toolUses) {
      uses.push({ ...summary, loop })
      const child = summary.agentId
      if (child === undefined || seen.has(child)) continue
      seen.add(child)
      try {
        const rows = await $.session.messages({ agentId: child })
        if (Array.isArray(rows)) uses.push(...(await usesOf($, rows, child, seen)))
      } catch {
        // One agent whose transcript cannot be read leaves the rest of the Run intact.
      }
    }
  }
  return uses
}

async function agentStatesOf($: EngineInterface): Promise<Record<string, Delegate['state']>> {
  try {
    const agents = await $.agent.list()
    return Object.fromEntries(agents.map(agent => [agent.id, AGENT_STATES[agent.status]]))
  } catch {
    return {}
  }
}

async function foldCall($: EngineInterface, e: Readonly<Record<string, unknown>> & { tool: string; agentId?: string }, result: ToolCallResult): Promise<void> {
  const { tool, tool_use_id: id, agentId: loop, requestMeta: _meta, ...input } = e
  const isError = result.deny !== undefined || result.isError === true
  const use: Use = {
    tool,
    tool_use_id: typeof id === 'string' ? id : '',
    input,
    result: result.result,
    text: result.deny ?? result.text,
    ...(isError ? { isError: true } : {}),
    loop,
  }
  const cwd = await read($, cwdAtom)
  const before = await read($, runAtom)
  if (foldUse(before, use, cwd) === before) return
  const after = await update($, runAtom, run => foldUse(run, use, cwd))
  const preview = await read($, previewAtom)
  if (preview !== null && seqOf(after, preview.path) !== seqOf(before, preview.path)) await loadPreview($, preview.path)
  await afterRunChanged($, after)
}

async function afterRunChanged($: EngineInterface, run: Run): Promise<void> {
  if (run.entry !== null && !(await read($, autoOpenedAtom))) {
    await update($, autoOpenedAtom, () => true)
    if ((await $.store.get(AUTO_OPEN)) !== false) await $.ui.open({ id: PANE, title: TITLE })
  }
  await syncStatus($, run)
}

async function syncStatus($: EngineInterface, run: Run): Promise<void> {
  const isActive = run.entry !== null && !(await isShown($))
  $.ui.status(isActive ? `pstack: ${run.playbook ?? run.entry} · ${run.artifacts.length} artifacts (/pstack-pane)` : undefined)
}

async function isShown($: EngineInterface): Promise<boolean> {
  return (await $.ui.panes()).some(pane => pane.id === PANE && pane.isPlaced)
}

async function loadPreview($: EngineInterface, path: string): Promise<void> {
  let preview: Preview
  if (previewOf(path).mode === 'none') {
    preview = { path, error: 'No text preview for this file.' }
  } else {
    try {
      preview = { path, text: await $.fs.read(path) }
    } catch (error) {
      preview = { path, error: messageOf(error) }
    }
  }
  await update($, previewAtom, () => preview)
}

type PaneData = { run: Run; preview: Preview | null; cwd: string; columns: number }

function paneOf(kit: Kit, $: EngineInterface, { run, preview, cwd, columns }: PaneData) {
  const { Box, Text, Button } = kit
  if (run.entry === null) {
    return (
      <Box flexDirection="column" width={columns}>
        <Text dimColor>{EMPTY}</Text>
      </Box>
    )
  }
  return (
    <Box flexDirection="column" width={columns}>
      <Text bold>Run</Text>
      <Text>Entry: {run.entry}</Text>
      <Text>Playbook: {run.playbook ?? 'not read yet'}</Text>
      {run.skills.length > 0 && <Text>Skills: {run.skills.join(', ')}</Text>}
      <Box marginTop={1}>
        <Text bold>Steps</Text>
      </Box>
      {run.steps.length === 0 && <Text dimColor>No steps yet.</Text>}
      {run.steps.map(step => (
        <Text key={`step:${step.id}`} dimColor={step.status === 'completed'}>
          {MARKS[step.status]} {step.subject}
        </Text>
      ))}
      <Box marginTop={1}>
        <Text bold>Delegates</Text>
      </Box>
      {run.delegates.length === 0 && <Text dimColor>No delegates yet.</Text>}
      {run.delegates.map(delegate => (
        <Text key={`delegate:${delegate.id}`}>
          {delegate.state} {delegate.description} <Text dimColor>({delegate.agentType})</Text>
        </Text>
      ))}
      <Box marginTop={1}>
        <Text bold>Artifacts</Text>
      </Box>
      {run.artifacts.length === 0 && <Text dimColor>No artifacts yet.</Text>}
      {run.artifacts.map(artifact => (
        <Box key={`row:${artifact.path}`} flexDirection="row">
          <Text>{artifact.path === preview?.path ? '> ' : '  '}</Text>
          <Button
            key={`artifact:${artifact.path}`}
            plain
            label={`${labelOf(artifact.kind)}  ${relativeTo(artifact.path, cwd)}`}
            onPress={() => loadPreview($, artifact.path)}
          />
        </Box>
      ))}
      {preview !== null && previewBoxOf(kit, preview, cwd)}
    </Box>
  )
}

function previewBoxOf(kit: Kit, preview: Preview, cwd: string) {
  const { Box, Text, Markdown, Code } = kit
  const as = previewOf(preview.path)
  let body
  if ('error' in preview) body = <Text color="error">{preview.error}</Text>
  else if (as.mode === 'table') body = <Markdown key="preview" text={tableOf(preview.text)} />
  else if (as.mode === 'markdown') body = <Markdown key="preview" text={preview.text} />
  else body = <Code source={preview.text} language={as.mode === 'code' ? as.language : 'text'} />
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text dimColor>{relativeTo(preview.path, cwd)}</Text>
      {body}
    </Box>
  )
}

function tableOf(tsv: string): string {
  const [head, ...body] = tsv.split(/\r?\n/).filter(line => line !== '')
  if (head === undefined) return '_Empty file._'
  const kept = body.slice(-TABLE_ROWS)
  const width = Math.max(...[head, ...kept].map(line => line.split('\t').length))
  const rowOf = (line: string) => {
    const cells = line.split('\t')
    const padded = [...cells, ...Array<string>(width - cells.length).fill('')]
    return `| ${padded.map(cell => cell.replace(/\|/g, '\\|')).join(' | ')} |`
  }
  const table = [rowOf(head), `|${' --- |'.repeat(width)}`, ...kept.map(rowOf)].join('\n')
  return kept.length < body.length ? `${table}\n\nShowing the last ${kept.length} of ${body.length} rows.` : table
}

function summaryOf(run: Run, cwd: string): string {
  if (run.entry === null) return EMPTY
  const done = run.steps.filter(step => step.status === 'completed').length
  const lines = [
    `pstack run: ${run.entry}, playbook ${run.playbook ?? 'not read yet'}`,
    ...(run.skills.length > 0 ? [`Skills: ${run.skills.join(', ')}`] : []),
    `Steps: ${done} of ${run.steps.length} done`,
    ...run.steps.map(step => `  ${MARKS[step.status]} ${step.subject}`),
    `Delegates: ${run.delegates.length}`,
    ...run.delegates.map(delegate => `  ${delegate.state} ${delegate.description} (${delegate.agentType})`),
    `Artifacts: ${run.artifacts.length}`,
    ...run.artifacts.map(artifact => `  ${labelOf(artifact.kind)}  ${relativeTo(artifact.path, cwd)}`),
  ]
  return lines.join('\n')
}

function seqOf(run: Run, path: string): number | undefined {
  return run.artifacts.find(artifact => artifact.path === path)?.seq
}

function logFailure($: EngineInterface, where: string, error: unknown): void {
  $.ui.log(`pstack-pane: ${where} failed: ${messageOf(error)}`, { to: 'debug' })
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
