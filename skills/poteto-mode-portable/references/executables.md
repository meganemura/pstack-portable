# Upstream hooks, scripts, and automations

This mapping covers the fingerprinted pstack 0.15.5 executable resources.
It distinguishes host hooks from scripts invoked by playbooks. A skills installation does not install a host's plugin hooks.

## Before executing a script

Use the wrapper's preflight with the resolved full upstream root and active environment:

```sh
node <wrapper>/scripts/script-preflight.mjs \
  --upstream-root <upstream> --environment codex \
  --script skills/poteto-mode/scripts/worktree-audit.sh
```

Use `claude-code` or `cursor` for those hosts. The output is JSON.
`READY` supplies the command plus requirements. Preserve task-specific arguments and existing authorization limits.
`ADAPTER` supplies an alternate command and its evidence limits.
`BLOCKED` exits with status 2. Do not execute the original command to bypass that verdict.
This tool checks file fingerprints and selected runtime prerequisites. It does not run the requested script.
Changes anywhere in the fingerprinted set require reassessment before updating the manifest. Do not simply regenerate hashes to get a pass.
An unknown script needs an explicit mapping. Test, typecheck, and library files are not ordinary workflow entry points.

| Upstream entry | Handling |
| --- | --- |
| `show-me-your-work/scripts/log.sh` | Run with Bash. It writes the chosen TSV file; transcript verification remains a separate step. |
| `poteto-mode/scripts/worktree-audit.sh` | Use the wrapper's Node audit in all environments. It reads Git state without Cursor transcript paths or macOS date/stat assumptions. |
| `poteto-mode/scripts/check-plan.mjs` | Run upstream in Cursor. In other hosts, retain manual plan review and report this automatic gate unresolved. It checks Cursor program markers, even though Node can execute it. |
| `poteto-mode/scripts/orch/orch.ts` | Bun and prepared locked dependencies are required. Pass `--store` with an explicit task-owned directory instead of assuming a Cursor agent store. |
| `poteto-mode/scripts/watch-pr/watch-pr` | Bun, prepared locked dependencies, and authenticated `gh` are required. It watches GitHub; wake-up capability is separate. |
| `poteto-mode/scripts/bootstrap.ts` | A dependency helper, not a direct task command. Preflight blocks entry points whose bootstrap would auto-install. |

The plan checker belongs to upstream `playbooks/multi-phase-plan.md`, step 6.
Select it when that workflow produces its full multi-PR plan skeleton.
Feature step 3 instead requires the four-item throughput checkpoint. Do not add the plan checker as a general Feature completion gate.
A compatibility probe can report `BLOCKED` without creating a requirement in the active workflow.
Report an unsupported script as an unmet task gate only when the selected workflow actually requires it.

The alternate worktree audit does not fetch, query PRs, read chat history, prune, or delete.
Ancestry against a local base ref does not prove squash-merge state. Unknown chat and PR evidence stays unknown.
Every worktree requires review before cleanup; `needs-review` is not a safe-to-delete verdict.
The adapter does not replace missing history with invented timestamps.

## Hooks

The inspected `.cursor-plugin/plugin.json` registers `skills` and `agents`; its registered resources are distinct from host event hooks.
Playbook references to hooks also include the target repository's own pre-commit and pre-push checks. Preserve those native Git hooks.
Do not interpret a hook pass as behavioral verification.

Do not copy Cursor event-hook configuration into Claude Code or Codex.
If an upstream update adds a hook declaration, inspect its event, input schema, executable, side effects, and expected result.
Before registering a host-native equivalent, validate the target host's hook contract and test it with representative event input.
If no equivalent is available, name the missing automation and execute the required check explicitly at the same workflow boundary when possible.
Report that explicit execution does not provide automatic event coverage.
This wrapper currently installs no hooks. Do not report hook support based on a script preflight result.

## Automations and update scope

The Benny pack is a Cursor Automations integration, entered through its `FOR_AGENTS.md`.
It is separate from these registered skills and is not installed by this wrapper.
In Claude Code and Codex, report that automation unavailable. Do not imitate its editor or backend by calling another application.
In Cursor, follow the pack's own reviewed setup only when explicitly requested and the native capabilities are available.
Apply the same rule to Cursor webhook routines requested by `make-bot-ui`.

Upstream scripts retain their source behavior; this wrapper supplies dispatch rules and the alternate audit.
Agents must invoke preflight. The wrapper does not intercept arbitrary shell commands or enforce a sandbox.
