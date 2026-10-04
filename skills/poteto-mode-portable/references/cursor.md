# Cursor execution adapter

Upstream pstack targets Cursor. Retain its native tool calls when the active schema supports them.
Verify the requested model, cloud environment, and named agent are available before execution.
Installing skills alone does not register the repository's named agent definitions as native agent types.
Read a required definition through `upstream.md` and pass its prompt to a supported general agent when necessary.

Use `settings.md` to select Cursor settings. Codex and Claude sheets are not fallbacks.
For setup through this wrapper, save the active Cursor portable sheet at the selected scope.
Native upstream setup, invoked directly, retains its original Cursor settings behavior.

Use actual cloud and wake capabilities when exposed; installing this skill does not provision them.
Carry the wrapper contract and selected Cursor settings into native children.
