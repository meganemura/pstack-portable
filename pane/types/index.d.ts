// The contract of pstack-pane: the Run it derives from a session's tool uses, the preview it
// holds for the selected artifact, and the $.state values it keeps them in. Self-contained: it
// imports nothing, so another plugin can read these values typed.

export type RunEntry = 'poteto-mode-portable' | 'poteto-mode'

export type Run = {
  entry: RunEntry | null
  playbook: string | null
  skills: string[]
  steps: Step[]
  delegates: Delegate[]
  artifacts: Artifact[]
}

export type Step = { id: string; subject: string; status: 'pending' | 'in_progress' | 'completed' }

export type Delegate = { id: string; description: string; agentType: string; state: 'running' | 'done' | 'failed' }

export type Artifact = { path: string; kind: ArtifactKind; touches: number; seq: number }

export type ArtifactKind =
  | 'decision-trail'
  | 'standing-orders'
  | 'status'
  | 'human-gates'
  | 'units'
  | 'ledger'
  | 'frontier'
  | 'overview'
  | 'plan'
  | 'resume-note'
  | 'arena-candidate'
  | 'swarm-output'

export type Preview = { path: string; text: string } | { path: string; error: string }

declare module 'claude-code' {
  interface PluginState {
    'pstack-pane': {
      run: Run
      preview: Preview | null
      cwd: string
      hasAutoOpened: boolean
    }
  }
}
