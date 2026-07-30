"use client";

import Link from "next/link";
import { lessons } from "@/lib/course-data";
import { catalogHref, chapterCatalog } from "@/lib/chapter-catalog";
import { useCourse } from "./course-provider";

export function ProgressPage() {
  const { state } = useCourse();
  const completed = state.completedLessons.length;
  const totalAttempts = state.attempts.length;
  const correct = state.attempts.filter((attempt) => attempt.correct).length;
  const accuracy = totalAttempts ? Math.round((correct / totalAttempts) * 100) : 0;
  const topicStats = Object.values(state.cards)
    .reduce<Record<string, { sum: number; count: number }>>((acc, card) => {
      const current = acc[card.topic] ?? { sum: 0, count: 0 };
      current.sum += card.lastScore;
      current.count += 1;
      acc[card.topic] = current;
      return acc;
    }, {});
  const weakTopics = Object.entries(topicStats)
    .map(([topic, data]) => ({ topic, score: data.sum / data.count }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 6);
  const totalSections = chapterCatalog.reduce(
    (total, chapter) => total + chapter.metrics.sectionCount,
    0,
  );
  const completedReadingSections = state.completedSections.length;

  return (
    <div className="utility-page">
      <header className="utility-hero">
        <span className="eyebrow">LEARNING SIGNALS</span>
        <h1>进度不是页数，而是你能稳定解释什么</h1>
        <p>
          这里汇总完成度、作答稳定性与低分主题。数据仅反映本站练习，不代表完整能力评估。
        </p>
      </header>

      <section className="progress-overview">
        <article>
          <span>逐节阅读进度</span>
          <strong>
            {totalSections
              ? Math.round((completedReadingSections / totalSections) * 100)
              : 0}
            %
          </strong>
          <div className="meter-track">
            <i
              style={{
                width: `${totalSections ? (completedReadingSections / totalSections) * 100 : 0}%`,
              }}
            />
          </div>
          <small>
            {completedReadingSections} / {totalSections} 个 section
          </small>
        </article>
        <article>
          <span>课程完成度</span>
          <strong>{Math.round((completed / lessons.length) * 100)}%</strong>
          <div className="meter-track"><i style={{ width: `${(completed / lessons.length) * 100}%` }} /></div>
          <small>{completed} / {lessons.length} 单元</small>
        </article>
        <article>
          <span>题目正确率</span>
          <strong>{accuracy}%</strong>
          <div className="meter-track"><i style={{ width: `${accuracy}%` }} /></div>
          <small>{correct} / {totalAttempts} 次作答</small>
        </article>
        <article>
          <span>复习卡片</span>
          <strong>{Object.keys(state.cards).length}</strong>
          <p>低分题更早出现，高分题逐步拉长间隔。</p>
        </article>
      </section>

      {state.lastChapter && (
        <section className="continue-reading-card">
          <div>
            <span className="eyebrow">CONTINUE READING</span>
            <h2>继续 Ch.{String(state.lastChapter).padStart(2, "0")}</h2>
            <p>
              已记录到{" "}
              {Math.round(
                (state.readingPositions[String(state.lastChapter)] ?? 0) * 100,
              )}
              % 的页面位置。
            </p>
          </div>
          <Link
            className="primary-button"
            href={catalogHref(state.lastChapter, state.lastSection)}
          >
            回到上次小节 →
          </Link>
        </section>
      )}

      <section className="progress-grid">
        <div className="unit-progress">
          <div className="section-heading">
            <div><span className="eyebrow">UNITS</span><h2>单元完成情况</h2></div>
          </div>
          {lessons.map((lesson) => {
            const attempts = state.attempts.filter((attempt) => attempt.lessonSlug === lesson.slug);
            const lessonAccuracy = attempts.length
              ? Math.round((attempts.filter((item) => item.correct).length / attempts.length) * 100)
              : null;
            const done = state.completedLessons.includes(lesson.slug);
            return (
              <Link key={lesson.slug} href={`/learn/${lesson.slug}`}>
                <span className={done ? "done" : ""}>{done ? "✓" : String(lesson.index + 1).padStart(2, "0")}</span>
                <div><strong>{lesson.title}</strong><small>{lesson.chapters}</small></div>
                <em>{lessonAccuracy === null ? "尚未答题" : `${lessonAccuracy}%`}</em>
              </Link>
            );
          })}
        </div>
        <aside className="weak-topics">
          <div className="section-heading">
            <div><span className="eyebrow">REVISIT</span><h2>薄弱主题</h2></div>
          </div>
          {weakTopics.length ? weakTopics.map((item, index) => (
            <div key={item.topic}>
              <span>{index + 1}</span>
              <p>{item.topic}</p>
              <strong>{item.score.toFixed(1)} / 5</strong>
            </div>
          )) : (
            <div className="mini-empty">
              完成几道题后，这里会按自评与正确率显示优先复习主题。
            </div>
          )}
          <Link className="primary-button" href="/review">进入到期复习 →</Link>
        </aside>
      </section>
    </div>
  );
}
