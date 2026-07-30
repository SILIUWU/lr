import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const chapters = [];
for (let number = 1; number <= 30; number += 1) {
  const slug = String(number).padStart(2, "0");
  chapters.push(
    JSON.parse(
      await readFile(
        resolve("content", "chapters", `ch-${slug}.json`),
        "utf8",
      ),
    ),
  );
}

assert.deepEqual(
  chapters.map((chapter) => chapter.chapter),
  Array.from({ length: 30 }, (_, index) => index + 1),
);

const sectionIds = new Set();
const blockIds = new Set();
let sectionCount = 0;
let blockCount = 0;
let chineseCharacters = 0;
const extractionArtifactPattern =
  /QQ|XX|×{3,}||(?:otherwise\s*){4,}|([\u3400-\u9fff])\1{3,}|\u0001/u;

for (const chapter of chapters) {
  assert.ok(chapter.title && chapter.zhTitle && chapter.pages);
  assert.equal(chapter.status, "in_progress");
  chineseCharacters += chapter.metrics.chineseCharacters;
  for (const section of chapter.sections) {
    sectionCount += 1;
    const sectionKey = `${chapter.chapter}:${section.id}`;
    assert.ok(!sectionIds.has(sectionKey), `duplicate section ${sectionKey}`);
    sectionIds.add(sectionKey);
    assert.ok(section.pages && section.blocks.length > 0, sectionKey);
    assert.ok(
      section.blocks.some((block) =>
        ["source_translation", "source_definition"].includes(block.origin),
      ),
      `missing source-backed block on ${sectionKey}`,
    );
    for (const block of section.blocks) {
      blockCount += 1;
      const blockKey = `${chapter.chapter}:${block.id}`;
      assert.ok(!blockIds.has(blockKey), `duplicate block ${blockKey}`);
      blockIds.add(blockKey);
      assert.equal(block.source.chapter, chapter.chapter, blockKey);
      assert.ok(block.source.pages, `missing source page on ${blockKey}`);
      for (const [field, value] of Object.entries({
        title: block.title,
        text: block.text,
        alt: block.alt,
        caption: block.caption,
        reading: block.reading,
      })) {
        if (typeof value === "string") {
          assert.doesNotMatch(
            value,
            extractionArtifactPattern,
            `${blockKey}.${field} contains extraction artifacts`,
          );
        }
      }
    }
  }
}

assert.ok(sectionCount >= 900, `only ${sectionCount} source sections`);
assert.ok(blockCount >= 8_000, `only ${blockCount} reading blocks`);
assert.ok(
  chineseCharacters >= 300_000,
  `only ${chineseCharacters} Chinese source-rendition characters`,
);
assert.equal(chapters[14].sections.length, 3);
for (const chapter of chapters.slice(15, 27)) {
  assert.ok(
    chapter.sections.length >= 14,
    `Ch.${chapter.chapter} has too few mapped sections`,
  );
}

for (const [chapterNumber, sectionNumber] of [
  [16, "16.7.4"],
  [18, "18.5.1"],
  [22, "22.2.3"],
  [27, "27.3.6"],
]) {
  const chapter = chapters[chapterNumber - 1];
  assert.ok(
    chapter.sections.some((section) => section.number === sectionNumber),
    `missing Ch.${chapterNumber} §${sectionNumber}`,
  );
}

const keySources = await Promise.all(
  [
    "README.md",
    "app/layout.tsx",
    "components/home-page.tsx",
    "components/lesson-view.tsx",
  ].map((path) => readFile(resolve(path), "utf8")),
);
const combined = keySources.join("\n");
assert.doesNotMatch(combined, /Guo et al|本站阅读到这里已经完整|全书精读完成/);
assert.match(combined, /Haggai Roitman/);

console.log(
  JSON.stringify(
    { chapters: 30, sections: sectionCount, blocks: blockCount, chineseCharacters },
    null,
    2,
  ),
);
