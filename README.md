# pstack-portable

> [!IMPORTANT]
> This repository is archived and is no longer maintained.
> Upstream [pstack](https://github.com/cursor/plugins/tree/main/pstack) now supports Claude Code, so use upstream directly in Claude Code.
> It gets no more updates, upstream syncs, or fixes.
> The last release is `v0.4.5`, which pins upstream pstack at the commit that it supports.
> Existing installs continue to work at that release, but they do not get new upstream changes.

Run upstream [pstack](https://github.com/cursor/plugins/tree/main/pstack) in Claude Code and Codex.
Upstream owns the workflows.
This repository adds one wrapper skill, `poteto-mode-portable`, that translates Cursor tools into the tools of the current host.
Use it where upstream uses `/poteto-mode`.

## Install

This repository is a plugin marketplace with two plugins.
`pstack-portable` is the wrapper.
`pstack` is upstream pstack, unchanged and pinned to the commit that the wrapper supports.
The wrapper reads the files of the `pstack` plugin, so install `pstack` and keep it disabled.

Claude Code installs `pstack` disabled:

```sh
claude plugin marketplace add meganemura/pstack-portable
claude plugin install pstack-portable@pstack-portable
claude plugin install pstack@pstack-portable
```

Codex:

```sh
codex plugin marketplace add meganemura/pstack-portable
codex plugin add pstack-portable@pstack-portable
codex plugin add pstack@pstack-portable
```

Then set `enabled = false` under `[plugins."pstack@pstack-portable"]` in `~/.codex/config.toml`.

If you linked or copied `poteto-mode-portable` before, remove it from `~/.agents/skills` and `~/.claude/skills`.

### Update

- Claude Code: `claude plugin marketplace update pstack-portable`, then `claude plugin update` for each plugin.
- Codex: `codex plugin marketplace upgrade pstack-portable`.

Each release has a `v<version>` tag.
To stay on one release, add the marketplace at its tag: `meganemura/pstack-portable#v<version>` in Claude Code, or `--ref v<version>` in Codex.

### Other setups

Cursor runs upstream pstack natively and does not need the wrapper.
The wrapper manifest in `.cursor-plugin/` is untested.
To install from a clone instead of a plugin, follow [Install from local checkouts](docs/install-local.md).

## Use

Ask for a pstack workflow through the wrapper:

```text
Use poteto-mode-portable to fix this bug.
Use poteto-mode-portable to interrogate this diff.
Use poteto-mode-portable to tdd this fix.
```

As a slash command, the plugin skill is `/pstack-portable:poteto-mode-portable`.

Each host keeps its own model settings.
In each host, ask `Use poteto-mode-portable to configure pstack.`
The setup writes `.pstack/models/<host>.md` for one project, or `~/.agents/pstack/models/<host>.md` for all projects, where `<host>` is `claude-code` or `codex`.
The project file takes precedence.

## Limits

The wrapper delegates only to subagents of the current host.
It does not start other agent applications or provider CLIs.
It does not provide hooks, Cursor Automations, cloud workers, or durable schedules.
It blocks upstream scripts that it does not know or that changed, and it checks script prerequisites before a run.
When a workflow needs a capability that the host does not have, the wrapper reports the gap instead of a substitute result.

## License

The wrapper is [MIT-licensed](LICENSE).
Upstream pstack attribution and its MIT license are in [NOTICE.md](NOTICE.md) and [LICENSE-pstack](LICENSE-pstack).

---

[Japanese](README.ja.md)
