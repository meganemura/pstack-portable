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
Clone it with `git clone --recurse-submodules https://github.com/meganemura/pstack-portable`. In an existing clone, run `git submodule update --init`.
Use `<clone>/upstream/plugins/pstack` as `pstack_source`.
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
```

The installer manages destination copies and agent links. Local source changes require reinstallation.
Preserve upstream licensing in each copied skill folder. The upstream license lives at the checkout root, which a skills-only installer can omit.
For every selected skill, copy `<pstack-source>/LICENSE` to `<installed-skill>/LICENSE-pstack` after verifying its source.
Keep Lauren Tan's copyright notice and the full MIT text unchanged. Do not overwrite a different existing notice.
Repeat this step after reinstallation if the installer replaces the skill folder.
The wrapper's own skill folder already contains its license and upstream attribution resources.
Retain the full upstream checkout, including `agents`, `scripts`, and skill resources.
Its workflows can read and execute those resources through the wrapper without registering every upstream skill.

## Link the wrapper from the clone

Link the wrapper so that it reads the pinned submodule and follows each `git pull` without reinstallation.
Codex and Cursor read `~/.agents/skills`. Claude Code reads `~/.claude/skills`.
Claude Code follows these links. In Codex and Cursor, confirm that the skill appears after linking. Otherwise use the copy below.
Check both destinations first. Move an existing `poteto-mode-portable` or `pstack-portable` entry out of the way after you inspect it.

```sh
clone=/absolute/path/to/pstack-portable
ln -s "$clone/skills/poteto-mode-portable" ~/.agents/skills/poteto-mode-portable
ln -s ../../.agents/skills/poteto-mode-portable ~/.claude/skills/poteto-mode-portable
```

The skills installer copies the wrapper instead:

```sh
DISABLE_TELEMETRY=1 skills add "$clone" -g -a claude-code cursor codex -s poteto-mode-portable -y
```

A copy cannot reach the submodule. Reinstall it after each pull, and record the upstream root as the next section shows.

## Record the upstream root for a copied wrapper

A linked wrapper needs no record. For a copy, save the absolute path of `<clone>/upstream/plugins/pstack` in `~/.agents/pstack-upstream.json`. Keep this machine-specific file outside Git.
If the file already exists, update its `root` value while preserving other fields.

```json
{"root": "/absolute/path/to/pstack-portable/upstream/plugins/pstack"}
```

`upstream-root.mjs` compares that root with the pinned commit and reports a stale record.
This root also supplies the original agent definitions, so this profile does not need to download missing prompts.

## Verify and use

```sh
skills list -g -a claude-code cursor codex
```

Check all 31 selected skills and `poteto-mode-portable` at the actual destination paths.
Compare installed files with their selected source folders, including references and scripts.
Verify each installed upstream skill also retains `LICENSE-pstack` with the original license text.
Run `node "$clone/skills/poteto-mode-portable/scripts/upstream-root.mjs"`. Expect `"status": "MATCHED"` and the submodule as the selected root.
Skill discovery occurs when the application refreshes its catalog; use a new session if the running session retains its old catalog.

```text
Use poteto-mode-portable to fix this bug.
Use poteto-mode-portable to interrogate this diff.
Use poteto-mode-portable to configure pstack.
```

Directly installed practices can also be invoked by name. Cursor-dependent workflows enter through the wrapper.

## Update after git pull

Record the pinned upstream commit, pull, and fetch the submodule:

```sh
cd /absolute/path/to/pstack-portable
before=$(git rev-parse --verify --quiet HEAD:upstream/plugins)
git pull
git submodule update --init
after=$(git rev-parse HEAD:upstream/plugins)
```

An empty `before` means the previous commit had no submodule. Treat that as a change.
A linked wrapper needs no other step for itself. Reinstall a copied wrapper.
When `before` and `after` differ, reinstall the 31 upstream skills from the submodule. Then copy `LICENSE-pstack` into each skill folder again.
When they match, leave the upstream skills as they are.
Run `upstream-root.mjs` last. If its notes name `~/.agents/pstack-upstream.json`, remove that file for a linked wrapper. For a copy, point it at the submodule.
