# pstack-pane

A Claude Code mod that shows the intermediate artifacts of a poteto-mode run in a pane beside the transcript.
The design is in [docs/pane-design.md](../docs/pane-design.md).

## What it shows

- **Run.** The entry skill, the selected playbook, and the upstream skills the run read.
- **Steps.** The task list: `[x]` done, `[>]` in progress, `[ ]` pending.
- **Delegates.** Each subagent with its state, description, and agent type.
- **Artifacts.** Each known artifact file, newest first. Press one to preview it below the list: a TSV file as a table, Markdown as Markdown, anything else as code.

The pane opens by itself the first time a session starts a poteto-mode run.
`/pstack-pane` hides and shows it, and the mod remembers that choice.
While the pane is hidden, the status line names the run and its artifact count.
Where no pane can be drawn (`claude -p`, VS Code), `/pstack-pane` answers with a text summary.

It runs in Claude Code only, and it reads only the session's own tool uses and the artifact files.

## Install

```
claude plugin install pstack-pane@pstack-portable
```

## Develop

Load the folder for one session, with hot reload on save:

```
claude --plugin-dir ./pane
```

Where no flag can be given, name the folder in `CLAUDE_CODE_PLUGIN_DIRS` (an absolute path).

Three checks, from the repository root:

```
claude plugin validate pane
npx --yes --package typescript@7.0.2 tsc -p pane
claude plugin test pane
```

`tsc` reads the API declarations from `pane/.claude-plugin/types/`, which is not committed.
An interactive session that loads the folder with `--plugin-dir` writes them there.
Without one, copy the declarations that the plugin-authoring skill of the same Claude Code build ships (`types/claude-code.d.ts`) to `pane/.claude-plugin/types/claude-code/index.d.ts`.
