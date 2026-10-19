import { readdir, readFile, stat } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

import type { BrainConfig } from "../config.js";

export const MAX_READ_BYTES = 64 * 1024;
export const DEFAULT_SEARCH_RESULTS = 50;
export const MAX_SEARCH_RESULTS = 200;

export interface SourcePath {
  configured: string;
  absolute: string;
}

export interface SearchMatch {
  path: string;
  line: number;
  text: string;
}

export function sourcePaths(root: string, config: BrainConfig): SourcePath[] {
  return config.context.sources.map((configured) => ({
    configured,
    absolute: resolve(root, configured),
  }));
}

function isInside(root: string, path: string): boolean {
  const relativePath = relative(root, path);
  return relativePath === "" || (!relativePath.startsWith(`..${sep}`) && relativePath !== ".." && !isAbsolute(relativePath));
}

export function sourceForPath(root: string, config: BrainConfig, requested: string): string {
  if (isAbsolute(requested)) {
    throw new Error(`path must be relative to the project root: ${requested}`);
  }
  const absolute = resolve(root, requested);
  const source = sourcePaths(root, config).find((candidate) => {
    return isInside(candidate.absolute, absolute);
  });
  if (!source || !isInside(root, absolute)) {
    throw new Error(`path "${requested}" is outside the configured sources`);
  }
  return absolute;
}

async function walk(directory: string, root: string, results: string[]): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(path, root, results);
    } else if (entry.isFile()) {
      results.push(path);
    }
  }
}

export async function sourceFiles(root: string, config: BrainConfig): Promise<{ files: string[]; missing: string[] }> {
  const files: string[] = [];
  const missing: string[] = [];
  for (const source of sourcePaths(root, config)) {
    try {
      const sourceStat = await stat(source.absolute);
      if (sourceStat.isDirectory()) {
        await walk(source.absolute, root, files);
      } else if (sourceStat.isFile()) {
        files.push(source.absolute);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        missing.push(source.configured);
        continue;
      }
      throw error;
    }
  }
  return { files, missing };
}

export async function searchSources(
  root: string,
  config: BrainConfig,
  query: string,
  limit = DEFAULT_SEARCH_RESULTS,
): Promise<{ matches: SearchMatch[]; truncated: boolean; missing: string[] }> {
  let expression: RegExp;
  try {
    expression = new RegExp(query);
  } catch (error) {
    throw new Error(`invalid search pattern: ${error instanceof Error ? error.message : String(error)}`);
  }

  const { files, missing } = await sourceFiles(root, config);
  const matches: SearchMatch[] = [];
  let truncated = false;
  for (const file of files.sort()) {
    const content = await readFile(file, "utf8");
    if (content.includes("\u0000")) continue;
    const lines = content.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      if (!expression.test(lines[index])) continue;
      expression.lastIndex = 0;
      matches.push({ path: relative(root, file), line: index + 1, text: lines[index] });
      if (matches.length >= Math.min(limit, MAX_SEARCH_RESULTS)) {
        truncated = true;
        break;
      }
    }
    if (truncated) break;
  }
  return { matches, truncated, missing };
}

export async function listSources(root: string, config: BrainConfig): Promise<string[]> {
  const lines: string[] = [];
  for (const source of sourcePaths(root, config)) {
    try {
      const sourceStat = await stat(source.absolute);
      if (!sourceStat.isDirectory()) {
        lines.push(`${source.configured}\t1 file\t${sourceStat.size} bytes`);
        continue;
      }
      const { files } = await sourceFiles(root, { ...config, context: { ...config.context, sources: [source.configured] } });
      let bytes = 0;
      for (const file of files) bytes += (await stat(file)).size;
      lines.push(`${source.configured}\t${files.length} files\t${bytes} bytes`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        lines.push(`${source.configured}\tmissing`);
        continue;
      }
      throw error;
    }
  }
  return lines;
}

export async function readSourceFile(
  root: string,
  config: BrainConfig,
  requested: string,
  startLine = 1,
  endLine?: number,
): Promise<{ text: string; truncated: boolean; startLine: number; endLine: number }> {
  const path = sourceForPath(root, config, requested);
  const buffer = await readFile(path);
  const truncated = buffer.byteLength > MAX_READ_BYTES;
  const content = buffer.subarray(0, MAX_READ_BYTES).toString("utf8");
  const lines = content.split(/\r?\n/);
  const first = Math.max(1, startLine);
  const last = Math.min(endLine ?? lines.length, lines.length);
  if (first > last) {
    return { text: "", truncated, startLine: first, endLine: last };
  }
  return {
    text: lines.slice(first - 1, last).join("\n"),
    truncated,
    startLine: first,
    endLine: last,
  };
}
