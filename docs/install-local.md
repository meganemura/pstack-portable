# Install from local checkouts

Register compatible upstream skills and the portable wrapper for Claude Code, Cursor, and Codex.
Keep the full upstream checkout readable for workflows that require execution translations.

## Select the upstream skills

This profile installs 31 skills from upstream pstack 0.15.9:

- The 24 `principle-*` skills provide engineering rules.
- `tdd` provides the focused regression-test workflow.
- `benchmark-checklist` vets a measured performance number before a report or a decision.
- `correct` turns repeated agent mistakes into checks that the repository enforces.
- `unslop`, `bro`, and `technical-writing` provide writing guidance. Technical writing references unslop.
- `typescript-best-practices` provides TypeScript guidance.

These selected files describe engineering or writing practices without prescribing Cursor tools.
Workflows such as `poteto-mode`, `setup-pstack`, `arena`, `swarm`, `interrogate`, `how`, and `why` remain readable in the checkout.
Use them through `poteto-mode-portable`, which loads the execution adapter before their instructions.
Do not use `--skill '*'` for this profile. New upstream skills need review before direct registration.

## Check overwrites before installation

List existing global skills:

```sh
skills list -g --json
```

Compare the selected names with existing folders in the shared skill directory and each target agent's configured skill directory.
Check directories and symlinks, including broken symlinks. Record the source and destination for each collision before installation.
Show that list to the user before replacing files. Obtain overwrite authorization if the user has not already given it.
Back up changed existing skills outside the repository. Shared skills can affect agents beyond the three selected targets.
The `-y` flag below skips installer prompts and can replace an existing skill with the same name.

## Install the selected profile

This repository pins upstream pstack at `upstream/plugins`, at the commit that the wrapper fingerprints.
Run `git submodule update --init` in your clone, then use `<clone>/upstream/plugins/pstack` as `pstack_source`.
Replace the source paths with your local paths. Run this command in a POSIX shell:

```sh
pstack_source=/absolute/path/to/pstack-portable/upstream/plugins/pstack
DISABLE_TELEMETRY=1 skills add "$pstack_source" -g -a claude-code cursor codex -s \
  principle-attack-the-premise \
  principle-boundary-discipline \
  principle-build-the-lever \
  principle-encode-lessons-in-structure \
  principle-exhaust-the-design-space \
  principle-experience-first \
  principle-explain-the-number \
  principle-fix-root-causes \
  principle-foundational-thinking \
  principle-guard-the-context-window \
  principle-laziness-protocol \
  principle-make-operations-idempotent \
  principle-migrate-callers-then-delete-legacy-apis \
  principle-minimize-reader-load \
  principle-model-the-domain \
  principle-never-block-on-the-human \
  principle-outcome-oriented-execution \
  principle-prove-it-works \
  principle-redesign-from-first-principles \
  principle-separate-before-serializing-shared-state \
  principle-sequence-verifiable-units \
  principle-subtract-before-you-add \
  principle-test-behavior-not-implementation \
  principle-type-system-discipline \
  tdd benchmark-checklist correct \
  unslop bro typescript-best-practices technical-writing -y

portable_source=/absolute/path/to/meganemura/pstack-portable
DISABLE_TELEMETRY=1 skills add "$portable_source" -g -a claude-code cursor codex -s poteto-mode-portable -y
```

The installer manages destination copies and agent links. Local source changes require reinstallation.
Preserve upstream licensing in each copied skill folder. The upstream license lives at the checkout root, which a skills-only installer can omit.
For every selected skill, copy `<pstack-source>/LICENSE` to `<installed-skill>/LICENSE-pstack` after verifying its source.
Keep Lauren Tan's copyright notice and the full MIT text unchanged. Do not overwrite a different existing notice.
Repeat this step after reinstallation if the installer replaces the skill folder.
The wrapper's own skill folder already contains its license and upstream attribution resources.
Retain the full upstream checkout, including `agents`, `scripts`, and skill resources.
Its workflows can read and execute those resources through the wrapper without registering every upstream skill.

## Record the upstream checkout

A wrapper linked from the clone finds the pinned submodule by itself. An installed copy of the wrapper cannot find it.
For a copy, save the absolute path of `<clone>/upstream/plugins/pstack` in `~/.agents/pstack-upstream.json`. Keep this machine-specific file outside Git.
If the file already exists, update its `root` value while preserving other fields.

```json
{"root": "/absolute/path/to/pstack-portable/upstream/plugins/pstack"}
```

The wrapper checks that the root contains `skills/poteto-mode/SKILL.md`.
This root also supplies the original agent definitions, so this profile does not need to download missing prompts.

## Verify and use

```sh
skills list -g -a claude-code cursor codex
```

Check all 31 selected skills and `poteto-mode-portable` at the actual destination paths.
Compare installed files with their selected source folders, including references and scripts.
Verify each installed upstream skill also retains `LICENSE-pstack` with the original license text.
Verify that the selected upstream root is readable.
Skill discovery occurs when the application refreshes its catalog; use a new session if the running session retains its old catalog.

```text
Use poteto-mode-portable to fix this bug.
Use poteto-mode-portable to interrogate this diff.
Use poteto-mode-portable to configure pstack.
```

Directly installed practices can also be invoked by name. Cursor-dependent workflows enter through the wrapper.
