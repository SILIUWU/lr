"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAdjacentLessons } from "@/lib/course-data";
import { readingsForLesson } from "@/lib/reading-content";
import type { ChapterReading, EvidenceKind, Lesson } from "@/lib/types";
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
    number: "Figure 18.1",
    caption: "Agent orchestration loop：Harness 如何连接 planning、tool execution 与 observation。",
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
      <img src={figure.src} alt={figure.caption} />
      <figcaption>
        <div>
          <strong>{figure.number}</strong>
          <span>{figure.pages}</span>
        </div>
        <p>{figure.caption}</p>
        <small>
          Source: Guo et al., <em>The Hitchhiker&apos;s Guide to Agentic AI</em>,
          CC BY-SA 4.0. 为网页阅读做裁切与压缩，未改变图意。
        </small>
      </figcaption>
    </figure>
  );
}

function ChapterReader({ readings }: { readings: ChapterReading[] }) {
  return (
    <section className="guided-reading" aria-labelledby="guided-reading-title">
      <header className="guided-reading-heading">
        <div>
          <span className="eyebrow">BILINGUAL CHAPTER READING</span>
          <h2 id="guided-reading-title">章节精读：在本站完成正文阅读</h2>
        </div>
        <p>
          以下是基于原文的中文忠实译述：保留成熟 English terms，重建论证脉络，
          不做生硬逐句直译。完成本单元无需跳转 PDF。
        </p>
      </header>

      <nav className="chapter-jump-list" aria-label="本单元章节目录">
        <span>本单元阅读</span>
        <div>
          {readings.map((reading) => (
            <a href={`#chapter-${reading.chapter}`} key={reading.chapter}>
              <small>{reading.chapter === 0 ? "导读" : `Ch.${reading.chapter}`}</small>
              <strong>{reading.zhTitle}</strong>
            </a>
          ))}
        </div>
      </nav>

      <div className="chapter-reading-list">
        {readings.map((reading) => (
          <article
            className="chapter-reading"
            id={`chapter-${reading.chapter}`}
            key={reading.chapter}
          >
            <header className="chapter-reading-header">
              <div className="chapter-marker">
                <span>{reading.chapter === 0 ? "PREFACE" : "CHAPTER"}</span>
                <strong>
                  {reading.chapter === 0
                    ? "00"
                    : String(reading.chapter).padStart(2, "0")}
                </strong>
              </div>
              <div>
                <p>{reading.title}</p>
                <h3>{reading.zhTitle}</h3>
                <div>
                  <span>原书 pp. {reading.pages}</span>
                  <span>约 {reading.minutes} 分钟</span>
                  <span>{reading.sections.length} 个阅读小节</span>
                </div>
              </div>
            </header>

            <div className="chapter-overview">
              <span>本章译述</span>
              <p>{reading.overview}</p>
            </div>

            <div className="reading-section-list">
              {reading.sections.map((section, index) => (
                <section className="reading-section" key={section.english}>
                  <div className="reading-section-index" aria-hidden="true">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div className="reading-copy">
                    <small>{section.english}</small>
                    <h4>{section.title}</h4>
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {section.checkpoint && (
                      <aside className="reading-checkpoint">
                        <span>停下来想一想</span>
                        <p>{section.checkpoint}</p>
                      </aside>
                    )}
                  </div>
                </section>
              ))}
            </div>

            <footer className="chapter-reading-source">
              <span>本站阅读到这里已经完整；下面链接仅供核对出处。</span>
              <a
                href="https://arxiv.org/pdf/2606.24937"
                target="_blank"
                rel="noreferrer"
              >
                可选：核对原文 pp. {reading.pages} ↗
              </a>
            </footer>
          </article>
        ))}
      </div>
    </section>
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
  const readings = readingsForLesson(lesson.slug);
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
          <strong>站内精读 · {readings.length} 章</strong>
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

      <ChapterReader readings={readings} />

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
      <EvidenceBlock kind="explanation" title="把事实连成一个可用的心智模型" items={lesson.explanations} />

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
          <h2>延伸核对原文（可选）</h2>
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
          Based on Guo et al., <em>The Hitchhiker&apos;s Guide to Agentic AI</em>,
          v2. 原作与本站衍生学习内容均以{" "}
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
