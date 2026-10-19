import { renderGeneratedMarkdown, type DocumentModel, type Target } from "../render.js";

export const claudeTarget: Target = {
  name: "claude",
  outputPath: "CLAUDE.md",
  render(model: DocumentModel): string {
    return renderGeneratedMarkdown(model);
  },
};
