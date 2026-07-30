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

const extractionArtifactPattern =
  /QQ|XX|×{3,}||(?:otherwise\s*){4,}|([\u3400-\u9fff])\1{3,}|\u0001|(?:\b[A-Za-z]\s+){8,}[A-Za-z]\b|i i i i|o o o o/iu;
const sourceOrigins = new Set(["source_translation", "source_definition"]);
const sectionIds = new Set();
const blockIds = new Set();
let verifiedBlocks = 0;
let verifiedSections = 0;
let verifiedChineseCharacters = 0;

function blockTextValues(block) {
  return [
    block.title,
    block.text,
    block.originalExcerpt,
    block.reading,
    block.explanation,
    block.caption,
    block.alt,
    block.scenario,
    block.result,
    block.limitation,
    ...(block.items ?? []),
    ...(block.steps ?? []),
  ].filter((value) => typeof value === "string");
}

for (const chapter of chapters) {
  assert.ok(chapter.title && chapter.zhTitle && chapter.pages);
  assert.ok(
    ["guide", "in_progress", "complete"].includes(chapter.status),
    `invalid status on Ch.${chapter.chapter}`,
  );

  let chapterVerifiedLeaves = 0;
  let chapterLeaves = 0;
  for (const [sectionIndex, section] of chapter.sections.entries()) {
    const sectionKey = `${chapter.chapter}:${section.id}`;
    assert.ok(!sectionIds.has(sectionKey), `duplicate section ${sectionKey}`);
    sectionIds.add(sectionKey);
    assert.ok(section.pages && section.blocks.length > 0, sectionKey);

    const sourceBlocks = section.blocks.filter((block) =>
      sourceOrigins.has(block.origin),
    );
    const sectionIsVerified = sourceBlocks.some(
      (block) => block.reviewStatus === "verified",
    );
    const hasChildren =
      chapter.sections[sectionIndex + 1]?.level > section.level;
    if (!hasChildren) {
      chapterLeaves += 1;
    }
    if (sectionIsVerified) {
      if (!hasChildren) chapterVerifiedLeaves += 1;
      verifiedSections += 1;
    }

    if (chapter.status === "complete" && !hasChildren) {
      assert.ok(
        sectionIsVerified,
        `complete chapter contains unverified section ${sectionKey}`,
      );
    }

    for (const block of section.blocks) {
      const blockKey = `${chapter.chapter}:${block.id}`;
      assert.ok(!blockIds.has(blockKey), `duplicate block ${blockKey}`);
      blockIds.add(blockKey);
      assert.equal(block.source.chapter, chapter.chapter, blockKey);
      assert.ok(block.source.pages, `missing source page on ${blockKey}`);

      if (sourceOrigins.has(block.origin)) {
        assert.ok(
          ["verified", undefined].includes(block.reviewStatus),
          `invalid review status on ${blockKey}`,
        );
      }
      if (block.reviewStatus !== "verified") continue;

      verifiedBlocks += 1;
      for (const value of blockTextValues(block)) {
        assert.doesNotMatch(
          value,
          extractionArtifactPattern,
          `${blockKey} contains extraction artifacts`,
        );
        verifiedChineseCharacters +=
          value.match(/[\u3400-\u9fff]/g)?.length ?? 0;
      }
    }
  }

  if (chapter.status === "complete") {
    assert.equal(
      chapterVerifiedLeaves,
      chapterLeaves,
      `Ch.${chapter.chapter} cannot be complete`,
    );
  }
}

assert.equal(chapters[14].status, "complete");
assert.equal(chapters[14].sections.length, 10);
assert.equal(chapters[15].status, "in_progress");
assert.equal(chapters[15].sections.length, 54);
assert.ok(verifiedBlocks >= 100);

const chapter16 = chapters[15];
assert.ok(
  chapter16.sections.some((section) => section.number === "16.5.3"),
  "missing Ch.16 §16.5.3",
);
const chapter16Blocks = chapter16.sections.flatMap((section) => section.blocks);
const chapter16Formulas = chapter16Blocks.filter(
  (block) => block.type === "formula",
);
const chapter16Figures = chapter16Blocks.filter(
  (block) => block.type === "figure",
);
assert.ok(
  chapter16Formulas.length >= 30,
  `expected source formulas in Ch.16, found ${chapter16Formulas.length}`,
);
assert.ok(
  chapter16Formulas.every((block) => block.latex),
  "Ch.16 formula block missing LaTeX",
);
assert.ok(
  chapter16Formulas.every(
    (block) =>
      !block.reading?.includes("变量含义与适用条件仍在逐式补充校订") &&
      !/^原书公式 \d+$/.test(block.title ?? ""),
  ),
  "Ch.16 formula blocks must not publish repeated placeholder copy",
);
assert.deepEqual(
  chapter16Figures.map((block) => block.src),
  ["/paper/figure-16-1.webp", "/paper/figure-16-2.webp"],
);
assert.ok(
  chapter16.metrics.chineseCharacters < 10_000,
  "Ch.16 must remain in_progress until a substantially fuller translation is published",
);

const keySources = await Promise.all(
  [
    "README.md",
    "app/layout.tsx",
    "components/home-page.tsx",
    "components/lesson-view.tsx",
    "components/chapter-reader.tsx",
    "lib/chapter-content.ts",
    "content/chapters/ch-16.json",
  ].map((path) => readFile(resolve(path), "utf8")),
);
const combined = keySources.join("\n");
assert.doesNotMatch(
  combined,
  /Guo et al|本站阅读到这里已经完整|全书精读完成|结构完整上线|小节核验覆盖/,
);
assert.match(combined, /Haggai Roitman/);
assert.match(combined, /reviewStatus === "verified"/);
assert.match(combined, /ContextualCompressionRetriever/);

console.log(
  JSON.stringify(
    {
      chapters: 30,
      publishedCompleteChapters: chapters.filter(
        (chapter) => chapter.status === "complete",
      ).length,
      verifiedSections,
      verifiedBlocks,
      verifiedChineseCharacters,
      integrityGate: "passed",
    },
    null,
    2,
  ),
);
