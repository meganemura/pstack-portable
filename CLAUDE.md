# Project conventions

This repository is public.

- Write commit messages, code comments, and documents in English.
- Keep `README.md` and `README.ja.md` in sync. Write one sentence per line in both.
- Keep upstream pstack unchanged. Put host differences in the wrapper skill under `skills/poteto-mode-portable/`.
- Synchronize upstream by moving the `upstream/plugins` submodule. Move the `pstack` plugin sha in `.claude-plugin/marketplace.json`, regenerate `upstream-tree.json`, and record the review in `docs/upstream-sync/<target-commit>.md` in the same change.
- Merge only release-ready work to `main`. Codex installs from the marketplace on `main` and follows every commit there. Develop on branches.
- Bump the wrapper version in `.claude-plugin/marketplace.json`, `.codex-plugin/plugin.json`, and `.cursor-plugin/plugin.json` together for each release.
- Run `node --test tests/script-adapters.test.mjs` before a commit that changes a script. It reads upstream from the submodule.
