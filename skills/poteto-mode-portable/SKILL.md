---
name: poteto-mode-portable
license: MIT
description: Run upstream pstack workflows in Claude Code, Codex, or Cursor through a small compatibility layer. Use as /poteto-mode-portable in place of /poteto-mode, or for other pstack workflows in these environments.
---

# Portable poteto mode

This skill adapts execution mechanics. Upstream pstack owns the engineering principles, playbooks, review criteria, and prompts.
Install this wrapper and upstream pstack as plugins from this repository's marketplace, or with the skills installer. This wrapper does not supply upstream workflows.
License and upstream attribution travel with the installable skill. See [attribution.md](references/attribution.md).

## Load the execution contract

1. Identify the active environment from its exposed tools. Read [codex.md](references/codex.md), [claude-code.md](references/claude-code.md), or [cursor.md](references/cursor.md) for the active environment.
2. Read [capabilities.md](references/capabilities.md) and [settings.md](references/settings.md). Resolve settings for the active environment only. Apply these translations throughout this workflow, including nested upstream skills and agent prompts.
3. Read [upstream.md](references/upstream.md) and resolve the installed upstream skill locations. Record their absolute paths and any available source revision. A full repository checkout is optional.
4. Read the explicit requested upstream skill. Otherwise read upstream `poteto-mode` and its selected playbook. Resolve nested skills and resources through the same installed skill map.
5. Follow upstream instructions with the loaded translations. Do not invoke an unwrapped slash command that starts a new context without this contract.
   When a step names an upstream skill or slash command, such as `/no-comments` before review, read that skill's `SKILL.md` from the skill map and run it in this context.
   Most upstream skills set `disable-model-invocation: true`. Do not call the host's skill tool for them. Read them by path, like every other upstream file.
   The flag does not excuse the step. If the host has already blocked the skill and forbids other routes, follow the host. Report the step unresolved and ask the user to run the slash command.
6. Before a playbook invokes an upstream script, hook, or automation, read [executables.md](references/executables.md). Run script preflight and follow its verdict before execution.

## Precedence and continuity

System, developer, user, and repository instructions retain their authority. This wrapper supplies translations for Cursor mechanics; it does not grant permission.
A higher instruction wins only where it conflicts with an upstream rule. When both govern the same output without conflict, produce the smallest result that satisfies both.
For example, a user rule that asks for a module header and the upstream Comments rule together give a short header with only what the code cannot show.
Upstream requirements about engineering outcomes remain in force. Preserve independent verification, evidence, scope, and review coverage when translating execution.
An unfamiliar Cursor dependency needs a capability check before execution. A tool parameter must exist in the active schema before use.
Use the same verified upstream skill map and source revision for the entire task. Do not edit upstream files to make this wrapper work.
After context compaction, restore the skill map, selected workflow, environment ID, settings path, adapter, model choices, and outstanding capability gaps.

## Delegation contract

This contract applies to every child: upstream agents, repository-defined agents, and general agents.
Every child brief carries absolute paths to this skill, the active adapter, `capabilities.md`, `upstream.md`, and any assigned upstream skill or agent prompt.
Quote in the brief the upstream rules that govern the child's output, such as the Comments section of `poteto-mode` for any code it writes. A repository-defined agent can skip a path, but it receives the quoted rule.
Include the resolved skill map, source revision, environment ID, selected settings path, and model-to-effort mapping.
Tell each child to read those files before work and apply the translations to its own children.
Include the goal, scope, writable worktree or output, verification criteria, model choice, and permission limits.
Include descendant capacity reservations, the dispatch coordinator, and unresolved independence gates.
An upstream `poteto-agent` request means reading its resolved upstream definition, then following its referenced mode.
Other named agent requests mean reading their upstream definition; use a supported native agent type to execute that prompt.
The parent checks actual changes and evidence before reporting results. Same-model workers do not establish model diversity.

## Direct requests

For example, “Use poteto-mode-portable to interrogate this diff” loads upstream `interrogate`, while retaining this execution contract.
“Use poteto-mode-portable to configure pstack” loads upstream `setup-pstack` with the settings translation in `capabilities.md`.
For ordinary tasks, enter upstream `poteto-mode`. This wrapper does not install hooks or change routing for unrelated sessions.
Run setup in the environment whose native agents will perform the work. This wrapper does not launch another agent application or provider CLI.
