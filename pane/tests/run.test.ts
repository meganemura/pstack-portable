// Tests for run.ts: tool uses in, the Run a person would see out. The fixtures are made-up uses of
// a made-up run in /work, not taken from a real session.

import { describe, expect, test } from 'claude-code/testing'

import { kindOf, runOf } from '../hooks/run'
import type { Use } from '../hooks/run'

const CWD = '/work'
const PSTACK = '/home/u/.claude/plugins/cache/pstack-portable/pstack/0.15.25/skills'

const RUN_USES: Use[] = [
  { tool: 'Skill', tool_use_id: 'u1', input: { skill: 'pstack-portable:poteto-mode-portable' }, result: { success: true, commandName: 'poteto-mode-portable' } },
  { tool: 'Read', tool_use_id: 'u2', input: { file_path: `${PSTACK}/poteto-mode/playbooks/feature.md` }, text: '# Feature' },
  { tool: 'Read', tool_use_id: 'u3', input: { file_path: `${PSTACK}/principle-model-the-domain/SKILL.md` }, text: '# Model the domain' },
  {
    tool: 'TodoWrite',
    tool_use_id: 'u4',
    input: {
      todos: [
        { content: 'Frame the change', status: 'completed', activeForm: 'Framing the change' },
        { content: 'Build the pane', status: 'in_progress', activeForm: 'Building the pane' },
        { content: 'Verify on both surfaces', status: 'pending', activeForm: 'Verifying' },
      ],
    },
    result: {},
  },
  {
    tool: 'TaskCreate',
    tool_use_id: 'u5',
    input: { subject: 'Throughput checkpoint', description: 'Check the pace after the first unit' },
    result: { task: { id: '1', subject: 'Throughput checkpoint' } },
  },
  { tool: 'TaskUpdate', tool_use_id: 'u6', input: { taskId: '1', status: 'in_progress' }, result: { success: true, taskId: '1', updatedFields: ['status'] } },
  {
    tool: 'Agent',
    tool_use_id: 'u7',
    input: { description: 'Audit the reducer', prompt: 'Read run.ts', subagent_type: 'Explore' },
    result: { status: 'completed', agentId: 'agent-1', content: [] },
    text: 'No findings.',
    agentId: 'agent-1',
  },
  { tool: 'Agent', tool_use_id: 'u8', input: { description: 'Draft the README', prompt: 'Write it' } },
  { tool: 'Write', tool_use_id: 'u9', input: { file_path: '/work/.audit/pane.tsv', content: 'ts\tphase\n' }, result: {} },
  {
    tool: 'Bash',
    tool_use_id: 'u10',
    input: { command: `bash ${PSTACK}/show-me-your-work/scripts/log.sh decisions.tsv frame "split the reducer" "one place to read" run.ts ok` },
    result: {},
  },
  { tool: 'Write', tool_use_id: 'u11', input: { file_path: '/work/src/app.ts', content: 'export {}' }, result: {} },
  { tool: 'Write', tool_use_id: 'u12', input: { file_path: '/tmp/foo-resume.md', content: '# Resume' }, result: {} },
]

describe('runOf', () => {
  test('folds a poteto-mode run into its entry, playbook, skills, steps, delegates and artifacts', () => {
    expect(runOf(RUN_USES, CWD)).toStrictEqual({
      entry: 'poteto-mode-portable',
      playbook: 'feature',
      skills: ['principle-model-the-domain'],
      steps: [
        { id: 'todo-1', subject: 'Frame the change', status: 'completed' },
        { id: 'todo-2', subject: 'Build the pane', status: 'in_progress' },
        { id: 'todo-3', subject: 'Verify on both surfaces', status: 'pending' },
        { id: '1', subject: 'Throughput checkpoint', status: 'in_progress' },
      ],
      delegates: [
        { id: 'agent-1', description: 'Audit the reducer', agentType: 'Explore', state: 'done' },
        { id: 'u8', description: 'Draft the README', agentType: 'general-purpose', state: 'running' },
      ],
      artifacts: [
        { path: '/tmp/foo-resume.md', kind: 'resume-note', touches: 1, seq: 3 },
        { path: '/work/decisions.tsv', kind: 'decision-trail', touches: 1, seq: 2 },
        { path: '/work/.audit/pane.tsv', kind: 'decision-trail', touches: 1, seq: 1 },
      ],
    })
  })

  test('a session with no poteto-mode use has no entry', () => {
    const uses = RUN_USES.filter(use => use.tool !== 'Skill')
    expect(runOf(uses, CWD).entry).toBeNull()
  })

  test('reading the upstream poteto-mode SKILL.md starts a run with no Skill call', () => {
    const uses: Use[] = [{ tool: 'Read', tool_use_id: 'r1', input: { file_path: `${PSTACK}/poteto-mode/SKILL.md` }, text: '# poteto-mode' }]
    expect(runOf(uses, CWD).entry).toBe('poteto-mode')
  })

  test('a second touch moves the artifact to the front and counts it', () => {
    const uses: Use[] = [
      { tool: 'Write', tool_use_id: 'w1', input: { file_path: 'decisions.tsv', content: '' }, result: {} },
      { tool: 'Write', tool_use_id: 'w2', input: { file_path: '/work/plan.md', content: '' }, result: {} },
      { tool: 'Bash', tool_use_id: 'b1', input: { command: "printf 'x\\n' >>decisions.tsv" }, result: {} },
    ]
    expect(runOf(uses, CWD).artifacts).toStrictEqual([
      { path: '/work/decisions.tsv', kind: 'decision-trail', touches: 2, seq: 3 },
      { path: '/work/plan.md', kind: 'plan', touches: 1, seq: 2 },
    ])
  })

  test('a deleted task leaves the steps, and a failed Write touches nothing', () => {
    const uses: Use[] = [
      { tool: 'TaskCreate', tool_use_id: 't1', input: { subject: 'Ship', description: '' }, text: 'Task #7 created successfully: Ship' },
      { tool: 'TaskUpdate', tool_use_id: 't2', input: { taskId: '7', status: 'deleted' }, result: { success: true } },
      { tool: 'Write', tool_use_id: 'w1', input: { file_path: '/work/decisions.tsv', content: '' }, isError: true, text: 'denied' },
    ]
    const run = runOf(uses, CWD)
    expect(run.steps).toStrictEqual([])
    expect(run.artifacts).toStrictEqual([])
  })

  test("a subagent's TodoWrite does not replace the run's steps", () => {
    const uses: Use[] = [
      { tool: 'TodoWrite', tool_use_id: 'm1', input: { todos: [{ content: 'Main step', status: 'pending', activeForm: '' }] }, result: {} },
      { tool: 'TodoWrite', tool_use_id: 's1', input: { todos: [{ content: 'Sub step', status: 'pending', activeForm: '' }] }, result: {}, loop: 'agent-1' },
    ]
    expect(runOf(uses, CWD).steps).toStrictEqual([{ id: 'todo-1', subject: 'Main step', status: 'pending' }])
  })
})

describe('kindOf', () => {
  const ROWS: [string, ReturnType<typeof kindOf>][] = [
    ['/work/decisions.tsv', 'decision-trail'],
    ['/work/decision.tsv', 'decision-trail'],
    ['/work/.audit/pane.tsv', 'decision-trail'],
    ['/store/orchestrate/pane/preferences.md', 'standing-orders'],
    ['/store/orchestrate/pane/status.md', 'status'],
    ['/store/orchestrate/pane/gates.md', 'human-gates'],
    ['/store/orchestrate/pane/units.tsv', 'units'],
    ['/store/orchestrate/pane/ledger.tsv', 'ledger'],
    ['/store/orchestrate/pane/frontier.json', 'frontier'],
    ['/store/orchestrate/pane/overview.md', 'overview'],
    ['/work/docs/multi-phase-plan.md', 'plan'],
    ['/tmp/pane-resume.md', 'resume-note'],
    ['/tmp/arena-pane/candidate-1/notes.md', 'arena-candidate'],
    ['/tmp/swarm-42/worker-1/shot.png', 'swarm-output'],
    ['/work/src/app.ts', null],
    ['/work/docs/explanation.md', null],
  ]

  for (const [path, kind] of ROWS) {
    test(`${path} is ${kind ?? 'no artifact'}`, () => {
      expect(kindOf(path)).toBe(kind)
    })
  }
})
