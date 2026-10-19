import { readFile } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";

import type { BrainConfig } from "./config.js";
import type { ContextFile } from "./render.js";

function insideRoot(root: string, path: string): boolean {
  const relativePath = relative(root, path);
  return relativePath === "" || (!relativePath.startsWith("..") && !isAbsolute(relativePath));
}

export async function loadContextFiles(root: string, config: BrainConfig): Promise<ContextFile[]> {
  const files: ContextFile[] = [];
  for (const configuredPath of config.context.files) {
    const path = resolve(root, configuredPath);
    if (!insideRoot(root, path)) {
      throw new Error(`context file "${configuredPath}" must stay inside the project root`);
    }
    try {
      files.push({ path: configuredPath, content: await readFile(path, "utf8") });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        // A freshly initialized project may not have its optional context files yet.
        // Include them as soon as they appear without blocking static compilation.
        continue;
      }
      throw new Error(`could not read context file "${configuredPath}": ${String(error)}`);
    }
  }
  return files;
}
