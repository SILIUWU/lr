import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  allQuizzes,
  chapterMap,
  labCount,
  lessons,
} from "../lib/course-data.ts";
import { migrateLearningStateV1 } from "../lib/learning-state.ts";
import { isDue, scheduleReview } from "../lib/scheduler.ts";

async function readChapter(chapter) {
  const slug = String(chapter).padStart(2, "0");
  return JSON.parse(
    await readFile(
      new URL(`../content/chapters/ch-${slug}.json`, import.meta.url),
      "utf8",
    ),
  );
}

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
      IMAGES: {
        input() {
          return {
            transform() {
              return {
                async output() {
                  return { response: () => new Response("Not found", { status: 404 }) };
                },
              };
            },
          };
        },
      },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("course contract covers all chapters, lessons, quizzes and labs", () => {
  assert.equal(chapterMap.length, 30);
  assert.equal(new Set(chapterMap.map((item) => item.chapter)).size, 30);
  assert.deepEqual(chapterMap.map((item) => item.chapter), Array.from({ length: 30 }, (_, index) => index + 1));

  assert.equal(lessons.length, 12);
  assert.equal(new Set(lessons.map((item) => item.slug)).size, 12);
  assert.equal(allQuizzes.length, 60);
  assert.equal(new Set(allQuizzes.map((item) => item.id)).size, 60);
  assert.ok(lessons.every((item) => item.quizzes.filter((quiz) => quiz.type === "mcq").length === 3));
  assert.ok(lessons.every((item) => item.quizzes.filter((quiz) => quiz.type === "open").length === 2));
  assert.equal(labCount, 6);
  assert.ok(lessons.every((item) => item.sources.every((source) => source.pages && source.section && source.url)));
});

test("native reader corpus maps all 30 chapters and source sections", async () => {
  const chapters = await Promise.all(
    Array.from({ length: 30 }, (_, index) => readChapter(index + 1)),
  );
  const sectionCount = chapters.reduce(
    (total, chapter) => total + chapter.sections.length,
    0,
  );
  const verifiedBlocks = chapters.flatMap((chapter) =>
    chapter.sections.flatMap((section) =>
      section.blocks.filter((block) => block.reviewStatus === "verified"),
    ),
  );
  assert.equal(chapters.length, 30);
  assert.deepEqual(
    chapters.map((chapter) => chapter.chapter),
    Array.from({ length: 30 }, (_, index) => index + 1),
  );
  assert.ok(sectionCount >= 900, `expected >=900 mapped sections, got ${sectionCount}`);
  assert.ok(
    verifiedBlocks.length >= 150,
    `expected >=150 verified public blocks, got ${verifiedBlocks.length}`,
  );
  assert.ok(
    chapters.every((chapter) =>
      chapter.sections.every(
        (section) =>
          section.id &&
          section.pages &&
          section.blocks.length > 0,
      ),
    ),
  );
  assert.ok(
    chapters.every((chapter) =>
      chapter.sections.every((section) =>
        section.blocks
          .filter((block) => block.reviewStatus === "verified")
          .every(
            (block) =>
              block.source?.chapter === chapter.chapter && block.source?.pages,
          ),
      ),
    ),
  );
  assert.equal(new Set(chapters.flatMap((chapter) => chapter.sections.map((section) => `${chapter.chapter}:${section.id}`))).size, sectionCount);
  assert.equal(chapters[14].sections.length, 10);
  assert.ok(
    chapters
      .slice(15, 27)
      .every((chapter) => chapter.sections.length >= 14),
  );
  assert.equal(chapters[14].status, "complete");
  assert.ok(
    chapters
      .filter((chapter) => chapter.chapter !== 15)
      .every((chapter) => chapter.status === "in_progress"),
  );
});

test("v1 learning state migrates without losing notes, cards or theme", () => {
  const legacy = {
    version: 1,
    completedLessons: ["roadmap"],
    lastLesson: "roadmap",
    attempts: [
      {
        quizId: "u01-mcq-1",
        lessonSlug: "roadmap",
        correct: true,
        score: 5,
        at: 1,
      },
    ],
    cards: {
      "u01-mcq-1": {
        quizId: "u01-mcq-1",
        lessonSlug: "roadmap",
        topic: "architecture",
        repetitions: 1,
        interval: 1,
        ease: 2.6,
        due: 2,
        lastScore: 5,
      },
    },
    notes: [
      {
        id: "note-1",
        lessonSlug: "roadmap",
        lessonTitle: "全书导览",
        excerpt: "evidence",
        body: "保留这条笔记",
        intent: "重要",
        createdAt: 1,
      },
    ],
    theme: "dark",
  };
  const migrated = migrateLearningStateV1(legacy);
  assert.equal(migrated.version, 2);
  assert.deepEqual(migrated.completedLessons, legacy.completedLessons);
  assert.deepEqual(migrated.attempts, legacy.attempts);
  assert.deepEqual(migrated.cards, legacy.cards);
  assert.deepEqual(migrated.notes, legacy.notes);
  assert.equal(migrated.theme, "dark");
  assert.deepEqual(migrated.completedSections, []);
  assert.deepEqual(migrated.readingPositions, {});
});

test("simplified SM-2 resets weak cards and expands strong cards", () => {
  const now = Date.UTC(2026, 6, 30);
  const identity = { quizId: "q1", lessonSlug: "roadmap", topic: "test" };
  const first = scheduleReview(undefined, 5, now, identity);
  assert.equal(first.repetitions, 1);
  assert.equal(first.interval, 1);
  assert.equal(isDue(first, now), false);

  const second = scheduleReview(first, 5, first.due, identity);
  assert.equal(second.repetitions, 2);
  assert.equal(second.interval, 6);

  const weak = scheduleReview(second, 1, second.due, identity);
  assert.equal(weak.repetitions, 0);
  assert.ok(weak.interval < 1);
});

test("server renders the branded course without starter remnants", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Agentic AI 全栈指南/);
  assert.match(html, /知识地图/);
  assert.match(html, /打开一章/);
  assert.match(html, /按原书章节，直接进入正文/);
  assert.match(html, /\/read\/ch-15/);
  assert.match(html, /只有经过逐页核验的正文才会发布为“原文译述”/);
  assert.doesNotMatch(html, /30 章站内精读|全书精读完成/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("lesson route links to full chapter pages and retains labs and quizzes", async () => {
  const response = await render("/learn/agentic-stack");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Agentic AI Architecture Stack/);
  assert.match(html, /先查看章节译文状态，再回来做实验与测验/);
  assert.match(html, /\/read\/ch-15/);
  assert.doesNotMatch(html, /本站阅读到这里已经完整/);
  assert.match(html, /原文事实/);
  assert.match(html, /工程建议/);
  assert.match(html, /3 道机判 \+ 2 道开放题/);
  assert.match(html, /CC BY-SA 4\.0/);
  assert.match(html, /Haggai Roitman/);
  assert.doesNotMatch(html, /Guo et al/);
});

test("chapter route renders section anchors, source pages and native rich blocks", async () => {
  const chapter15 = await render("/read/ch-15");
  const introductionHtml = await chapter15.text();
  const introductionBlockCount =
    introductionHtml.match(/class="reader-block /g)?.length ?? 0;
  assert.ok(
    introductionBlockCount >= 10 && introductionBlockCount <= 16,
    `Ch.15 should render 10-16 substantive blocks, got ${introductionBlockCount}`,
  );

  const chapter16 = await render("/read/ch-16");
  assert.equal(chapter16.status, 200);
  const ragHtml = await chapter16.text();
  assert.match(ragHtml, /s-16-7-4/);
  assert.match(ragHtml, /完整 Agentic RAG 实现/);
  assert.match(ragHtml, /PDF p\.[\s\S]{0,40}322-323/);
  assert.match(ragHtml, /原文译述/);
  assert.match(ragHtml, /编者解释/);
  assert.match(ragHtml, /工程延伸/);
  assert.match(ragHtml, /精读重建中/);
  assert.match(ragHtml, /目录结构映射/);
  assert.match(ragHtml, /figure-16-1\.webp/);
  assert.match(ragHtml, /Eq\.[\s\S]{0,20}16\.1–16\.2/);
  assert.match(ragHtml, /katex/);

  const chapter18 = await render("/read/ch-18");
  assert.equal(chapter18.status, 200);
  const harnessHtml = await chapter18.text();
  assert.match(harnessHtml, /s-18-2-6/);
  assert.match(harnessHtml, /精读重建中/);
  assert.doesNotMatch(harnessHtml, /Eq\.[\s\S]{0,20}18\.10/);
  assert.doesNotMatch(harnessHtml, /figure-18-2\.webp/);

  const chapter22 = await render("/read/ch-22");
  const protocolHtml = await chapter22.text();
  assert.match(protocolHtml, /s-22-2-3/);
  assert.match(protocolHtml, /精读重建中/);
  assert.doesNotMatch(protocolHtml, /协议标准化不等于自动安全/);

  const chapter27 = await render("/read/ch-27");
  const uiHtml = await chapter27.text();
  assert.match(uiHtml, /s-27-3-6/);
  assert.match(uiHtml, /精读重建中/);
  assert.doesNotMatch(uiHtml, /错误与恢复必须成为一等 UI 状态/);
});

test("paper figures and social preview are wired from local assets", async () => {
  const [lessonSource, readerSource, layoutSource] = await Promise.all([
    readFile(new URL("../components/lesson-view.tsx", import.meta.url), "utf8"),
    readFile(new URL("../content/chapters/ch-16.json", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(lessonSource, /figure-15-1\.webp/);
  assert.match(lessonSource, /figure-18-2\.webp/);
  assert.match(lessonSource, /figure-22-3\.webp/);
  assert.match(readerSource, /figure-16-1\.webp/);
  assert.match(readerSource, /figure-16-2\.webp/);
  assert.match(layoutSource, /\/og\.png/);
  assert.match(layoutSource, /Haggai Roitman/);
  assert.doesNotMatch(layoutSource, /Guo et al/);
});
