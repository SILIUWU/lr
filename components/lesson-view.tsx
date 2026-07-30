"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { chapterMap, getAdjacentLessons } from "@/lib/course-data";
import { catalogChapter, catalogHref } from "@/lib/chapter-catalog";
import type { EvidenceKind, Lesson } from "@/lib/types";
import { withBasePath } from "@/lib/site-path";
import { useCourse } from "./course-provider";
import { InteractiveLab } from "./interactive-labs";
import { QuizCard } from "./quiz-card";

const evidenceLabels: Record<EvidenceKind, string> = {
  paper: "原文事实",
  explanation: "解释 / 推导",
  practice: "工程建议",
  unknown: "原文未说明",
};

const figureFor: Partial<
  Record<
    string,
    { src: string; number: string; caption: string; pages: string }
  >
> = {
  "agentic-stack": {
    src: "/paper/figure-15-1.webp",
    number: "Figure 15.1",
    caption: "The Agentic AI Architecture Stack：从 model 到 user experience 的分层视图。",
    pages: "PDF p.307",
  },
  "harness-loop": {
    src: "/paper/figure-18-2.webp",
    number: "Figure 18.5",
    caption: "ReAct loop：Thought、Action 与 Observation 交替，直到满足终止条件。",
    pages: "PDF p.367",
  },
  protocols: {
    src: "/paper/figure-22-3.webp",
    number: "Figure 22.1",
    caption: "MCP interaction lifecycle：Client 与 Server 通过标准消息交换能力和结果。",
    pages: "PDF p.422",
  },
};

function EvidenceBlock({
  kind,
  title,
  items,
}: {
  kind: EvidenceKind;
  title: string;
  items: string[];
}) {
  return (
    <section className={`content-section evidence-section evidence-${kind}`}>
      <div className="content-section-heading">
        <span className={`evidence ${kind}`}>{evidenceLabels[kind]}</span>
        <h2>{title}</h2>
      </div>
      <ul className="prose-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function PaperFigure({
  figure,
}: {
  figure: NonNullable<(typeof figureFor)[string]>;
}) {
  return (
    <figure className="paper-figure">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={withBasePath(figure.src)} alt={figure.caption} />
      <figcaption>
        <div>
          <strong>{figure.number}</strong>
          <span>{figure.pages}</span>
        </div>
        <p>{figure.caption}</p>
        <small>
          Source: Haggai Roitman, <em>The Hitchhiker&apos;s Guide to Agentic AI</em>,
          CC BY-SA 4.0. 为网页阅读做裁切与压缩，未改变图意。
        </small>
      </figcaption>
    </figure>
  );
}

function NoteComposer({ lesson }: { lesson: Lesson }) {
  const { addNote } = useCourse();
  const [open, setOpen] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [intent, setIntent] = useState<"不懂" | "重要" | "存疑" | "深挖">("重要");
  const [saved, setSaved] = useState(false);

  const captureSelection = () => {
    setExcerpt(window.getSelection()?.toString().trim() || "");
    setOpen(true);
  };

  const save = () => {
    if (!body.trim() && !excerpt.trim()) return;
    addNote({
      lessonSlug: lesson.slug,
      lessonTitle: lesson.title,
      excerpt: excerpt.trim(),
      body: body.trim(),
      intent,
    });
    setBody("");
    setExcerpt("");
    setSaved(true);
    window.setTimeout(() => {
      setSaved(false);
      setOpen(false);
    }, 900);
  };

  return (
    <div className={`note-composer ${open ? "open" : ""}`}>
      {!open ? (
        <button type="button" onClick={captureSelection}>
          <span>✎</span>
          划选文字后，添加批注
        </button>
      ) : (
        <div>
          <header>
            <strong>写入本地学习笔记</strong>
            <button type="button" onClick={() => setOpen(false)} aria-label="关闭批注">
              ×
            </button>
          </header>
          <label>
            <span>引用摘录</span>
            <textarea
              rows={2}
              value={excerpt}
              onChange={(event) => setExcerpt(event.target.value)}
              placeholder="可留空"
            />
          </label>
          <label>
            <span>你的批注</span>
            <textarea
              rows={4}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="写下疑问、判断或下一步…"
            />
          </label>
          <div className="note-controls">
            <div role="group" aria-label="批注意图">
              {(["不懂", "重要", "存疑", "深挖"] as const).map((item) => (
                <button
                  type="button"
                  className={intent === item ? "active" : ""}
                  key={item}
                  onClick={() => setIntent(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <button type="button" className="primary-button compact" onClick={save}>
              {saved ? "已保存 ✓" : "保存"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function LessonView({ lesson }: { lesson: Lesson }) {
  const { state, rememberLesson, markLessonComplete } = useCourse();
  const { previous, next } = getAdjacentLessons(lesson.slug);
  const figure = figureFor[lesson.slug];
  const lessonChapters = chapterMap
    .filter((chapter) => chapter.lessonSlug === lesson.slug)
    .map((chapter) => catalogChapter(chapter.chapter))
    .filter((chapter): chapter is NonNullable<typeof chapter> => Boolean(chapter));
  const completed = state.completedLessons.includes(lesson.slug);

  useEffect(() => {
    rememberLesson(lesson.slug);
  }, [lesson.slug, rememberLesson]);

  return (
    <article className="lesson-page">
      <header className="lesson-hero">
        <div className="lesson-meta">
          <span>{String(lesson.index + 1).padStart(2, "0")} / 12</span>
          <span>{lesson.partLabel}</span>
          <span>{lesson.minutes} MIN</span>
        </div>
        <h1>{lesson.title}</h1>
        <p className="lesson-subtitle">{lesson.subtitle}</p>
        <div className="lesson-source-line">
          <span>{lesson.chapters}</span>
          <span>{lesson.pageRange}</span>
          <strong>章节正文 · {lessonChapters.length} 章</strong>
        </div>
        <p className="lesson-summary">{lesson.summary}</p>
      </header>

      <section className="lesson-orientation">
        <div>
          <span className="eyebrow">LEARNING OBJECTIVES</span>
          <h2>学完后，你应该能</h2>
          <ol>
            {lesson.objectives.map((objective) => (
              <li key={objective}>{objective}</li>
            ))}
          </ol>
        </div>
        <aside>
          <small>前置知识</small>
          {lesson.prerequisites.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </aside>
      </section>

      {lessonChapters.length > 0 && (
      <section className="lesson-reading-gateway">
        <header>
          <div>
            <span className="eyebrow">FULL CHAPTER READING</span>
            <h2>先查看章节译文状态，再回来做实验与测验</h2>
          </div>
          <p>
            章节阅读页已从学习单元中拆出，并公开显示结构条目、页码与校订状态。
            只有经过原文核验的区块才作为译文发布；未完成小节会明确标记制作中。
          </p>
        </header>
        <div>
          {lessonChapters.map((chapter) => (
            <Link href={catalogHref(chapter.chapter)} key={chapter.chapter}>
              <span>CH.{String(chapter.chapter).padStart(2, "0")}</span>
              <div>
                <small>{chapter.title}</small>
                <strong>{chapter.zhTitle}</strong>
              </div>
              <em>
                {chapter.metrics.sectionCount} 节 · {chapter.metrics.blockCount} 区块 →
              </em>
            </Link>
          ))}
        </div>
      </section>
      )}

      <section className="content-section">
        <div className="content-section-heading">
          <span className="section-number">01</span>
          <h2>先建立术语坐标</h2>
        </div>
        <div className="term-grid">
          {lesson.terms.map((term) => (
            <article key={term.term}>
              <small>{term.zh}</small>
              <h3>{term.term}</h3>
              <p>{term.meaning}</p>
            </article>
          ))}
        </div>
      </section>

      <EvidenceBlock kind="paper" title="原文给了哪些可核查事实？" items={lesson.facts} />
      <EvidenceBlock kind="explanation" title="概念关系与适用边界（编者解释）" items={lesson.explanations} />

      {figure && <PaperFigure figure={figure} />}

      {lesson.formula && (
        <section className="formula-card">
          <div>
            <span className="eyebrow">FORMULA, UNPACKED</span>
            <h2>{lesson.formula.expression}</h2>
            <p>{lesson.formula.reading}</p>
          </div>
          <dl>
            {lesson.formula.symbols.map(([symbol, meaning]) => (
              <div key={symbol}>
                <dt>{symbol}</dt>
                <dd>{meaning}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <EvidenceBlock kind="practice" title="落到系统与代码视角" items={lesson.practice} />

      <section className="content-section failure-section">
        <div className="content-section-heading">
          <span className="section-number">!</span>
          <h2>常见失败模式</h2>
        </div>
        <div className="failure-grid">
          {lesson.pitfalls.map((pitfall, index) => (
            <article key={pitfall}>
              <span>FAIL {String(index + 1).padStart(2, "0")}</span>
              <p>{pitfall}</p>
            </article>
          ))}
        </div>
      </section>

      {lesson.labs.map((lab) => (
        <InteractiveLab key={lab} kind={lab} />
      ))}

      <section className="source-section">
        <div className="content-section-heading">
          <span className="section-number">↗</span>
          <h2>核对来源 PDF（可选）</h2>
        </div>
        <div>
          {lesson.sources.map((source) => (
            <a key={`${source.section}-${source.pages}`} href={source.url} target="_blank" rel="noreferrer">
              <span>{source.label}</span>
              <strong>{source.section}</strong>
              <small>PDF pp. {source.pages} ↗</small>
            </a>
          ))}
        </div>
      </section>

      <section className="takeaway-card">
        <span className="eyebrow">THREE THINGS TO KEEP</span>
        <h2>离开本单元前，记住这三件事</h2>
        <ol>
          {lesson.takeaways.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className="quiz-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CHECK YOUR MODEL</span>
            <h2>3 道机判 + 2 道开放题</h2>
          </div>
          <p>开放题先写再看提示；0–5 分自评会进入简化 SM-2 复习队列。</p>
        </div>
        <div className="quiz-list">
          {lesson.quizzes.map((quiz, index) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              lessonSlug={lesson.slug}
              number={index + 1}
            />
          ))}
        </div>
      </section>

      <section className="lesson-finish">
        <div>
          <small>{completed ? "COMPLETED" : "READY TO MOVE ON?"}</small>
          <h2>{completed ? "这个单元已进入你的知识地图" : "把这一站标为完成"}</h2>
        </div>
        <button
          type="button"
          className={completed ? "secondary-button" : "primary-button"}
          onClick={() => markLessonComplete(lesson.slug)}
        >
          {completed ? "已完成 ✓" : "完成本单元"}
        </button>
      </section>

      <nav className="lesson-pagination" aria-label="前后学习单元">
        {previous ? (
          <Link href={`/learn/${previous.slug}`}>
            <small>← 上一单元</small>
            <strong>{previous.title}</strong>
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/learn/${next.slug}`}>
            <small>下一单元 →</small>
            <strong>{next.title}</strong>
          </Link>
        ) : <Link href="/progress"><small>完成学习 →</small><strong>查看学习报告</strong></Link>}
      </nav>

      <footer className="license-note">
        <p>
          Based on Haggai Roitman, <em>The Hitchhiker&apos;s Guide to Agentic AI</em>,
          arXiv v2 / book version 1.3. 原作与本站衍生学习内容均以{" "}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">
            CC BY-SA 4.0
          </a>{" "}
          发布。本站做了重组、翻译、解释与原创练习；并非作者官方版本。
        </p>
      </footer>

      <NoteComposer lesson={lesson} />
    </article>
  );
}
