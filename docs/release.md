# Release flow

A merge to `main` is a release.
Codex installs from the marketplace on `main` and follows every commit there.
Claude Code installs a new copy only when the plugin version changes.

## Upstream synchronization

A scheduled agent checks upstream `cursor/plugins` once a day.
It acts only when a commit after the last complete review changes `pstack/`.
Other plugins in that repository move its head every day, so a head change alone is not a reason to act.
The agent follows `.agents/skills/sync-pstack-upstream/SKILL.md` and opens one pull request from a `claude/` branch.
The pull request moves the submodule, the `pstack` plugin pin, the file list, and the review record together.
It also raises the wrapper patch version in the three manifests, so the merge is a complete release.
A review that the skill does not let the agent mark complete goes up as a draft that states the gap.
The agent never merges, tags, or pushes to `main`. A maintainer reviews and merges.

## Tags

`.github/workflows/release.yml` runs the checks on every pull request and every push to `main`.
After the checks pass on `main`, it reads the wrapper version and creates the annotated tag `v<version>` and a GitHub release.
It does nothing when that tag already exists, so a push without a version bump releases nothing.
That case gets a warning, because Codex users receive the commit and Claude Code users do not.
The workflow uses `gh` and `git` from the runner and no actions.
This keeps it inside the repository rule that allows only pinned GitHub-owned actions, and it removes action pins from upkeep.

A tag gives a fixed ref for installation:

```sh
claude plugin marketplace add meganemura/pstack-portable#v0.4.0
codex plugin marketplace add meganemura/pstack-portable --ref v0.4.0
```

The marketplace on a tag pins the `pstack` plugin to the commit that the wrapper at that tag fingerprints.
