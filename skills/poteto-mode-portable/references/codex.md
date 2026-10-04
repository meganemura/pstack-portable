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

Respect session delegation restrictions and concurrency limits. Queue work when slots are full.
When the tool supports model or effort overrides, use only confirmed choices and compatible context-fork settings.
Do not assume a full-history fork accepts model overrides. Include the complete contract in the child brief even when history is inherited.
If a model cannot run through native delegation, follow the model capability rule in `capabilities.md`.
Separate writable worktrees before concurrent code changes. A shared filesystem is not isolation.

Official references, checked on 2026-10-03:

- [Subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents)
- [Build skills](https://learn.chatgpt.com/docs/build-skills)
