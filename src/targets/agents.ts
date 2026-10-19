import { renderGeneratedMarkdown, type DocumentModel, type Target } from "../render.js";

export const agentsTarget: Target = {
  name: "agents",
  outputPath: "AGENTS.md",
  render(model: DocumentModel): string {
    return renderGeneratedMarkdown(model);
  },
};
