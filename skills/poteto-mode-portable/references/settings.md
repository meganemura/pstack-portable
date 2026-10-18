# Settings for the active environment

This contract selects a model sheet for native execution in one environment.
It does not configure other agent applications during the current task.

## Environment and scope

Use `codex`, `claude-code`, or `cursor` as the environment ID. Identify it from the host and its exposed tools.
Shared tool names such as `Task` cannot identify the host by themselves.
If the host is uncertain, establish it before loading or writing model settings.

Select one whole file in this order:

1. A user-supplied settings path whose environment marker matches the active host.
2. `<project-root>/.pstack/models/<environment>.md`.
3. `~/.agents/pstack/models/<environment>.md`.
4. A legacy portable file, only when it explicitly declares the matching environment.
5. In Cursor only, `~/.cursor/rules/pstack-models.mdc` as a native legacy fallback.

Validate the selected file before execution. A mismatched environment marker or invalid model is an error, not a reason to skip to another file.
Do not merge project and global role sheets. Do not read another environment's sheet as a fallback.
When no sheet is selected, run setup in the current environment before model-dependent delegation.
Read-only work that needs no delegation can continue while settings are pending.

For setup, update the active selected portable sheet in place. A global sheet stays global on reconfiguration unless the user changes its scope.
With no existing portable sheet, default to the project path. An explicit global request uses the global path above.
Native Cursor legacy settings are read-only migration input; save their confirmed translation to a portable environment file.
In Claude Code, `~/.claude/rules/pstack-models.md` from upstream's separate `pstack@cursor-plugins` install is also read-only migration input. It is never a selected sheet, even when Claude Code has loaded it into context. Its role values are `<model> <effort>` pairs, such as `opus high`.
Show all roles, model effort values, and the destination before saving new choices. Preserve the upstream setup confirmation requirement.
Migration of previously approved choices can proceed without asking for the same approval again.

## Model sheet

Each new file starts with `# environment: <environment>` and keeps upstream role labels.
Model effort values and native model IDs are separate parameters:

```text
# environment: codex
# budget: custom
# reasoning effort by model:
# gpt-6.1-sol: low
# gpt-6-astra: medium
feature, refactoring: gpt-6.1-sol
judgment and prose: gpt-6-astra
interrogate reviewers: gpt-6.1-sol, gpt-6-astra
```

Under `# reasoning effort by model:`, read `# <model>: <effort>` lines as the effort map.
Apply that effort to every occurrence of the model, including panel entries.
Optional `# default effort: <effort>` applies when the map has no entry for a selected model.
Optional `# reasoning effort by role:` entries use `# <upstream role>: <effort>` and override the model map for that role.
The precedence is role override, model effort, default effort, then native inherited effort.
A role override applies to all models in that role's panel.

Keep `auto` and `inherit-parent` as parent-model choices; omit the native model argument.
An effort of `inherit` means omitting the native effort argument. It does not reset a model to the parent's model.
Validate model and effort choices against the active tool. Do not synthesize effort-specific model slugs.
If per-child effort is unavailable, report the limitation and request an accepted supported setting. Do not claim it took effect.
Missing role lines follow upstream defaults only when those defaults are supported natively. Otherwise keep the role unresolved until setup supplies a choice.
Record model-family diversity gaps separately from model availability.

## Effort for each spawn

Upstream `poteto-mode` matches each spawn to its job. It moves the role's starting reasoning level one step up for the hardest work, one step down for judgment, and two or more steps down for routine work. It uses fast speed only when CI or trunk is red or a person is blocked now.
In Cursor, apply that rule to the slug as upstream says.
Elsewhere, the starting level is the effort this contract resolves for the role. Move it on the native tool's own effort scale and keep the model ID unchanged.
When the resolved effort is `inherit` and the host does not expose the parent's effort, keep `inherit` and report the adjustment unapplied.
Use a native per-child fast option only when the active tool exposes one. Otherwise run at standard speed, and say so when the job called for fast.
Verification keeps the `swarm workers` model and effort without adjustment. A role on `auto` or `inherit-parent` keeps the parent model.
If the tool rejects the adjusted effort, use the role's resolved effort and say so. Do not try another adjusted level.

## Legacy migration

Legacy paths are `<project-root>/.pstack/models.md` and `~/.agents/pstack-models.md`.
They qualify as fallback only with a matching `# environment:` marker or an explicit scope declaration naming that environment.
The earlier `# Scope: Codex native delegation` declaration identifies a Codex sheet.
An unmarked common sheet must not be applied automatically to all three environments.

Preserve role choices and model effort values when moving a matching sheet to its environment path.
Verify the new file, then remove the old file only when it contains solely those migrated settings.
Keep ambiguous or mixed sheets for review instead of deleting them.
Do not create guessed Claude or Cursor model choices from a Codex sheet.
