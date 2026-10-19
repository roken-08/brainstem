import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "@iarna/toml";

export const CONFIG_FILE = "brain.toml";

export const EXAMPLE_CONFIG = `# brainstem — one brain, every agent

[project]
name = "acme-api"
summary = "Billing service. Go, Postgres, no ORM. Deploy is a single container."

[conventions]
rules = [
  "Never guess a library API. Check the installed version first.",
  "Run the tests before claiming a change works.",
  "After two failed attempts at the same fix, stop and report what was tried.",
  "Keep responses short. No preamble.",
]

[context]
sources = ["docs", "notes"]
files = ["README.md"]

[scripts]
test = "npm test"
lint = "npm run lint"

[targets]
agents = true
claude = true
cursor = true
copilot = true
skill = true
`;

export type TargetName = "agents" | "claude" | "cursor" | "copilot" | "skill";

export interface ProjectConfig {
  name: string;
  summary: string;
}

export interface ContextConfig {
  sources: string[];
  files: string[];
}

export interface TargetsConfig {
  agents: boolean;
  claude: boolean;
  cursor: boolean;
  copilot: boolean;
  skill: boolean;
}

export interface BrainConfig {
  project: ProjectConfig;
  conventions: string[];
  context: ContextConfig;
  scripts: Record<string, string>;
  targets: TargetsConfig;
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

const TARGET_NAMES: TargetName[] = ["agents", "claude", "cursor", "copilot", "skill"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new ConfigError(`${path} must be a table`);
  }
  return value;
}

function checkKeys(value: Record<string, unknown>, allowed: readonly string[], path: string): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) {
      throw new ConfigError(`unknown key "${key}" at ${path}; remove it or check the spelling`);
    }
  }
}

function requiredString(value: Record<string, unknown>, key: string, path: string): string {
  const result = value[key];
  if (typeof result !== "string" || result.trim() === "") {
    throw new ConfigError(`${path}.${key} must be a non-empty string`);
  }
  return result;
}

function stringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new ConfigError(`${path} must be an array of strings`);
  }
  return value.map((item) => item as string);
}

function optionalStringArray(
  value: Record<string, unknown>,
  key: string,
  path: string,
): string[] {
  return value[key] === undefined ? [] : stringArray(value[key], `${path}.${key}`);
}

function parseTargets(value: unknown): TargetsConfig {
  const targets = value === undefined ? {} : asRecord(value, "targets");
  checkKeys(targets, TARGET_NAMES, "targets");
  const result = {} as TargetsConfig;
  for (const name of TARGET_NAMES) {
    if (targets[name] !== undefined && typeof targets[name] !== "boolean") {
      throw new ConfigError(`targets.${name} must be a boolean`);
    }
    result[name] = targets[name] === undefined ? true : (targets[name] as boolean);
  }
  return result;
}

export function parseConfig(text: string): BrainConfig {
  let parsed: unknown;
  try {
    parsed = parse(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new ConfigError(`could not parse brain.toml: ${message}`);
  }

  const root = asRecord(parsed, "root");
  checkKeys(root, ["project", "conventions", "context", "scripts", "targets"], "root");

  const project = asRecord(root.project, "project");
  checkKeys(project, ["name", "summary"], "project");

  const conventions = root.conventions === undefined ? {} : asRecord(root.conventions, "conventions");
  checkKeys(conventions, ["rules"], "conventions");

  const context = root.context === undefined ? {} : asRecord(root.context, "context");
  checkKeys(context, ["sources", "files"], "context");

  const scripts = root.scripts === undefined ? {} : asRecord(root.scripts, "scripts");
  for (const [name, command] of Object.entries(scripts)) {
    if (typeof command !== "string" || command.trim() === "") {
      throw new ConfigError(`scripts.${name} must be a non-empty string`);
    }
  }

  return {
    project: {
      name: requiredString(project, "name", "project"),
      summary: requiredString(project, "summary", "project"),
    },
    conventions: optionalStringArray(conventions, "rules", "conventions"),
    context: {
      sources: optionalStringArray(context, "sources", "context"),
      files: optionalStringArray(context, "files", "context"),
    },
    scripts: { ...scripts } as Record<string, string>,
    targets: parseTargets(root.targets),
  };
}

export async function loadConfig(root: string): Promise<BrainConfig> {
  const path = resolve(root, CONFIG_FILE);
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new ConfigError(`brain.toml not found; run "brainstem init" to create one`);
    }
    throw new ConfigError(`could not read ${CONFIG_FILE}: ${String(error)}`);
  }
  return parseConfig(text);
}
