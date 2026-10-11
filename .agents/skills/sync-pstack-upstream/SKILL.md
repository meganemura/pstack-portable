---
name: sync-pstack-upstream
description: Review every upstream pstack change and integrate its effects into this pstack-portable worktree. Use when upstream changes or upstream synchronization is requested.
license: MIT
---

# Synchronize upstream pstack

Maintain this repository's portable adapter against upstream `cursor/plugins`, subtree `pstack/`.
Use the existing upstream checkout and the current pstack-portable worktree.
This is contributor guidance. Keep it project-local under `.agents/skills/`.

## Resolve the worktrees and preserve work

Read the current repository instructions and `docs/adapter-design.md` before editing.
Resolve the destination with `git rev-parse --show-toplevel` in the current worktree.
Verify that its origin identifies `meganemura/pstack-portable`.
The source is the `upstream/plugins` submodule. Run `git submodule update --init` if it is empty.
Verify that its origin identifies `cursor/plugins`. Accept SSH and HTTPS spellings of both repository identities.
Report an unresolved identity instead of selecting another fork or checkout.

Record both worktree states before work. Preserve tracked edits and untracked files in both repositories.
Read committed source through Git objects when local changes affect the comparison.
Identify local source changes separately; do not include them silently in an upstream revision.
Fetch in the submodule when network access is available and the task requests the latest revision.
Check out the selected target in the submodule, then stage it. The pin, the manifest, and the review record move in one change.
Set the `pstack` plugin `sha` in `.claude-plugin/marketplace.json` and the plugin `version` to the target.
Regenerate `skills/poteto-mode-portable/scripts/upstream-tree.json` from `git -C upstream/plugins ls-tree -r <target> pstack`, keyed by the path under `pstack/`.
Leave other upstream checkouts on the machine untouched.
A fetch updates remote references without replacing the worktree. Record the selected target's full commit ID.
If freshness cannot be verified, state which local revision was examined and keep that limitation explicit.
Keep machine paths and private work details out of committed evidence.

## Establish the complete review range

Read the last completed full review in `docs/upstream-sync/`.
Use its target commit as the baseline only if its coverage and completion evidence are present.
`skills/poteto-mode-portable/scripts/upstream-scripts.json` records script fingerprints.
Its commit does not establish a full upstream review baseline.

For the first full review, inventory and read the entire target `pstack/` tree.
Map every file to portable behavior, retained upstream behavior, or a documented host limitation.
Establish the first baseline only after this full inventory has been assessed.
If a proposed baseline is unavailable or is not an ancestor of the target, report the history discontinuity.
Inspect both complete trees and the available history before accepting a replacement baseline.

For an established baseline, collect all of the following with full commit IDs:

- Both complete tree inventories, including object IDs, modes, symlinks, submodules, and binary files.
- The complete endpoint diff, including additions, deletions, renames, copies, and mode changes.
- Every commit in the range that affects pstack, and every parent-relative patch for those commits.
- Changes to external files that define pstack's referenced runtime, packaging, hook, or dependency contracts.

Use these Git commands after assigning `source_repo`, `baseline`, and `target` to verified values:

```sh
git -C "$source_repo" ls-tree -r -z "$baseline" -- pstack
git -C "$source_repo" ls-tree -r -z "$target" -- pstack
git -C "$source_repo" diff --raw -z --no-abbrev "$baseline" "$target" -- pstack
git -C "$source_repo" diff --no-ext-diff --no-textconv --find-renames --find-copies --full-index --binary "$baseline" "$target" -- pstack
git -C "$source_repo" rev-list --reverse --topo-order "$baseline..$target"
```

Enumerate all commits first; do not use a path-filtered log that can simplify merge history.
For each commit, obtain its parents with `git rev-list --parents -n 1 <commit>`.
Read the full `pstack/` diff against each parent with the same diff flags above.
Use the root-commit diff when a commit has no parent.
Account for intermediate changes even when a later commit reverts them.
Resolve renames and deletions through both source versions, rather than reading only surviving files.
Inspect submodule changes in the referenced repository when their contents affect pstack.

Save full command output to task-owned local files when output exceeds the available context.
Read every part in bounded chunks and record coverage. A truncated tool result is incomplete evidence.
Use NUL-delimited inventories for paths. Do not split filenames on whitespace.
Inspect binary assets with an appropriate viewer or metadata tool and record what was established.
An unavailable object or unreadable asset leaves an explicit unresolved entry.

## Review every change and its callers

Create `docs/upstream-sync/<target-full-commit>.md` as the review record.
Record the source identity, baseline, target, inventory counts, and commands used.
For the first review, use one entry per tree item. For later reviews, use one entry per changed path and commit-parent pair.
Also record endpoint-only entries if their coverage differs from the commit patches.
For each entry, account for every hunk or object change and cite its source revision and path.
Record the behavior, affected portable callers, disposition, resulting files, and verification evidence.
Use an explicit reason for retained behavior or a host limitation. A category label alone does not complete an entry.
Keep intermediate or reverted changes visible with their final disposition.
When parallel reviewers write entries for later merging, have them write only `###` entry blocks. A group heading or preface leaks into the neighbouring entry when the files are joined.

Review skills, agent prompts, playbooks, rules, documentation, plugin metadata, executable files, hooks, automations, tests, assets, licenses, and dependency locks.
Trace changed references and contracts into their callers and resources, including files outside `pstack/`.
Inspect new execution paths for host tools, event schemas, side effects, dependencies, settings, and model requirements.
Assess Claude Code, Codex, and Cursor separately. Preserve upstream gates and their intended scope.
Do not infer portable execution from a shared command name or a successful static check.

Keep original workflows upstream and adapt the differences in the wrapper.
Update the applicable runtime references, scripts, install selection, design records, attribution, and validation cases.
Review the complete executable implementations and dependencies before updating fingerprints or preflight decisions.
Include newly discovered scripts and hooks in the compatibility assessment.
Preserve safe blocking behavior until the relevant execution contract has been verified.
Document intentional unsupported behavior and its user-visible effect; do not weaken an upstream gate to pass a check.

Follow repository policy for dependency additions, host registration, settings changes, commits, and publication.
This skill does not authorize installing dependencies, registering hooks, changing user model settings, or publishing.
Do not modify the upstream checkout as part of the portable adaptation.

## Verify and reconcile coverage

Compare the review record against the complete inventories and every commit-parent diff.
Reconcile entry counts and identifiers explicitly. Inspect each entry's hunk coverage and supporting evidence.
Recheck additions, deleted files, renames, modes, binaries, merges, and reverted changes during reconciliation.
Human semantic review establishes whether the adaptation preserves behavior; counts alone establish only enumeration coverage.

From the destination root, run the existing executable checks when relevant:

```sh
node --test tests/script-adapters.test.mjs
node --check skills/poteto-mode-portable/scripts/script-preflight.mjs
node --check skills/poteto-mode-portable/scripts/worktree-audit.mjs
git diff --check
```

The tests read the submodule. Check it out at the reviewed target before you run them.
The pin test fails until the staged submodule commit equals the manifest commit.
The test suite covers script verdicts and worktree evidence. Inspect its implementation before interpreting results.
Check that the upstream-dependent test ran rather than skipped.
Update behavioral tests when an executable contract changes. Add applicable checks for changes outside their coverage.
Read all modified documents after editing and verify their local links and skill frontmatter.
Validate actual host behavior when available. Report untested host behavior explicitly.
Do not run upstream executables merely to inspect them. Review their side effects and use the portable preflight before authorized execution.
Do not use Python for inspection, editing, or validation.

## Completion and method assessment

Complete the update only after every review entry has evidence, every required adaptation is implemented, and applicable verification passes.
A documented host limitation can be a completed disposition when its behavior and portable handling have been verified.
Missing source, unread changes, unexplained dispositions, and failed required checks keep the update incomplete.
Mark the review record complete only after reconciliation. Its target then becomes the next full-review baseline.
Keep incomplete records clearly marked, so a later run cannot adopt them as completed baselines.
Report the reviewed range, coverage counts, changes applied, retained limitations, tests, and remaining gaps.
Do not claim that all hosts were exercised when only local checks ran.

Assess this method when feedback exposes a weakness and at completion.
Repair a concrete coverage failure within the current task's authority, then verify the affected conclusions.
Record reusable lessons in this skill or project checks. Retain a useful method with a stated reason when no repair is justified.
Do not expand the task into recursive process improvement.
