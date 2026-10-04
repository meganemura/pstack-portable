# pstack-portable

A small execution adapter for upstream [pstack](https://github.com/cursor/plugins/tree/main/pstack), for Claude Code, Codex, and Cursor.
Upstream owns the workflows. This package keeps one wrapper skill and environment-specific translations.
The wrapper skill is `poteto-mode-portable`. Invoke it as `/poteto-mode-portable` where you would invoke upstream `/poteto-mode`.

## Use

For local checkouts, follow [Install from local checkouts](docs/install-local.md).
That profile registers 28 compatible upstream skills and this wrapper for Claude Code, Cursor, and Codex.
The full upstream checkout supplies the remaining workflows through the wrapper.
The following remote installation is an alternative that registers every upstream skill.
The skills CLI documents installation as `npx skills add <source>` in its [CLI reference](https://www.skills.sh/docs/cli).
Install the wrapper from `meganemura/pstack-portable` after authenticating Git access to this private repository.

```sh
npx skills add https://github.com/cursor/plugins/tree/main/pstack
npx skills add meganemura/pstack-portable
```

Choose all upstream pstack skills from the first source, and `poteto-mode-portable` from the second.
Select Claude Code, Codex, and Cursor as installation targets through your installer's supported options.
Keep each installed skill's resources with its `SKILL.md`.
The installer manages the destination copies or links. Reinstall after editing the source to update installed content.
If upstream skill names conflict with existing skills, register only this wrapper and retain an upstream checkout as its readable dependency.
Set the checkout's absolute root in the local file `~/.agents/pstack-upstream.json`:

```json
{"root": "/absolute/path/to/plugins/pstack"}
```

This file stays on the user's machine. It does not belong in this repository.
You can also try it without installation by asking the agent to read the wrapper at its absolute path.

```text
Read pstack-portable/skills/poteto-mode-portable/SKILL.md and use it to investigate this bug.
The upstream pstack root is ./pstack.
```

After skill discovery, ask either environment:

```text
Use poteto-mode-portable to review this diff with upstream interrogate.
Use poteto-mode-portable to configure pstack for this project.
```

The wrapper resolves individual installed upstream skills; it does not require a common repository root.
It can also resolve the sibling `pstack` tree in this checkout.
Repository-level agent prompts omitted by the installer are recovered from the recorded upstream commit when needed.
An unavailable source revision or network access can leave those specific lanes unresolved.
Invoking the original `poteto-mode` directly bypasses this wrapper.

## Scope

Upstream executable resources use [script preflight and explicit adapters](skills/poteto-mode-portable/references/executables.md).
The wrapper provides a Git-only worktree audit, blocks unknown or changed scripts, and checks bootstrap prerequisites before execution.
The non-Cursor plan-checker gate remains unresolved because its required program markers are Cursor-specific.
Hook and Cursor Automations registration are separate from skill installation; this wrapper does not install them.

Model settings are separate for each execution environment:

| Environment | Project file | Global file |
| --- | --- | --- |
| Codex | `.pstack/models/codex.md` | `~/.agents/pstack/models/codex.md` |
| Claude Code | `.pstack/models/claude-code.md` | `~/.agents/pstack/models/claude-code.md` |
| Cursor | `.pstack/models/cursor.md` | `~/.agents/pstack/models/cursor.md` |

The active environment's project file takes precedence over its global file.
Run `setup-pstack` through this wrapper inside each environment to configure its native agents.
For example, ask Claude Code to configure pstack globally, then run setup in Codex to configure Codex independently.
Existing model choices stay at their current scope unless you request a different scope.
Model IDs and reasoning effort are separate values. See [the settings contract](skills/poteto-mode-portable/references/settings.md) for effort overrides and migration.
The wrapper uses native delegation within the active application; it does not launch another agent application or provider CLI.

The adapter handles delegation, settings, model availability, workspace isolation, history, and external skill references.
It does not supply cross-provider runners, cloud workers, durable scheduling, or hooks.
It reports missing capabilities instead of claiming equivalent execution.
See [the design decision](docs/adapter-design.md) for the boundary and validation cases.

## License

Original wrapper contributions are [MIT-licensed](LICENSE).
Upstream pstack attribution and its preserved MIT license are recorded in [NOTICE.md](NOTICE.md) and [LICENSE-pstack](LICENSE-pstack).
The installable skill carries both license texts and its attribution notice so they remain available after a skills-only installation.
