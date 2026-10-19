import { renderMarkedAfterFrontmatter, renderMarkdownBody, type DocumentModel, type Target } from "../render.js";

export const cursorTarget: Target = {
  name: "cursor",
  outputPath: ".cursor/rules/brainstem.mdc",
  render(model: DocumentModel): string {
    const body = `---\ndescription: brainstem instructions\nglobs:\nalwaysApply: true\n---\n\n${renderMarkdownBody(model)}`;
    return renderMarkedAfterFrontmatter(body);
  },
};
