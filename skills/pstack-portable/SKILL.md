---
name: pstack-portable
description: Run upstream pstack workflows in Claude Code, Codex, or Cursor through a small compatibility layer. Use for portable pstack across these environments.
---

# Portable pstack

This skill adapts execution mechanics. Upstream pstack owns the engineering principles, playbooks, review criteria, and prompts.
Install upstream pstack skills and this wrapper with the skills installer. This wrapper does not supply upstream workflows.

## Load the execution contract

1. Identify the active environment from its exposed tools. Read [codex.md](references/codex.md), [claude-code.md](references/claude-code.md), or [cursor.md](references/cursor.md) for the active environment.
2. Read [capabilities.md](references/capabilities.md) and [settings.md](references/settings.md). Resolve settings for the active environment only. Apply these translations throughout this workflow, including nested upstream skills and agent prompts.
3. Read [upstream.md](references/upstream.md) and resolve the installed upstream skill locations. Record their absolute paths and any available source revision. A full repository checkout is optional.
4. Read the explicit requested upstream skill. Otherwise read upstream `poteto-mode` and its selected playbook. Resolve nested skills and resources through the same installed skill map.
5. Follow upstream instructions with the loaded translations. Do not invoke an unwrapped slash command that starts a new context without this contract.

## Precedence and continuity

System, developer, user, and repository instructions retain their authority. This wrapper supplies translations for Cursor mechanics; it does not grant permission.
Upstream requirements about engineering outcomes remain in force. Preserve independent verification, evidence, scope, and review coverage when translating execution.
An unfamiliar Cursor dependency needs a capability check before execution. A tool parameter must exist in the active schema before use.
Use the same verified upstream skill map and source revision for the entire task. Do not edit upstream files to make this wrapper work.
After context compaction, restore the skill map, selected workflow, environment ID, settings path, adapter, model choices, and outstanding capability gaps.

## Delegation contract

Every child brief carries absolute paths to this skill, the active adapter, `capabilities.md`, `upstream.md`, and its assigned upstream skill or agent prompt.
Include the resolved skill map, source revision, environment ID, selected settings path, and model-to-effort mapping.
Tell each child to read those files before work and apply the translations to its own children.
Include the goal, scope, writable worktree or output, verification criteria, model choice, and permission limits.
An upstream `poteto-agent` request means reading its resolved upstream definition, then following its referenced mode.
Other named agent requests mean reading their upstream definition; use a supported native agent type to execute that prompt.
The parent checks actual changes and evidence before reporting results. Same-model workers do not establish model diversity.

## Direct requests

For example, “Use pstack-portable to interrogate this diff” loads upstream `interrogate`, while retaining this execution contract.
“Use pstack-portable to configure pstack” loads upstream `setup-pstack` with the settings translation in `capabilities.md`.
For ordinary tasks, enter upstream `poteto-mode`. This wrapper does not install hooks or change routing for unrelated sessions.
Run setup in the environment whose native agents will perform the work. This wrapper does not launch another agent application or provider CLI.
