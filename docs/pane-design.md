# pstack-pane: a pane for the intermediate artifacts of a poteto-mode run

## Decision

A poteto-mode run leaves a trail of intermediate artifacts.
The playbook steps go to the task list, subagents run in the background, and files such as `decisions.tsv`, a plan, an Orchestrate store, or a resume note appear on disk.
The person sees these only by scrolling the transcript or by opening each file.
`pstack-pane` is a Claude Code mod that collects them in one pane beside the transcript.

The pane shows four sections, in this order:

1. **Run.** The entry skill that started the run, the selected playbook, and the upstream skills that the run read.
2. **Steps.** The task list, with each status. The playbook steps and the throughput checkpoint live there.
3. **Delegates.** Each subagent that the run started, with its description, type, and state.
4. **Artifacts.** Each known artifact file, newest first. A press on an artifact shows its content below the list.

## Data shape

The mod derives one value, `Run`, from the tool uses of the session.
A pure reducer folds tool uses into `Run`. The reducer does not know about `$`, the pane, or the file system.

```ts
type Run = {
  entry: 'poteto-mode-portable' | 'poteto-mode' | null // null: no poteto-mode run in this session
  playbook: string | null                                // e.g. 'feature', from playbooks/<name>.md
  skills: string[]                                       // upstream skill names read, first read first
  steps: Step[]
  delegates: Delegate[]
  artifacts: Artifact[]                                  // newest touch first
}
type Step = { id: string; subject: string; status: 'pending' | 'in_progress' | 'completed' }
type Delegate = { id: string; description: string; agentType: string; state: 'running' | 'done' | 'failed' }
type Artifact = { path: string; kind: ArtifactKind; touches: number; seq: number }
```

`ArtifactKind` comes from one registry table of path patterns, not from branches in the reducer.
Each row names a kind, a label, a pattern, and how the preview draws the file (TSV as a table, Markdown, or code).

| Kind | Pattern (absolute path) | Source in upstream |
| --- | --- | --- |
| decision trail | `decisions.tsv`, `decision.tsv`, `.audit/<slug>.tsv` | show-me-your-work, hillclimb |
| standing orders | `orchestrate/<slug>/preferences.md` | orchestrate |
| status | `orchestrate/<slug>/status.md` | orchestrate |
| human gates | `orchestrate/<slug>/gates.md` | orchestrate |
| units | `orchestrate/<slug>/units.tsv` | orchestrate |
| ledger | `orchestrate/<slug>/ledger.tsv` | orchestrate |
| frontier | `orchestrate/<slug>/frontier.json` | orchestrate |
| overview | `orchestrate/<slug>/overview.md` | orchestrate |
| plan | a Markdown file whose name contains `plan` | multi-phase plan |
| resume note | `<slug>-resume.md` | pause safely |
| arena candidate | a file under `arena-<slug>/` | arena |
| swarm output | a file under `swarm-<id>/` | swarm |

## Sources

The reducer reads these tool uses:

- `Skill` with a skill name that ends in `poteto-mode-portable` or `poteto-mode` starts the run.
- `Read` of `poteto-mode-portable/SKILL.md` or upstream `poteto-mode/SKILL.md` also starts the run. The wrapper reads upstream files by path, so a run can start with no `Skill` call.
- `Read` of `poteto-mode/playbooks/<name>.md` sets the playbook. `Read` of `<skill>/SKILL.md` under the pstack tree adds the skill.
- `TodoWrite`, `TaskCreate`, and `TaskUpdate` maintain the steps.
- `Agent` (or `Task`) adds a delegate. Its state comes from the result.
- `Write`, `Edit`, `MultiEdit`, and `NotebookEdit` touch the path they name.
- `Bash` touches each path-like token in the command that the registry matches, for example the log file of `scripts/log.sh <logfile> ...` or the target of `>>`.

Tool uses before the run starts still count. A run reads several files before it reads the playbook.

## Freshness

The transcript is the source of truth.
At `session.start` and at `turn.complete`, the mod rebuilds `Run` from `$.session.messages()`, and from the messages of each delegate that has an agent id, so artifacts that subagents write appear too.
Between those points, a `tool.call` hook folds each finished call into `Run`, so the pane changes while a turn runs.
The pane reads the selected file again when its path is touched and at `turn.complete`.

## Surfaces

The pane draws on `terminal`, `desktop`, and `mobile`. It uses only `Box`, `Text`, `Button`, `Markdown`, and `Code`, which all three surfaces have.
`vscode`, `claude -p`, and cloud sessions draw no pane. There, `/pstack-pane` answers with a text summary.

## Placement

The mod is a third plugin in this marketplace, `pstack-pane`, in `pane/`.
It reads no upstream file and depends on neither of the two other plugins. It only observes tool uses.
It runs in Claude Code only. Codex and Cursor do not load Claude Code mods.

## Limits

- The registry recognizes the artifact names that upstream uses at the pinned commit. A new upstream artifact name needs a new registry row.
- Artifacts that a run writes outside a recognized name do not appear. Code changes have their own diff views.
- A file over 4 MiB or outside the readable file system shows an error line instead of a preview.
