"use client";

import Link from "next/link";
import {
  courseParts,
  labCount,
  lessons,
} from "@/lib/course-data";
import {
  catalogChapter,
  catalogHref,
  chapterCatalog,
  readerMetrics,
} from "@/lib/chapter-catalog";
import { useCourse } from "./course-provider";

function routeFor(state: ReturnType<typeof useCourse>["state"]) {
  if (state.lastChapter) {
    return catalogHref(state.lastChapter, state.lastSection);
  }
  if (state.lastLesson) return `/learn/${state.lastLesson}`;
  return "/read/ch-15";
}

export function HomePage() {
  const { state, hydrated } = useCourse();
  const completed = state.completedLessons.length;
  const percent = Math.round((completed / lessons.length) * 100);
  const previewReading = catalogChapter(state.lastChapter ?? 15);

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">NATIVE WEB READER · 30 CHAPTERS · BILINGUAL</div>
          <h1>
            打开一章，
            <br />
            <span>直接开始读。</span>
          </h1>
          <p>
            Haggai Roitman 的 <em>The Hitchhiker&apos;s Guide to Agentic AI</em>{" "}
            已按原书 section/subsection 建立站内网页正文。中文逐节译读、关键
            English terms、公式、代码和具体页码直接在页面展开；PDF 只用于核对来源。
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href={routeFor(state)}>
              {hydrated && (state.lastChapter || state.lastLesson)
                ? "继续上次阅读"
                : "从 Ch.15 开始"}
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
                {state.lastChapter ? "继续阅读" : "推荐起点"}
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
              <blockquote>
                已映射 {previewReading.metrics.sectionCount} 个原书小节，
                展开为 {previewReading.metrics.blockCount} 个原生阅读区块。
                当前状态：逐句校订中。
              </blockquote>
              <section>
                <small>READING STATUS</small>
                <h3>结构完整上线，完成度如实标记</h3>
                <p>
                  已经写入正文的内容可直接阅读；尚未完成逐句校订的章节不会显示
                  “精读完成”，也不会用 PDF 跳转替代正文。
                </p>
              </section>
            </div>
            <footer>
              <span>CH.{String(previewReading.chapter).padStart(2, "0")}</span>
              <Link href={routeFor(state)}>进入完整正文 →</Link>
            </footer>
          </aside>
        )}
      </section>

      <section className="metric-strip" aria-label="课程规模">
        {[
          ["30", "章站内阅读"],
          [String(readerMetrics.sections), "个原书小节"],
          [String(readerMetrics.blocks), "个原生区块"],
          [
            `${Math.round(readerMetrics.chineseCharacters / 10000)}万`,
            "中文正文字符",
          ],
          ["60", "原创学习题"],
          [String(labCount), "交互实验"],
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
            点击任一章会进入原生网页正文，而不是 PDF 列表。每章公开显示
            section 数、正文区块数、页码和校订状态。
          </p>
        </div>
        <div className="chapter-shelves">
          {courseParts.map((part) => {
            const [start, endValue] = part.chapterRange
              .replace("Ch.", "")
              .split("–")
              .map(Number);
            const end = endValue || start;
            const readings = chapterCatalog.filter(
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
                    return (
                      <Link
                        href={catalogHref(reading.chapter)}
                        key={reading.chapter}
                      >
                        <span>CH.{String(reading.chapter).padStart(2, "0")}</span>
                        <div>
                          <small>{reading.title}</small>
                          <strong>{reading.zhTitle}</strong>
                        </div>
                        <em>
                          {reading.metrics.sectionCount} 节 · 校订中 →
                        </em>
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
          每个区块都标明“原文译述 / 编者解释 / 工程延伸”和具体 PDF 页码。
          当前章节按实际完成情况显示“导读 / 校订中 / 精读完成”；只有逐句校订和
          内容核验通过后才会切换为“精读完成”。所有改编内容沿用 CC BY-SA 4.0。
        </p>
      </section>
    </div>
  );
}
