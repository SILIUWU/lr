"use client";

import Link from "next/link";
import { allQuizzes, lessonBySlug } from "@/lib/course-data";
import { isDue } from "@/lib/scheduler";
import { useCourse } from "./course-provider";
import { QuizCard } from "./quiz-card";

export function ReviewPage() {
  const { state, hydrated } = useCourse();
  const dueCards = Object.values(state.cards)
    .filter((card) => isDue(card))
    .sort((a, b) => a.due - b.due);
  const upcoming = Object.values(state.cards)
    .filter((card) => !isDue(card))
    .sort((a, b) => a.due - b.due)
    .slice(0, 8);

  return (
    <div className="utility-page">
      <header className="utility-hero">
        <span className="eyebrow">SPACED REVIEW</span>
        <h1>今天该复习什么？</h1>
        <p>
          简化 SM-2 会根据 0–5 分表现调整间隔。答错不是清零进度，而是把薄弱主题更早带回视野。
        </p>
        <div className="utility-stats">
          <div><strong>{hydrated ? dueCards.length : "—"}</strong><span>现在到期</span></div>
          <div><strong>{hydrated ? upcoming.length : "—"}</strong><span>即将到期</span></div>
          <div><strong>{state.attempts.length}</strong><span>累计作答</span></div>
        </div>
      </header>

      {!dueCards.length ? (
        <section className="empty-state">
          <span>✓</span>
          <h2>复习队列现在是空的</h2>
          <p>完成任意单元的题目后，系统会把它们排进你的个人复习时间线。</p>
          <Link className="primary-button" href="/learn/roadmap">回到课程地图 →</Link>
        </section>
      ) : (
        <section className="review-list">
          <div className="section-heading">
            <div><span className="eyebrow">DUE NOW</span><h2>到期题目</h2></div>
          </div>
          {dueCards.map((card, index) => {
            const quiz = allQuizzes.find((item) => item.id === card.quizId);
            return quiz ? (
              <div key={card.quizId}>
                <Link className="review-origin" href={`/learn/${card.lessonSlug}`}>
                  {lessonBySlug[card.lessonSlug]?.title} ↗
                </Link>
                <QuizCard quiz={quiz} lessonSlug={card.lessonSlug} number={index + 1} />
              </div>
            ) : null;
          })}
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="upcoming-section">
          <div className="section-heading">
            <div><span className="eyebrow">UPCOMING</span><h2>接下来的复习</h2></div>
          </div>
          <div className="upcoming-list">
            {upcoming.map((card) => (
              <Link key={card.quizId} href={`/learn/${card.lessonSlug}`}>
                <div><strong>{card.topic}</strong><span>{lessonBySlug[card.lessonSlug]?.title}</span></div>
                <time dateTime={new Date(card.due).toISOString()}>
                  {new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric" }).format(card.due)}
                </time>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
