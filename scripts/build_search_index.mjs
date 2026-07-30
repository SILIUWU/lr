import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const entries = [];

for (let chapter = 1; chapter <= 30; chapter += 1) {
  const slug = `ch-${String(chapter).padStart(2, "0")}`;
  const path = resolve(root, "content", "chapters", `${slug}.json`);
  const content = JSON.parse(await readFile(path, "utf8"));
  for (const section of content.sections) {
    const searchable = section.blocks
      .filter((block) => {
        return block.reviewStatus === "verified";
      })
      .flatMap((block) => {
        if (block.type === "paragraph") return [block.text, block.originalExcerpt];
        if (block.type === "list") return block.items;
        if (block.type === "formula") return [block.expression, block.reading];
        if (block.type === "code") return [block.code, block.explanation];
        if (block.type === "figure") return [block.caption, block.alt];
        if (block.type === "example") {
          return [block.scenario, ...block.steps, block.result, block.limitation];
        }
        return [block.text];
      })
      .filter(Boolean)
      .join(" ");
    entries.push({
      chapter,
      sectionId: section.id,
      sectionNumber: section.number,
      title: section.zhTitle,
      enTitle: section.enTitle,
      search: `${content.title} ${content.zhTitle} ${section.enTitle} ${section.zhTitle} ${searchable}`
        .toLocaleLowerCase("zh-CN")
        .slice(0, 140),
    });
  }
}

await writeFile(
  resolve(root, "content", "search-index.json"),
  `${JSON.stringify(entries, null, 2)}\n`,
  "utf8",
);

console.log(`wrote ${entries.length} section search entries`);
