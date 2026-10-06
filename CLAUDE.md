# Project conventions

This repository is public.

- Write commit messages, code comments, and documents in English.
- Keep `README.md` and `README.ja.md` in sync. Write one sentence per line in both.
- Keep upstream pstack unchanged. Put host differences in the wrapper skill under `skills/poteto-mode-portable/`.
- Synchronize upstream by moving the `upstream/plugins` submodule. Record the review in `docs/upstream-sync/<target-commit>.md` in the same change.
- Run `node --test tests/script-adapters.test.mjs` before a commit that changes a script. It reads upstream from the submodule.
