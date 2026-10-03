# pstack-portable

A small execution adapter for upstream [pstack](https://github.com/cursor/plugins/tree/main/pstack), for Claude Code and Codex.
Upstream owns the workflows. This package keeps one wrapper skill and environment-specific translations.

## Use

Use the skills installer to install upstream pstack and `pstack-portable` for both Claude Code and Codex.
Select all pstack skills for the full mode, and select `pstack-portable` from the wrapper package.
The skills CLI documents installation as `npx skills add <source>` in its [CLI reference](https://www.skills.sh/docs/cli).
Install the wrapper from `meganemura/pstack-portable` after authenticating Git access to this private repository.

```sh
npx skills add https://github.com/cursor/plugins/tree/main/pstack
npx skills add meganemura/pstack-portable
```

Choose all upstream pstack skills from the first source, and `pstack-portable` from the second.
Select Claude Code and Codex as installation targets through your installer's supported options.
Keep each installed skill's resources with its `SKILL.md`.
You can also try it without installation by asking the agent to read the wrapper at its absolute path.

```text
Read pstack-portable/skills/pstack-portable/SKILL.md and use it to investigate this bug.
The upstream pstack root is ./pstack.
```

After skill discovery, ask either environment:

```text
Use pstack-portable to review this diff with upstream interrogate.
Use pstack-portable to configure pstack for this project.
```

The wrapper resolves individual installed upstream skills; it does not require a common repository root.
It can also resolve the sibling `pstack` tree in this checkout.
Repository-level agent prompts omitted by the installer are recovered from the recorded upstream commit when needed.
An unavailable source revision or network access can leave those specific lanes unresolved.
Invoking the original `poteto-mode` directly bypasses this wrapper.

## Scope

The adapter handles delegation, settings, model availability, workspace isolation, history, and external skill references.
It does not supply cross-provider runners, cloud workers, durable scheduling, or hooks.
It reports missing capabilities instead of claiming equivalent execution.
See [the design decision](docs/adapter-design.md) for the boundary and validation cases.
