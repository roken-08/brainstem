import type { TargetName } from "../config.js";
import type { Target } from "../render.js";
import { agentsTarget } from "./agents.js";
import { claudeTarget } from "./claude.js";
import { copilotTarget } from "./copilot.js";
import { cursorTarget } from "./cursor.js";
import { skillTarget } from "./skill.js";

export const targets: Record<TargetName, Target> = {
  agents: agentsTarget,
  claude: claudeTarget,
  cursor: cursorTarget,
  copilot: copilotTarget,
  skill: skillTarget,
};

export const targetList: Target[] = Object.values(targets);
