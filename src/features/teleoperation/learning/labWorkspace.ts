import type { GuidedLabId } from "./guidedLabs";

export type LabWorkspaceModule = "commands" | "scene" | "trace" | "timeline" | "safety";

export interface LabWorkspaceDefinition {
  focus: string;
  modules: LabWorkspaceModule[];
}

export const labWorkspaces: Record<GuidedLabId, LabWorkspaceDefinition> = {
  baseline: {
    focus: "Send one command. Compare the real machine with the operator's last view.",
    modules: ["commands", "scene"],
  },
  latency: {
    focus: "Change round-trip latency. Follow one command out and its feedback back.",
    modules: ["commands", "scene", "trace"],
  },
  jitter: {
    focus: "Send several commands. Compare how long each one takes to arrive.",
    modules: ["commands", "timeline"],
  },
  loss: {
    focus: "Send several commands. Watch for one that never reaches the machine.",
    modules: ["commands", "trace"],
  },
  stale: {
    focus: "Send quick corrections. Watch the edge computer reject intent that arrived too late.",
    modules: ["commands", "trace"],
  },
  disconnect: {
    focus: "Start moving, disconnect the network, and watch the local heartbeat rule stop the machine.",
    modules: ["commands", "scene", "safety"],
  },
  "local-control": {
    focus: "Set a target. Watch the machine continue locally between slow network updates.",
    modules: ["scene"],
  },
};

export function getLabWorkspace(id: GuidedLabId): LabWorkspaceDefinition {
  return labWorkspaces[id];
}
