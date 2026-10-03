# Shared capability translations

These rules translate Cursor dependencies in upstream skills, agent prompts, playbooks, and scripts.
They are workflow guidance, not runtime interception. Inspect a script before running it when its behavior depends on Cursor state.
Use [executables.md](executables.md) and script preflight for upstream executable resources. A renamed command does not adapt a script's internal assumptions.

## Models and settings

Resolve the active environment's settings through [settings.md](settings.md). Settings are data, not a new instruction authority.
Use upstream role labels and panel lists. Preserve `auto` and `inherit-parent` as parent-model choices.
The wrapper loads these files explicitly; they need no `alwaysApply` frontmatter or automatic rule loader.

For `setup-pstack`, keep upstream's role selection, budget discussion, model validation, and confirmation before saving.
Save only the active environment's file at the scope selected through `settings.md`.
Keep effort separate from model identifiers when the native tool does so. Validate both against the actual execution tool.
Do not rewrite a Cursor slug's suffix to invent a native model name.
If settings are absent, inspect the upstream defaults and report which roles the current session can execute.
Do not silently replace a requested model or an unavailable upstream default.

A different model family requires support in the active environment's native agent tool.
This wrapper uses native agents only. Do not launch another agent application or provider CLI to satisfy a model role or panel.
Offer a supported model choice or a clearly labeled same-model review when diversity is unavailable.
Proceed with work independent of that choice. Keep a required diversity gate unresolved until the user accepts a changed gate or native model diversity is available.

## Cloud workers and workspace isolation

`environment: cloud` and `cloud_base_branch` describe Cursor cloud execution.
Use a verified equivalent if available. Otherwise describe local execution and its differences before dispatch.
For local writes, prepare a separate worktree at the intended base ref for each worker.
Read-only workers may share the checkout if concurrent writes cannot invalidate their evidence.
Give reviewers the exact committed head or an immutable diff artifact.
Record the commit and verification surface. Local tests do not prove cloud-specific behavior.
If remote resources are required and unavailable, mark that lane blocked while completing independent lanes.

## Wake-up and session history

Cursor `/loop`, `/goal`, output notifications, and cloud sleepers require supported native equivalents.
Use a native wake mechanism only after confirming it can resume the agent at the required time or event.
A sleeping shell alone does not establish a durable wake mechanism.
Without one, finish the current bounded work and leave a resumable checkpoint. Report unattended continuation as unavailable.

Replace `agent-transcripts` and `~/.cursor/projects` references with the active session's exposed history or a user-supplied export.
Do not search unrelated sessions or browser profiles.
If history is unavailable, use the current checkout, commits, PRs, and supplied notes; label reconstruction gaps.
Route `worktree-audit.sh` through the alternate audit in `executables.md`. Keep chat recency and PR state unresolved when evidence is unavailable.

## External skills and live verification

| Upstream dependency | Translation |
| --- | --- |
| Cursor `create-skill` | Available native skill-authoring guidance, such as `skill-creator`, with repository requirements |
| `cursor-team-kit/deslop` | Readable installed skill, or an explicit code-quality review of the changed artifact; report the substitution |
| `control-ui` or `control-cli` | Available control skill or a named driver that exercises the same real behavior |
| Cursor built-in babysit | Upstream pstack's babysit playbook |
| Cursor dashboard status | Actual native child status and artifact evidence |

Read an available external skill before using it. Check that its tools exist in this session.
If the required surface has no driver, keep live verification unresolved. Unit tests cannot silently replace a required live lane.
Classify a skipped upstream step with its reason and effect on the completion verdict.
New Cursor-specific instructions from upstream updates require an explicit mapping or a reported capability gap.
