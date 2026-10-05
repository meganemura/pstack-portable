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

## Read-only and agent-mode children

Upstream `readonly: true` means the child must not write. Use a native agent type or sandbox that removes write tools, when one exists. Otherwise state the no-write limit in the brief.
Upstream `readonly: false` with "agent mode" keeps MCP access for lookups, as in `why` and `reflect`. Choose a child type that keeps the session's MCP tools, and keep any no-write limit in the brief.
A read-only native type can also drop MCP tools. Check its tool list before you use it for a child that needs MCP.

## Native agent capacity

Before fan-out, inspect the native capacity and the status of the whole agent tree.
Count the root, active workers, and waiting parents when the host counts them toward its limit.
Budget each lane's required descendants before admitting that lane. Carry the reservation and dispatch owner in every child brief.
A waiting parent does not create a free slot. Do not fill every slot with parents that require another child to finish.

One coordinator owns admission for the shared tree. Children request reserved dispatch through that coordinator instead of racing for spare slots.
Recheck native status immediately before each spawn. Reservations are scheduling guidance, not a native lock.
Use the native release or close operation only when available and after preserving the child's result.
Do not assume completion, interruption, or an idle status releases a thread slot. Confirm the host's capacity behavior.
If capacity cannot be recovered, checkpoint and report the unresolved gate. Do not repeatedly retry the same spawn.

Complete shared `how` grounding before candidate fan-out when candidates ask the same question against the same immutable source.
Run upstream's explorers and independent explainer with their required briefs, models, and evidence.
Serialize explorers when needed, then pass every explorer's findings to the independent explainer.
Pass the complete grounding result, question, revision, and remaining gaps to each candidate.
This satisfies only the shared question. Candidate-specific questions still require their own independent grounding.

With four total slots, the root uses one. A lane with one required child needs two more slots.
Admit only one such lane while one diagnostic worker remains active.
For example: root + diagnostic + candidate A + A's explainer uses four slots.
Preserve and release that lane's completed threads before admitting candidate B and its explainer.
If an explainer requires explorers, finish and release the explorers before its explainer phase.
Schedule deeper trees by their full phase requirements rather than applying the one-child example blindly.
Alternatively, finish shared grounding before admitting root + diagnostic + candidate A + candidate B, provided those candidates require no further child.

After a capacity error, preserve the failed operation and native error when available.
Pause additional admission, inspect status, and serialize the remaining required stages.
A worker's direct tracing is useful provisional evidence. It does not complete an independent explainer gate.
Keep that gate unresolved until the required independent stage runs.
A later judge counts only if its brief and evidence also fulfill the missing stage's question and upstream contract.
Check that no capacity-dependent parent waits for a child whose slot is held by another waiting parent.

## Cloud workers and workspace isolation

`environment: cloud` and `cloud_base_branch` describe Cursor cloud execution.
Use a verified equivalent if available. Otherwise describe local execution and its differences before dispatch.
For local writes, prepare a separate worktree at the intended base ref for each worker.
Read-only workers may share the checkout if concurrent writes cannot invalidate their evidence.
Give reviewers the exact committed head or an immutable diff artifact.
Record the commit and verification surface. Local tests do not prove cloud-specific behavior.
If remote resources are required and unavailable, mark that lane blocked while completing independent lanes.

## Wake-up and session history

Upstream arms recurring audit ticks with `/loop 1h` and uses `/loop` for autonomous runs. Cursor and Claude Code expose a native `/loop`. Codex needs a verified native equivalent.
In Claude Code, a looped prompt runs only while its session stays open, and a recurring loop expires after seven days. Re-arm the tick for a longer program. Watcher subagents that wake the parent need a native completion notification.
Use a native wake mechanism only after confirming it can resume the agent at the required time or event.
A sleeping shell alone does not establish a durable wake mechanism.
Without one, finish the current bounded work and leave a resumable checkpoint. Report unattended continuation as unavailable.

Replace `agent-transcripts` and `~/.cursor/projects` references with the active session's exposed history or a user-supplied export.
For a child's own transcript, as in the eval playbook, use the child transcript or output that the host exposes. Without one, grade from the child's files and tool results, and report the transcript check unresolved.
Do not search unrelated sessions or browser profiles.
If history is unavailable, use the current checkout, commits, PRs, and supplied notes; label reconstruction gaps.
Route `worktree-audit.sh` through the alternate audit in `executables.md`. Keep chat recency and PR state unresolved when evidence is unavailable.

## Trunk re-reads and plan files

Upstream programs re-read playbooks and skills with `git show origin/main:pstack/<path>`. That path exists only when the target repository carries pstack at `pstack/` on its trunk.
Otherwise, write each re-read against the resolved upstream source at the task's recorded revision, such as `git -C <upstream repository> show <revision>:pstack/<path>`.
The task keeps one upstream revision. A re-read restores the instructions after drift; it does not pick up a newer upstream.
The plan checker requires the literal `git show origin/main:`. A plan with translated re-reads fails that marker. Report that line as a translation mismatch and keep the other results. Do not add a placeholder line to pass it.
Upstream writes a plan under the agent store's `docs/` unless the operator names a path. Outside Cursor, use a task-owned directory, and report the path.

## Persistent mode

Upstream Poteto Mode sets `mode: true` and a `reminder:` so Cursor keeps it active across tasks.
Claude Code and Codex load a skill when it is invoked. Invoke `poteto-mode-portable` again for each new task. This wrapper installs no reminder.

## Skill directories

Upstream writes and searches skills in `.cursor/skills/` and `~/.cursor/skills/`. Examples are `create-verification-skill`, `automate-me`, and the `reflect` reviewers.
Use the active host's configured skill directory at the same scope: project for `.cursor/skills/`, user for `~/.cursor/skills/`.
For the `reflect` search of plugin skills under `~/.cursor/plugins/`, use the host's installed skill and plugin locations.
Confirm that directory from the host's configuration. `upstream.md` lists common roots; do not assume one.
Report the chosen path. A skill written to a directory that the host does not read stays undiscovered.

## External skills and live verification

| Upstream dependency | Translation |
| --- | --- |
| Cursor `create-skill` | Available native skill-authoring guidance, such as `skill-creator`, with repository requirements |
| `cursor-team-kit/deslop` | Readable installed skill, or an explicit code-quality review of the changed artifact; report the substitution |
| `control-ui` or `control-cli` | Available control skill or a named driver that exercises the same real behavior |
| Cursor built-in babysit | Upstream pstack's babysit playbook |
| A run's built-in PR tool | An exposed native PR tool, when the session has one; otherwise the forge CLI path that upstream names for runs without the tool |
| Cursor dashboard status | Actual native child status and artifact evidence |
| An image-generation tool | An exposed image tool; otherwise a text diagram, such as Mermaid, with the substitution reported |

Read an available external skill before using it. Check that its tools exist in this session.
If the required surface has no driver, keep live verification unresolved. Unit tests cannot silently replace a required live lane.
Classify a skipped upstream step with its reason and effect on the completion verdict.
New Cursor-specific instructions from upstream updates require an explicit mapping or a reported capability gap.
