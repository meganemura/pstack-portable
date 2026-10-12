# Codex execution adapter

Use the tools exposed in this Codex session as the authority for names, parameters, model choices, and limits.

| Upstream mechanism | Codex translation |
| --- | --- |
| `Task` | The exposed subagent spawn tool, commonly `spawn_agent` |
| `subagent_type: poteto-agent` | A supported agent type with the upstream agent prompt and delegation contract |
| `generalPurpose` | A supported general agent with a complete brief |
| `run_in_background` | Native asynchronous child execution; omit the Cursor parameter |
| Resume or send | Native follow-up or message tool; distinguish starting a turn from delivering a message |
| Wait or cancel | Native wait or interruption tool, when available |
| `AskQuestion` | The exposed user-input tool, or a concise question when no tool is available |
| Todo list | The exposed planning tool, or a maintained Markdown checklist |
| `/loop 1h` and other `/loop` intervals | A native recurring wake only after you confirm it in this session; otherwise the wake rule in `capabilities.md` |

Respect session delegation restrictions and concurrency limits. Apply the native agent capacity contract in `capabilities.md` before fan-out and nested dispatch.
When the tool supports model or effort overrides, use only confirmed choices and compatible context-fork settings.
Do not assume a full-history fork accepts model overrides. Include the complete contract in the child brief even when history is inherited.
If a model cannot run through native delegation, follow the model capability rule in `capabilities.md`.
Separate writable worktrees before concurrent code changes. A shared filesystem is not isolation.

## Capacity errors without a release API

After a thread-limit error, stop new admission and record the current whole-tree status.
An interrupt result with `previous_status: pending_init` does not confirm cancellation or release.
If the next status still shows `pending_init`, retain that child in the capacity estimate.
Do not repeat interruption or spawning against unchanged evidence.

Let the running candidate finish and save its result against the shared immutable source.
Recheck the whole tree after its completion notification.
A new free-capacity report or disappearance of a previously counted child permits one spawn attempt.
A newly observed terminal transition also permits one probe if no free-capacity counter exists.
That transition permits a probe; it does not prove release. Record the probe and its observed status change.
A second thread-limit rejection requires new capacity evidence before another attempt.
Keep the same pending stage and brief across attempts. Do not duplicate an already running candidate.

When a fresh spawn remains unavailable, an existing idle child may accept the next stage through a supported follow-up tool.
Reuse it only when the stage permits retained history, its model and tools match, and its earlier work does not violate required independence.
Do not reuse candidate A as an independent candidate B or judge when the upstream contract requires separate agents.
If no eligible child or capacity evidence exists, checkpoint the missing stage and continue independent work.
Retain the two-candidate comparison and independent verification as unresolved gates until their required stages run.
Elapsed time alone does not permit another spawn.

Official references, checked on 2026-10-03:

- [Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)
- [Build skills](https://learn.chatgpt.com/docs/build-skills)
