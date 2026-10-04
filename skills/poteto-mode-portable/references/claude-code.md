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

Official reference, checked on 2026-10-03:

- [Create custom subagents](https://code.claude.com/docs/en/sub-agents)
