"use client";

import Link from "next/link";
import {
  chapterMap,
  courseParts,
  labCount,
  lessons,
  totalMinutes,
} from "@/lib/course-data";
import { useCourse } from "./course-provider";

function routeFor(state: ReturnType<typeof useCourse>["state"]) {
  if (state.lastLesson) return `/learn/${state.lastLesson}`;
  return "/learn/roadmap";
}

export function HomePage() {
  const { state, hydrated } = useCourse();
  const completed = state.completedLessons.length;
  const percent = Math.round((completed / lessons.length) * 100);

  return (
    <div className="home-page">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">636 PAGES · 30 CHAPTERS · ONE SYSTEMS VIEW</div>
          <h1>
            不只会用 Agent。
            <br />
            <span>理解它为什么有效，又会在哪里失灵。</span>
          </h1>
          <p>
            基于 <em>The Hitchhiker&apos;s Guide to Agentic AI</em>{" "}
            的中英双语分层精读。把 LLM、RL、Harness、Memory、Protocol、
            Multi-Agent 与 UI 串成一条可运行、可验证的工程链路。
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href={routeFor(state)}>
              {hydrated && state.lastLesson ? "继续学习" : "开始能力诊断"}
              <span aria-hidden="true">→</span>
            </Link>
            <a
              className="secondary-button"
              href="https://arxiv.org/abs/2606.24937"
              target="_blank"
              rel="noreferrer"
            >
              阅读原文 ↗
            </a>
          </div>
        </div>
        <div className="hero-system" aria-label="Agentic AI 系统分层示意">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="system-core">
            <small>SYSTEM LOOP</small>
            <strong>Agent</strong>
            <span>observe · reason · act</span>
          </div>
          {[
            ["MODEL", "LLM + RL"],
            ["CONTEXT", "RAG + Memory"],
            ["RUNTIME", "Harness + Tools"],
            ["NETWORK", "MCP + A2A"],
          ].map(([label, value], index) => (
            <div key={label} className={`system-node node-${index + 1}`}>
              <small>{label}</small>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="metric-strip" aria-label="课程规模">
        {[
          ["12", "学习单元"],
          ["30", "原文章节映射"],
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

      <section className="section-block course-roadmap">
        <div className="section-heading">
          <div>
            <span className="eyebrow">LEARNING ROUTE</span>
            <h2>从模型底座，到可以被信任的自主系统</h2>
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

      <section className="section-block map-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">SOURCE MAP</span>
            <h2>六个 Part，30 章，全部有去处</h2>
          </div>
          <p>
            核心 Ch.15–27 深讲，其余章节压缩为高密度基础路径。每个结论保留
            chapter 与 PDF page 范围。
          </p>
        </div>
        <div className="part-list">
          {courseParts.map((part) => (
            <article key={part.id}>
              <div className="part-number">{part.roman}</div>
              <div>
                <small>{part.chapterRange}</small>
                <h3>{part.title}</h3>
                <p>{part.zh}</p>
              </div>
              <span>
                {
                  chapterMap.filter((chapter) => {
                    const [start, end] = part.chapterRange
                      .replace("Ch.", "")
                      .split("–")
                      .map(Number);
                    return chapter.chapter >= start && chapter.chapter <= (end || start);
                  }).length
                }{" "}
                CHAPTERS
              </span>
            </article>
          ))}
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
          这不是 636 页逐段翻译，而是面向工程学习者的结构化重写。成熟术语保留
          English，中文负责建立直觉与逻辑；所有改编内容沿用 CC BY-SA 4.0。
        </p>
      </section>
    </div>
  );
}
