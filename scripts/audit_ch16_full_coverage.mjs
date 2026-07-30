import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const tex = await readFile(resolve("tmp/pdfs/source-v2/book.tex"), "utf8");
const texLines = tex.split(/\r?\n/);
const inventory = JSON.parse(
  await readFile(resolve("content/source-structure.json"), "utf8"),
);
const chapter = JSON.parse(
  await readFile(resolve("content/chapters/ch-16.json"), "utf8"),
);
const structure = inventory.chapters.find((item) => item.chapter === 16);
assert.ok(structure, "missing Ch.16 source structure");

function countChinese(value) {
  return value?.match(/[\u3400-\u9fff]/g)?.length ?? 0;
}

function blockChinese(block) {
  const values = [
    block.title,
    block.text,
    block.reading,
    block.explanation,
    block.caption,
    block.alt,
    block.scenario,
    block.result,
    block.limitation,
    ...(block.items ?? []),
    ...(block.steps ?? []),
    ...(block.columns ?? []),
    ...(block.rows ?? []).flat(),
  ];
  return values.reduce(
    (total, value) =>
      total + (typeof value === "string" ? countChinese(value) : 0),
    0,
  );
}

function proseWordCount(segment) {
  const withoutNonProse = segment
    .replace(
      /\\begin\{(?:lstlisting|table|figure|equation|align)\*?\}[\s\S]*?\\end\{(?:lstlisting|table|figure|equation|align)\*?\}/g,
      " ",
    )
    .replace(/\\\[[\s\S]*?\\\]/g, " ")
    .replace(/\$[^$]*\$/g, " ")
    .replace(/%.*$/gm, " ")
    .replace(/\\(?:label|cite|ref|pageref)\{[^}]*\}/g, " ")
    .replace(/\\[A-Za-z@]+\*?(?:\[[^\]]*\])?/g, " ")
    .replace(/[{}~]/g, " ");
  return proseWordCount.countWords(withoutNonProse);
}
proseWordCount.countWords = (value) =>
  value.match(/[A-Za-z][A-Za-z0-9'’-]*/g)?.length ?? 0;

const sourceCount = (environment) =>
  (
    texLines
      .slice(14011, 15411)
      .join("\n")
      .match(new RegExp(`\\\\begin\\{${environment}\\}`, "g")) ?? []
  ).length;
const sourceDisplayMath =
  texLines.slice(14011, 15411).join("\n").match(/^\\\[$/gm)?.length ?? 0;
const outputBlocks = chapter.sections.flatMap((section) => section.blocks);
assert.equal(
  outputBlocks.filter((block) => block.type === "formula").length,
  sourceCount("equation") + sourceCount("align") + sourceDisplayMath,
  "formula extraction count differs from source",
);
assert.equal(
  outputBlocks.filter((block) => block.type === "code").length,
  sourceCount("lstlisting"),
  "code extraction count differs from source",
);
assert.equal(
  outputBlocks.filter((block) => block.type === "figure").length,
  sourceCount("figure"),
  "figure extraction count differs from source",
);
assert.equal(
  outputBlocks.filter((block) => block.type === "table").length,
  sourceCount("tabular"),
  "table extraction count differs from source",
);

const rows = structure.headings.map((heading, index) => {
  const section = chapter.sections.find(
    (item) => item.number === heading.number,
  );
  assert.ok(section, `missing rendered §${heading.number}`);
  const end = structure.headings[index + 1]?.sourceLine ?? 15412;
  const segment = texLines.slice(heading.sourceLine - 1, end - 1).join("\n");
  const sourceWords = proseWordCount(segment);
  const translatedChinese = section.blocks
    .filter(
      (block) =>
        block.reviewStatus === "verified" &&
        ["source_translation", "source_definition"].includes(block.origin),
    )
    .reduce((total, block) => total + blockChinese(block), 0);
  return {
    section: heading.number,
    sourceWords,
    translatedChinese,
    ratio:
      sourceWords === 0
        ? null
        : Number((translatedChinese / sourceWords).toFixed(2)),
  };
});

const substantiveRows = rows.filter((row) => row.sourceWords >= 20);
const lowCoverage = substantiveRows.filter(
  (row) => row.translatedChinese < 80 || row.ratio < 0.72,
);
assert.deepEqual(
  lowCoverage,
  [],
  `sections below full-rendition floor: ${JSON.stringify(lowCoverage)}`,
);
assert.ok(
  chapter.metrics.chineseCharacters >= 12_000,
  `Ch.16 verified source rendition is too short: ${chapter.metrics.chineseCharacters}`,
);
assert.ok(
  outputBlocks
    .filter((block) => block.type === "formula")
    .every((block) => block.reading && !/^原书公式/.test(block.title ?? "")),
  "every formula needs a specific explanation",
);
assert.ok(
  outputBlocks
    .filter((block) => block.type === "code")
    .every(
      (block) =>
        block.explanation &&
        !block.explanation.includes("本节正文说明其目的"),
    ),
  "every code listing needs a specific walkthrough",
);

console.log(
  JSON.stringify(
    {
      sections: chapter.sections.length,
      sourceProseWords: rows.reduce(
        (total, row) => total + row.sourceWords,
        0,
      ),
      verifiedChineseCharacters: chapter.metrics.chineseCharacters,
      formulas: outputBlocks.filter((block) => block.type === "formula").length,
      codeListings: outputBlocks.filter((block) => block.type === "code").length,
      tables: outputBlocks.filter((block) => block.type === "table").length,
      figures: outputBlocks.filter((block) => block.type === "figure").length,
      minimumSectionRatio: Math.min(
        ...substantiveRows.map((row) => row.ratio),
      ),
      coverageGate: "passed",
    },
    null,
    2,
  ),
);
