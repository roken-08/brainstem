import { renderGeneratedMarkdown, type DocumentModel, type Target } from "../render.js";

export const copilotTarget: Target = {
  name: "copilot",
  outputPath: ".github/copilot-instructions.md",
  render(model: DocumentModel): string {
    return renderGeneratedMarkdown(model);
  },
};
