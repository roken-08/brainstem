import { renderMarkedAfterFrontmatter, renderMarkdownBody, type DocumentModel, type Target } from "../render.js";

export const skillTarget: Target = {
  name: "skill",
  outputPath: ".skills/brainstem/SKILL.md",
  render(model: DocumentModel): string {
    const body = `---\nname: brainstem\ndescription: Project instructions generated from brain.toml\n---\n\n${renderMarkdownBody(model)}`;
    return renderMarkedAfterFrontmatter(body);
  },
};
