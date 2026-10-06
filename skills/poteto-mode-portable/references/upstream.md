# Resolve installed upstream skills

The normal installation contains upstream pstack skills and this wrapper. A repository checkout is optional.
Skills installers may copy or symlink individual skill folders without copying repository-level agent definitions.

## Skill map

Prefer a user-supplied upstream location, then the `root` path in `~/.agents/pstack-upstream.json` when that file exists.
This local file is source-location data. Validate that the root contains `skills/poteto-mode/SKILL.md` before using it.
Next, use the wrapper repository's pinned submodule at `../../upstream/plugins/pstack`, relative to this skill's real directory.
It exists when the wrapper links to a clone with initialized submodules. Its commit matches the executable fingerprints.
Otherwise use the active session's exposed skill locations.
When a catalog is incomplete, inspect the active project's and user's configured skill directories for pstack skill folders.
Use targeted discovery of `poteto-mode/SKILL.md`, `interrogate/SKILL.md`, and required `principle-*/SKILL.md` files.
Common roots include `.agents/skills` and `.claude/skills`; use the actual environment configuration rather than assuming those paths.
Resolve symlinks before looking for adjacent resources.

Create a map from upstream skill folder names to absolute `SKILL.md` paths.
Frontmatter display names can differ from folder names, such as `Poteto Mode` and `poteto-mode`.
Resolve a routed skill through this map. Resolve its playbooks, references, and scripts relative to that skill's real directory.
An installed skill folder need not have a surrounding `skills` directory.
Keep one selected source per skill. When available, verify its installer source is `cursor/plugins` with the `pstack` subdirectory.
Do not combine an adapted fork and original pstack without the user's explicit selection.

## Repository-level resources

Use a readable installed agent definition or a full upstream checkout when available.
For a resource omitted by skills installation, recover the exact upstream file without copying its content into this wrapper.
Read the source commit from the installer's lock or source metadata when present. Use that commit with `https://raw.githubusercontent.com/cursor/plugins/<commit>/pstack/<resource>`.
Fetch only the required file through an available read tool, or store it in a task-local cache through an authorized network tool.
Verify the resource belongs to the selected upstream revision. Pass the readable cached file to children.
If the installer records only a content hash, do not treat it as a Git commit.
If a revision cannot be established, use a provided checkout or report the version gap before proposing a current upstream resource.
Do not silently mix installed skills with agent prompts from a different revision.
If retrieval is unavailable, keep the dependent lane unresolved and finish independent work.

For `poteto-agent`, the execution requirement is to read upstream `poteto-mode` in full before work and its principle leaves when applied.
When its separate agent file is unavailable, enforce that requirement through the child brief and report this substitution.
For richer prompts such as Comment Sicko, recover the actual definition; do not invent an equivalent reviewer.

## Installation coverage

With a full checkout selected through `pstack-upstream.json` or the pinned submodule, resolve every routed skill and agent definition from that checkout.
Only the compatible practice profile needs direct registration; the other workflows remain readable dependencies.
With installed skills alone, the full mode needs all routed upstream skills. Installing only `poteto-mode` does not install them automatically.
For a narrow workflow, resolve its required skills before execution and report any missing dependency by name.
Keep a task-local record of selected skill paths, recovered resources, revision evidence, and capability gaps.
