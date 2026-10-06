# Upstream workflows with execution adapters

## Decision

Keep upstream pstack unchanged. Load one portable entry skill before reading upstream workflows.
Use separate Claude Code, Codex, and Cursor references for tool differences, plus one shared capability contract.
Distinct skill names preserve an explicit choice between original and adapted execution.
The entry skill is `poteto-mode-portable`. The name starts with the upstream entry name, so `/poteto-mode` users find the adapted entry next to it.
The repository keeps the name `pstack-portable` because its translations cover every pstack workflow.

The entry skill resolves an installed skill map and passes that map and the adapter contract to every child.
This prevents nested workflows from returning to Cursor tool parameters after the first translation.
Settings use upstream role labels, but the wrapper reads portable files explicitly.
The normal distribution installs original pstack skills and this wrapper through a skills installer.
Individual skill copies retain local resources. Missing repository-level prompts require retrieval from a verified source revision.
This avoids bundling prompt copies that would need separate synchronization with upstream.
An alternative registers only the wrapper and reads upstream from a local checkout.
This avoids name collisions and direct activation of unadapted upstream skills.
The local source-location file records that checkout outside the wrapper repository.
The local installation profile registers 24 principles and seven compatible practice skills alongside the wrapper.
Cursor-dependent workflows stay in the selected checkout and execute through the adapter.
Before installation, report destination collisions. An authorized replacement can affect every agent reading the shared directory.
Model sheets are isolated by environment at project and global scopes. A project sheet overrides the matching global sheet as a whole.
Setup updates only the active environment. Native delegation determines available models and reasoning effort.
The wrapper does not bridge applications or invoke provider CLIs. Cursor can use multiple model families when its own native tool supports them.

## Limits

Executable compatibility has an explicit mapping and a fingerprinted preflight.
Known portable scripts retain upstream implementation. Cursor-dependent worktree auditing uses a wrapper-owned Node adapter.
The Cursor plan-checker gate remains unresolved on other hosts rather than weakening its assertions.
Preflight checks prepared dependencies so upstream bootstrap cannot silently begin an installation after a successful prerequisite check.
Concurrent changes after preflight remain possible; run it immediately before execution and preserve normal file and permission boundaries.
Hooks require event-schema adaptation and separate host registration. The inspected upstream plugin manifest registers skills and agents.
Cursor Automations stay host-specific. They do not become portable by installing skill files.

Markdown instructions guide the agent; they cannot intercept tool calls or guarantee precedence over higher-level instructions.
An upstream update can introduce a new execution dependency. The agent must check and map it before use.
Multi-model execution needs models supported by the active native agent tool. Multiple agents on one model do not provide model diversity.
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
| Codex and Claude sheets in one project | Each host selects its own sheet and carries it into its children |
| A global sheet with no project sheet for that host | Select that host's global sheet and preserve its scope on reconfiguration |
| A project sheet with an invalid environment marker | Report the mismatch; do not silently use global settings |
| An unmarked legacy common sheet | Keep it for review; do not apply it to another host |
| Per-model effort plus a role override | Apply the role override to that role, including all its panel entries |
| An unreadable upstream installation | Request a readable root; do not fabricate upstream prompts |
| No wake mechanism for an overnight run | Leave a checkpoint; report that continuation is unavailable |
| An autopilot audit tick in Claude Code | Arm the native `/loop 1h` with the tick prompt; keep the session open and re-arm it within seven days |
| A multi-phase plan in Codex | Review the plan shape manually; report the plan checker and the hourly tick unresolved |
| A run without a built-in PR tool | Use the forge CLI path that upstream names for that case |
| Cursor-dependent audit script | Inspect its assumptions before running it; retain evidence gaps in the verdict |
| A playbook step names a skill with model invocation disabled | Read its `SKILL.md` by path and run the step; if the host blocked it, report it unresolved |
| Code delegated to a repository-defined agent | Brief carries the contract paths and the quoted Comments rule; the parent runs `no-comments` before review |
| A user rule asks for module header comments | Write a short header with only what the code cannot show |

Initial validation checks local file links, frontmatter, upstream resolution, and the written contract against these cases.
Actual end-to-end behavior in both applications requires supervised usage. Static checks do not establish runtime portability.

## Capacity scheduling evidence

Native capacity applies to the complete agent tree. Waiting parents can occupy slots needed by their required children.
The adapter now reserves descendant capacity before fan-out and assigns admission to one coordinator.
Shared independent grounding precedes candidate fan-out only when the question and immutable source match.
Candidate-specific grounding retains its independent stage. Direct tracing leaves that gate unresolved.

A reported four-slot run filled the root and three worker slots before a candidate requested its explainer.
The report quotes the candidate's account; the original native error was unavailable.
This supports a capacity scheduling gap, while the exact native failure remains unverified.
The four-slot schedule reserves root, diagnostic, candidate, and explainer slots, then releases the candidate lane before the next candidate.
A native tool must confirm release; the adapter does not equate completion or interruption with release.
The shared-grounding schedule completes its independent stages before admitting two candidates without further required children.
Both schedules stay within four slots. Native launch and release behavior still require host execution evidence.
