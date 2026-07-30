import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const corruptedSpacing =
  /(?:\b[A-Za-z]\s+){8,}[A-Za-z]\b|(?:\b([A-Za-z])\s+){5,}\1\b/u;
const repeatedGlyph = /([\p{L}\p{N}])(?:\s*\1){7,}/u;
const knownBadPhrases =
  /上市\s*\d|获取块|文件 compressors|压缩机=|苏丹解放军|迟到的互动|车站列表|c o m p r e s s|i i i i|o o o o/iu;
const codeInParagraph =
  /\bfrom\s+[\w.]+\s+import\b|\bimport\s+[\w.]+|\bdef\s+\w+\s*\(|\b(?:const|let|var)\s+\w+\s*=|[A-Za-z_]\w*\s*=\s*[A-Za-z_]\w*\s*\(/u;

const findings = [];
let sections = 0;
let blocks = 0;
let sourceChineseCharacters = 0;
let editorialChineseCharacters = 0;
let sourceParagraphs = 0;
let suspiciousBlocks = 0;
let verifiedSourceBlocks = 0;
let machineDraftSourceBlocks = 0;
let suspiciousVerifiedBlocks = 0;

function chineseCharacters(value) {
  return typeof value === "string"
    ? (value.match(/[\u3400-\u9fff]/g)?.length ?? 0)
    : 0;
}

function inspectText(chapter, section, block, field, value) {
  if (typeof value !== "string" || !value.trim()) return;
  const reasons = [];
  if (corruptedSpacing.test(value)) reasons.push("spaced-letter corruption");
  if (repeatedGlyph.test(value)) reasons.push("repeated-glyph corruption");
  if (knownBadPhrases.test(value)) reasons.push("known mistranslation/corruption");
  if (
    block.type === "paragraph" &&
    field === "text" &&
    codeInParagraph.test(value)
  ) {
    reasons.push("code mixed into prose");
  }
  if (
    block.type === "paragraph" &&
    field === "originalExcerpt" &&
    codeInParagraph.test(value)
  ) {
    reasons.push("source extraction merged code with prose");
  }
  if (reasons.length) {
    suspiciousBlocks += 1;
    if (block.reviewStatus === "verified") suspiciousVerifiedBlocks += 1;
    findings.push({
      chapter,
      section: section.number ?? section.id,
      block: block.id,
      field,
      reasons: [...new Set(reasons)],
      sample: value.slice(0, 220),
    });
  }
}

for (let chapterNumber = 1; chapterNumber <= 30; chapterNumber += 1) {
  const slug = String(chapterNumber).padStart(2, "0");
  const chapter = JSON.parse(
    await readFile(
      resolve("content", "chapters", `ch-${slug}.json`),
      "utf8",
    ),
  );

  for (const section of chapter.sections) {
    sections += 1;
    for (const block of section.blocks) {
      blocks += 1;
      const contentFields = [
        block.title,
        block.text,
        block.reading,
        block.caption,
        block.alt,
        ...(block.items ?? []),
        ...(block.steps ?? []),
        block.scenario,
        block.result,
        block.limitation,
      ];
      const contentChinese = contentFields.reduce(
        (total, value) => total + chineseCharacters(value),
        0,
      );
      if (
        ["source_translation", "source_definition"].includes(block.origin)
      ) {
        sourceChineseCharacters += contentChinese;
        if (block.type === "paragraph") sourceParagraphs += 1;
        if (block.reviewStatus === "verified") {
          verifiedSourceBlocks += 1;
        } else {
          machineDraftSourceBlocks += 1;
        }
      }
      if (block.origin === "editorial_explanation") {
        editorialChineseCharacters += contentChinese;
      }
      for (const [field, value] of Object.entries({
        title: block.title,
        text: block.text,
        originalExcerpt: block.originalExcerpt,
        reading: block.reading,
        caption: block.caption,
        alt: block.alt,
        scenario: block.scenario,
        result: block.result,
        limitation: block.limitation,
      })) {
        inspectText(chapterNumber, section, block, field, value);
      }
      for (const [index, value] of (block.items ?? []).entries()) {
        inspectText(chapterNumber, section, block, `items[${index}]`, value);
      }
      for (const [index, value] of (block.steps ?? []).entries()) {
        inspectText(chapterNumber, section, block, `steps[${index}]`, value);
      }
    }
  }
}

const report = {
  chapters: 30,
  sections,
  blocks,
  sourceParagraphs,
  sourceChineseCharacters,
  editorialChineseCharacters,
  verifiedSourceBlocks,
  machineDraftSourceBlocks,
  suspiciousBlocks,
  suspiciousVerifiedBlocks,
  ...(process.argv.includes("--details") ? { findings } : {}),
};

console.log(JSON.stringify(report, null, 2));
if (suspiciousVerifiedBlocks > 0) process.exitCode = 1;
