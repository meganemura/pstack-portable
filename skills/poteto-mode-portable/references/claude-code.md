# Claude Code execution adapter

Use the tools exposed in this Claude Code session as the authority for names, parameters, model choices, and limits.

| Upstream mechanism | Claude Code translation |
| --- | --- |
| `Task` | The exposed subagent tool, commonly `Agent`; older sessions may expose `Task` |
| `generalPurpose` | `general-purpose`, when the active tool accepts it |
| `subagent_type: poteto-agent` | An installed native agent of that name, or a general agent told to read the upstream definition |
| `run_in_background` | Use only if the active tool supports it |
| Resume, wait, or cancel | The supported native child lifecycle tools |
| `AskQuestion` | The exposed question tool, commonly `AskUserQuestion`, or a concise question |
| Todo list | The exposed task-list tool, or a maintained Markdown checklist |
| `/loop 1h` and other `/loop` intervals | The native `/loop` command with the same interval and prompt |

Children receive the delegation contract explicitly. Do not assume a parent-loaded skill is available in child context.
Use a named review agent only when it is installed and its prompt is compatible with the contract.
Otherwise execute the readable upstream prompt through a supported general agent.
Some agent types restrict tools or further delegation. Choose a type that can perform the assigned workflow.
When nested delegation is unavailable, the parent dispatches the child's requested lanes with the same briefs and independent outputs.

Use only model names and isolation parameters accepted by the active tool.
Translate Cursor model slugs through confirmed native choices; do not pass Grok or GPT slugs to a Claude-only model selector.
For other model families, follow the model capability rule in `capabilities.md`.
Use native worktree isolation when exposed. Otherwise prepare separate worktrees and assign their absolute paths before concurrent writes.

## Upstream Claude Code adapter

Upstream ships its own Claude Code name table at `docs/harness/claude-code.md` in the selected pstack root.
Core upstream skills do not link it. Only upstream's generated Claude Code plugin adds that link.
Read it for mappings that this file and `capabilities.md` leave open, such as the Claude Code transcript folder, `claude-<family>-<version>-<effort>` slugs split into model and effort, and local copies of upstream files that a skill links on GitHub `main`.
Where it differs from this wrapper, the wrapper contract governs:

- `setup-pstack` saves the sheet that `settings.md` selects. Do not write `~/.claude/rules/pstack-models.md`, which belongs to the separate `pstack@cursor-plugins` install. When that file is in context, follow `settings.md` for it.
- A Grok, GPT, or other unavailable model keeps the diversity rule in `capabilities.md`. Report the gap instead of silently running the session model.
- The wrapper's `pstack` plugin is disabled and registers no agents. Do not use `pstack:poteto-agent` or `pstack:comment-sicko` unless the session lists them; follow the delegation contract instead.
- Tell the user to run upstream skills through `poteto-mode-portable`, not as `/pstack:<name>`.
- `environment: "cloud"` follows the cloud rules in `capabilities.md`, which also require naming the local differences before dispatch.
- A step that needs a Cursor-only feature gets the adapter's one-line skip note. Also classify it with its effect on the completion verdict, as `capabilities.md` requires.

Official reference, checked on 2026-10-03:

- [Create custom subagents](https://code.claude.com/docs/en/sub-agents)
- [Scheduled tasks](https://code.claude.com/docs/en/scheduled-tasks), for `/loop`, checked on 2026-10-04
- [Skills](https://code.claude.com/docs/en/skills), for `disable-model-invocation`, checked on 2026-10-06
