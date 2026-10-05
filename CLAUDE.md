# Project conventions

This repository is public.

- Write commit messages, code comments, and documents in English.
- Keep `README.md` and `README.ja.md` in sync. Write one sentence per line in both.
- Keep upstream pstack unchanged. Put host differences in the wrapper skill under `skills/poteto-mode-portable/`.
- Record an upstream synchronization in `docs/upstream-sync/<target-commit>.md`.
- Run `PSTACK_UPSTREAM_ROOT=<pstack root at the fingerprinted commit> node --test tests/script-adapters.test.mjs` before a commit that changes a script.
