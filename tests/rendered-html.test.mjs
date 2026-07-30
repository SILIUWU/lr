import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  allQuizzes,
  chapterMap,
  labCount,
  lessons,
  searchLessons,
} from "../lib/course-data.ts";
import { chapterReadings, readingsForLesson } from "../lib/reading-content.ts";
import { isDue, scheduleReview } from "../lib/scheduler.ts";

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

test("guided readings cover every source chapter inside the course", () => {
  const sourceChapters = chapterReadings.filter((reading) => reading.chapter > 0);
  assert.equal(sourceChapters.length, 30);
  assert.deepEqual(
    sourceChapters.map((reading) => reading.chapter),
    Array.from({ length: 30 }, (_, index) => index + 1),
  );
  assert.ok(sourceChapters.every((reading) => reading.pages && reading.overview));
  assert.ok(sourceChapters.every((reading) => reading.sections.length >= 3));
  assert.ok(sourceChapters.every((reading) => reading.sections.every((section) => section.paragraphs.length > 0)));
  assert.deepEqual(readingsForLesson("agentic-stack").map((reading) => reading.chapter), [15]);
  assert.deepEqual(readingsForLesson("protocols").map((reading) => reading.chapter), [22, 23, 24]);
  assert.equal(
    searchLessons("Perceive–Reason–Act", {
      "agentic-stack": readingsForLesson("agentic-stack")
        .flatMap((reading) => reading.sections.map((section) => section.english))
        .join(" "),
    })[0]?.slug,
    "agentic-stack",
  );
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
  assert.match(html, /\/learn\/agentic-stack#chapter-15/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("lesson route renders on-page translation, source boundaries and quizzes", async () => {
  const response = await render("/learn/agentic-stack");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Agentic AI Architecture Stack/);
  assert.match(html, /章节精读：在本站完成正文阅读/);
  assert.match(html, /完成本单元无需跳转 PDF/);
  assert.match(html, /Perceive–Reason–Act/);
  assert.match(html, /可选：核对原文 pp\.[\s\S]*305–307/);
  assert.match(html, /原文事实/);
  assert.match(html, /工程建议/);
  assert.match(html, /3 道机判 \+ 2 道开放题/);
  assert.match(html, /CC BY-SA 4\.0/);
});

test("paper figures and social preview are wired from local assets", async () => {
  const [lessonSource, layoutSource] = await Promise.all([
    readFile(new URL("../components/lesson-view.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(lessonSource, /figure-15-1\.webp/);
  assert.match(lessonSource, /figure-18-2\.webp/);
  assert.match(lessonSource, /figure-22-3\.webp/);
  assert.match(layoutSource, /\/og\.png/);
});
