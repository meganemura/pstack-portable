// Tests for mod.tsx, driven as a person and a session drive it: a stubbed transcript and file
// system beneath the plugin, then the pane mounted on a surface, a button pressed, the command
// run. The transcript is a made-up poteto-mode run in /work, not a real session.

import type { On, RenderPropsOf, SessionMessage, TurnCompleteInput } from 'claude-code'
import { describe, expect, test } from 'claude-code/testing'

const PLUGIN = 'pstack-pane'
const PSTACK = '/home/u/.claude/plugins/cache/pstack-portable/pstack/0.15.25/skills'
const SESSION = { surface: 'terminal', isInteractive: true, cwd: '/work' } as const
const RUN_COMMAND = { command: 'pstack-pane', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: true, columns: 160 } } as const
const TURN_COMPLETE: TurnCompleteInput = { answer: '', durationMs: 0, isAborted: false, turnId: 't1', reason: 'answer' }
const PANE_PROPS: RenderPropsOf['Pane'] = {
  title: 'pstack',
  isFocused: false,
  bodyColumns: 60,
  placement: 'dock',
  scroll: { offset: 0, bodyRows: 40 },
  view: {},
}

const MAIN: SessionMessage[] = [
  { role: 'user', text: 'Add the pane', toolUses: [] },
  {
    role: 'assistant',
    text: '',
    toolUses: [
      { tool_use_id: 'u1', tool: 'Skill', input: { skill: 'poteto-mode-portable' }, result: { success: true, commandName: 'poteto-mode-portable' }, text: 'Launching skill' },
      { tool_use_id: 'u2', tool: 'Read', input: { file_path: `${PSTACK}/poteto-mode/playbooks/feature.md` }, text: '# Feature' },
      {
        tool_use_id: 'u3',
        tool: 'TodoWrite',
        input: { todos: [{ content: 'Frame the change', status: 'in_progress', activeForm: 'Framing the change' }] },
        result: {},
        text: 'Todos updated',
      },
      {
        tool_use_id: 'u4',
        tool: 'Agent',
        input: { description: 'Audit the reducer', prompt: 'Read run.ts', subagent_type: 'Explore' },
        result: { status: 'completed', agentId: 'agent-1', content: [] },
        text: 'No findings.',
        agentId: 'agent-1',
      },
      {
        tool_use_id: 'u5',
        tool: 'Bash',
        input: { command: `bash ${PSTACK}/show-me-your-work/scripts/log.sh decisions.tsv frame "split the reducer" why evidence ok` },
        result: {},
        text: '',
      },
    ],
  },
]

const AGENT_1: SessionMessage[] = [
  {
    role: 'assistant',
    text: '',
    toolUses: [{ tool_use_id: 'a1', tool: 'Write', input: { file_path: '/work/orchestrate/pane/status.md', content: '# Status' }, text: 'Wrote it' }],
  },
]

const FILES: Record<string, string> = {
  '/work/decisions.tsv': 'ts\tphase\tdecision\n2026-10-15T00:00:00Z\tframe\tsplit the reducer | keep it pure\n',
  '/work/orchestrate/pane/status.md': '# Status\n\nOne unit left.\n',
}

type WorldOptions = { messages?: SessionMessage[]; store?: Record<string, unknown>; isPlaced?: boolean }

// What sits beneath the plugin: the transcript, the files, the panes, the store and the status
// line, each recorded for the test to read.
function world(on: On, options: WorldOptions = {}) {
  let messages = options.messages ?? []
  const open: string[] = []
  const opened: { id: string; focus?: true }[] = []
  const statuses: (string | undefined)[] = []
  const reads: string[] = []
  const store = new Map<string, unknown>(Object.entries(options.store ?? {}))
  const isPlaced = options.isPlaced ?? true

  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('turn.complete', ($, e) => ({ text: e.answer }))
  on('session.messages', ($, e) => {
    if (e.agentId === undefined) return { value: messages }
    return { value: e.agentId === 'agent-1' ? AGENT_1 : { deny: `no agent ${e.agentId}` } }
  })
  on('agent.list', () => ({ value: [] }))
  on('command.register', ($, e) => ({ value: { command: e.name } }))
  on('ui.open', ($, e) => {
    opened.push({ id: e.id, ...(e.focus ? { focus: e.focus } : {}) })
    if (!open.includes(e.id)) open.push(e.id)
    return { value: isPlaced ? { isPlaced: true } : { isPlaced: false, reason: 'no-surface: none attached' } }
  })
  on('ui.close', ($, e) => {
    open.splice(open.indexOf(e.id), 1)
    return { value: undefined }
  })
  on('ui.panes', () => ({
    value: open.map(id => ({ id, title: 'pstack', isShown: isPlaced, isFocused: false, isPlaced })),
  }))
  on('ui.status', ($, e) => {
    statuses.push(e.text)
    return { value: undefined }
  })
  on('ui.log', () => ({ value: undefined }))
  on('fs.read', ($, e) => {
    reads.push(e.path)
    const text = FILES[e.path]
    if (text === undefined) throw new Error(`ENOENT: ${e.path}`)
    return { value: text }
  })
  on('store.get', ($, e) => ({ value: store.get(e.key) }))
  on('store.set', ($, e) => {
    store.set(e.key, e.value)
    return { value: undefined }
  })

  return {
    open,
    opened,
    statuses,
    reads,
    store,
    setMessages: (next: SessionMessage[]) => {
      messages = next
    },
  }
}

describe('the pane', () => {
  for (const surface of ['terminal', 'desktop'] as const) {
    test(`on ${surface}, it shows the run and previews a pressed artifact`, async ($, on) => {
      const kept = world(on, { messages: MAIN })
      await $.session.start(SESSION)
      const ui = await $.ui.mount({ plugin: PLUGIN, surface, component: 'Pane', requestId: 'pstack-pane', props: PANE_PROPS })

      expect((await ui.find({ type: 'Text', text: 'Playbook:' }))?.text).toBe('Playbook: feature')
      expect((await ui.find({ type: 'Text', text: 'Frame the change' }))?.text).toBe('[>] Frame the change')
      expect((await ui.find({ type: 'Text', text: 'Audit the reducer' }))?.text).toBe('done Audit the reducer (Explore)')
      expect((await ui.find({ key: 'artifact:/work/decisions.tsv' }))?.text).toBe('decision trail  decisions.tsv')
      expect((await ui.find({ key: 'artifact:/work/orchestrate/pane/status.md' }))?.text).toBe('status  orchestrate/pane/status.md')

      await ui.press({ key: 'artifact:/work/decisions.tsv' })

      expect(kept.reads).toEqual(['/work/decisions.tsv'])
      expect((await ui.find({ key: 'row:/work/decisions.tsv' }))?.text).toBe('> decision trail  decisions.tsv')
      expect((await ui.find({ key: 'row:/work/orchestrate/pane/status.md' }))?.text).toBe('  status  orchestrate/pane/status.md')
      expect((await ui.find({ type: 'Markdown' }))?.text).toContain('| 2026-10-15T00:00:00Z | frame | split the reducer \\| keep it pure |')
      await ui.unmount()
    })
  }

  test('with no poteto-mode run, it draws the empty line alone', async ($, on) => {
    world(on, { messages: [{ role: 'user', text: 'hello', toolUses: [] }] })
    await $.session.start(SESSION)
    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'pstack-pane', props: PANE_PROPS })

    expect((await ui.findAll({ type: 'Text' })).map(found => found.text)).toEqual(['No poteto-mode run in this session.'])
  })

  test('a preview of Markdown draws as Markdown', async ($, on) => {
    world(on, { messages: MAIN })
    await $.session.start(SESSION)
    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'desktop', component: 'Pane', requestId: 'pstack-pane', props: PANE_PROPS })

    await ui.press({ key: 'artifact:/work/orchestrate/pane/status.md' })

    expect((await ui.find({ type: 'Markdown' }))?.text).toBe('# Status\n\nOne unit left.\n')
  })

  test('an artifact written by a finished tool call appears before the turn ends', async ($, on) => {
    world(on, { messages: MAIN })
    on('tool.call', () => ({ result: { type: 'create', filePath: '/work/plan.md', content: '# Plan', structuredPatch: [], originalFile: null } }))
    await $.session.start(SESSION)

    await $.tool.call({ tool: 'Write', file_path: '/work/plan.md', content: '# Plan' })

    const ui = await $.ui.mount({ plugin: PLUGIN, surface: 'terminal', component: 'Pane', requestId: 'pstack-pane', props: PANE_PROPS })
    expect((await ui.findAll({ type: 'Button' })).map(found => found.text)).toEqual([
      'plan  plan.md',
      'decision trail  decisions.tsv',
      'status  orchestrate/pane/status.md',
    ])
  })
})

describe('opening and closing', () => {
  test('a run opens the pane once, without focus', async ($, on) => {
    const kept = world(on, { messages: [] })
    await $.session.start(SESSION)
    expect(kept.opened).toEqual([])

    kept.setMessages(MAIN)
    await $.turn.complete(TURN_COMPLETE)
    await $.turn.complete(TURN_COMPLETE)

    expect(kept.opened).toEqual([{ id: 'pstack-pane' }])
  })

  test('/pstack-pane closes the open pane and opens it again; the store follows', async ($, on) => {
    const kept = world(on, { messages: MAIN })
    await $.session.start(SESSION)
    expect(kept.open).toEqual(['pstack-pane'])

    expect((await $.command.run(RUN_COMMAND)).text).toBe('pstack-pane hidden.')
    expect(kept.open).toEqual([])
    expect(kept.store.get('autoOpen')).toBe(false)
    expect(kept.statuses.at(-1)).toBe('pstack: feature · 2 artifacts (/pstack-pane)')

    expect((await $.command.run(RUN_COMMAND)).text).toBe('pstack-pane shown.')
    expect(kept.open).toEqual(['pstack-pane'])
    expect(kept.store.get('autoOpen')).toBe(true)
    expect(kept.statuses.at(-1)).toBeUndefined()
  })

  test('with autoOpen false, a run leaves the pane closed and names itself on the status line', async ($, on) => {
    const kept = world(on, { messages: MAIN, store: { autoOpen: false } })
    await $.session.start(SESSION)

    expect(kept.opened).toEqual([])
    expect(kept.statuses.at(-1)).toBe('pstack: feature · 2 artifacts (/pstack-pane)')
  })

  test('where no surface places the pane, /pstack-pane answers with a summary', async ($, on) => {
    world(on, { messages: MAIN, isPlaced: false })
    await $.session.start(SESSION)

    expect((await $.command.run(RUN_COMMAND)).text).toBe(
      [
        'pstack run: poteto-mode-portable, playbook feature',
        'Steps: 0 of 1 done',
        '  [>] Frame the change',
        'Delegates: 1',
        '  done Audit the reducer (Explore)',
        'Artifacts: 2',
        '  decision trail  decisions.tsv',
        '  status  orchestrate/pane/status.md',
      ].join('\n'),
    )
  })
})
