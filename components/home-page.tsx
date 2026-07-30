"use client";

import Link from "next/link";
import {
  chapterMap,
  courseParts,
  labCount,
  lessons,
  totalMinutes,
} from "@/lib/course-data";
import { chapterReadings, readingsForLesson } from "@/lib/reading-content";
import { useCourse } from "./course-provider";

function routeFor(state: ReturnType<typeof useCourse>["state"]) {
  if (state.lastLesson) return `/learn/${state.lastLesson}`;
  return "/learn/roadmap";
}

export function HomePage() {
  const { state, hydrated } = useCourse();
  const completed = state.completedLessons.length;
  const percent = Math.round((completed / lessons.length) * 100);
  const activeLesson =
    lessons.find((lesson) => lesson.slug === state.lastLesson) ?? lessons[0];
  const activeReadings = readingsForLesson(activeLesson.slug);
  const previewReading = activeReadings[0];
  const translatedParagraphs = chapterReadings.reduce(
    (total, reading) =>
      total +
      reading.sections.reduce(
        (sectionTotal, section) => sectionTotal + section.paragraphs.length,
        0,
      ),
    0,
  );

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">WEB READER · 30 CHAPTERS · BILINGUAL</div>
          <h1>
            打开一章，
            <br />
            <span>直接开始读。</span>
          </h1>
          <p>
            <em>The Hitchhiker&apos;s Guide to Agentic AI</em> 的 30 章内容已经
            重组为适合网页阅读的中文忠实译述。保留关键 English terms、原文页码、
            思考检查点与练习，不需要先打开 636 页 PDF。
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href={routeFor(state)}>
              {hydrated && state.lastLesson ? "继续上次阅读" : "从导读开始"}
              <span aria-hidden="true">→</span>
            </Link>
            <a className="secondary-button" href="#chapter-directory">
              浏览 30 章目录 ↓
            </a>
          </div>
        </div>

        {previewReading && (
          <aside className="reader-desk" aria-label="当前阅读预览">
            <header>
              <div>
                <span className="live-dot" aria-hidden="true" />
                {state.lastLesson ? "继续阅读" : "推荐起点"}
              </div>
              <small>
                {previewReading.chapter === 0
                  ? "导读"
                  : `CH.${String(previewReading.chapter).padStart(2, "0")}`}
              </small>
            </header>
            <div className="reader-desk-body">
              <p>{previewReading.title}</p>
              <h2>{previewReading.zhTitle}</h2>
              <div className="reader-desk-meta">
                <span>原书 pp. {previewReading.pages}</span>
                <span>约 {previewReading.minutes} 分钟</span>
              </div>
              <blockquote>{previewReading.overview}</blockquote>
              <section>
                <small>{previewReading.sections[0].english}</small>
                <h3>{previewReading.sections[0].title}</h3>
                <p>{previewReading.sections[0].paragraphs[0]}</p>
              </section>
            </div>
            <footer>
              <span>{activeLesson.title}</span>
              <Link href={routeFor(state)}>进入完整正文 →</Link>
            </footer>
          </aside>
        )}
      </section>

      <section className="metric-strip" aria-label="课程规模">
        {[
          ["30", "章站内精读"],
          [String(translatedParagraphs), "段译述正文"],
          ["60", "原创学习题"],
          [String(labCount), "交互实验"],
          [`${Math.round(totalMinutes / 60)}h`, "预计精读时间"],
        ].map(([value, label]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>

      <section className="section-block chapter-directory" id="chapter-directory">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CHAPTER DIRECTORY</span>
            <h2>按原书章节，直接进入正文</h2>
          </div>
          <p>
            这里不是 PDF 跳转目录。点击任一章会直接定位到本站译述正文；每章均保留
            English title、中文标题、阅读时间与原书页码。
          </p>
        </div>
        <div className="chapter-shelves">
          {courseParts.map((part) => {
            const [start, endValue] = part.chapterRange
              .replace("Ch.", "")
              .split("–")
              .map(Number);
            const end = endValue || start;
            const readings = chapterReadings.filter(
              (reading) => reading.chapter >= start && reading.chapter <= end,
            );

            return (
              <section className="chapter-shelf" key={part.id}>
                <header>
                  <span>PART {part.roman}</span>
                  <div>
                    <h3>{part.title}</h3>
                    <p>{part.zh}</p>
                  </div>
                  <small>{part.chapterRange}</small>
                </header>
                <div>
                  {readings.map((reading) => {
                    const mapping = chapterMap.find(
                      (chapter) => chapter.chapter === reading.chapter,
                    );
                    if (!mapping) return null;

                    return (
                      <Link
                        href={`/learn/${mapping.lessonSlug}#chapter-${reading.chapter}`}
                        key={reading.chapter}
                      >
                        <span>CH.{String(reading.chapter).padStart(2, "0")}</span>
                        <div>
                          <small>{reading.title}</small>
                          <strong>{reading.zhTitle}</strong>
                        </div>
                        <em>{reading.minutes} MIN →</em>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <section className="section-block course-roadmap">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LEARNING ROUTE</span>
            <h2>需要系统学习时，再按 12 个单元推进</h2>
          </div>
          <div className="progress-ring" style={{ "--progress": `${percent}%` } as React.CSSProperties}>
            <span>{percent}%</span>
            <small>完成</small>
          </div>
        </div>
        <div className="lesson-grid">
          {lessons.map((lesson) => {
            const done = state.completedLessons.includes(lesson.slug);
            return (
              <Link
                className={`lesson-card ${done ? "complete" : ""}`}
                href={`/learn/${lesson.slug}`}
                key={lesson.slug}
              >
                <div className="lesson-card-top">
                  <span>{String(lesson.index + 1).padStart(2, "0")}</span>
                  <small>{lesson.minutes} MIN</small>
                </div>
                <div className="lesson-card-body">
                  <p>{lesson.partLabel}</p>
                  <h3>{lesson.title}</h3>
                  <span>{lesson.chapters}</span>
                </div>
                <div className="lesson-card-foot">
                  <span>{done ? "已完成" : "进入单元"}</span>
                  <b aria-hidden="true">{done ? "✓" : "↗"}</b>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="method-note">
        <div>
          <span className="eyebrow">READING CONTRACT</span>
          <h2>把证据边界写在页面上</h2>
        </div>
        <div className="evidence-legend">
          <span className="evidence paper">原文事实</span>
          <span className="evidence explanation">解释 / 推导</span>
          <span className="evidence practice">工程建议</span>
          <span className="evidence unknown">原文未说明</span>
        </div>
        <p>
          30 章均提供站内 Guided Translation。这不是机械逐句直译，而是面向工程
          学习者的忠实译述：成熟术语保留 English，中文负责建立直觉、论证与逻辑；
          PDF 只用于可选核对，所有改编内容沿用 CC BY-SA 4.0。
        </p>
      </section>
    </div>
  );
}
