# Upstream workflows with execution adapters

## Decision

Keep upstream pstack unchanged. Load one portable entry skill before reading upstream workflows.
Use separate Claude Code, Codex, and Cursor references for tool differences, plus one shared capability contract.
Distinct skill names preserve an explicit choice between original and adapted execution.

The entry skill resolves an installed skill map and passes that map and the adapter contract to every child.
This prevents nested workflows from returning to Cursor tool parameters after the first translation.
Settings use upstream role labels, but the wrapper reads portable files explicitly.
The normal distribution installs original pstack skills and this wrapper through a skills installer.
Individual skill copies retain local resources. Missing repository-level prompts require retrieval from a verified source revision.
This avoids bundling prompt copies that would need separate synchronization with upstream.
An alternative registers only the wrapper and reads upstream from a local checkout.
This avoids name collisions and direct activation of unadapted upstream skills.
The local source-location file records that checkout outside the wrapper repository.
The local installation profile registers 23 principles and five compatible practice skills alongside the wrapper.
Cursor-dependent workflows stay in the selected checkout and execute through the adapter.
Before installation, report destination collisions. An authorized replacement can affect every agent reading the shared directory.

## Limits

Markdown instructions guide the agent; they cannot intercept tool calls or guarantee precedence over higher-level instructions.
An upstream update can introduce a new execution dependency. The agent must check and map it before use.
Multi-model execution needs actual supported models or an existing runner. Multiple agents on one model do not provide model diversity.
Cloud execution and durable wake-up need concrete equivalents. Missing capability leaves the corresponding gate unresolved.

## Validation cases

| Request or condition | Expected result |
| --- | --- |
| A bug task in Codex | Read the Codex adapter, upstream mode, and bug playbook; dispatch only supported parameters |
| A bug task in Claude Code | Read the Claude adapter; carry the contract into native child briefs |
| Direct interrogate request | Load upstream interrogate with the same contract |
| Skills installed as separate folders | Resolve each skill through its installed path; resolve resources relative to that folder |
| Installer omits Comment Sicko | Recover the prompt at the verified source revision or leave that lane unresolved |
| GPT, Claude, and Grok panel with only one family available | Report the gap; obtain a supported selection before claiming the diversity gate |
| Concurrent feature workers | Assign separate writable worktrees before spawning |
| Setup on either environment | Confirm model choices before writing portable project settings |
| An unreadable upstream installation | Request a readable root; do not fabricate upstream prompts |
| No wake mechanism for an overnight run | Leave a checkpoint; report that continuation is unavailable |
| Cursor-dependent audit script | Inspect its assumptions before running it; retain evidence gaps in the verdict |

Initial validation checks local file links, frontmatter, upstream resolution, and the written contract against these cases.
Actual end-to-end behavior in both applications requires supervised usage. Static checks do not establish runtime portability.
