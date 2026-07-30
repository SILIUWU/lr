import Link from "next/link";
import katex from "katex";
import type {
  ChapterContent,
  ContentOrigin,
  FormulaBlock,
  ReadingBlock,
} from "@/lib/types";
import { withBasePath } from "@/lib/site-path";
import { chapterHref } from "@/lib/chapter-content";
import { ReaderTools } from "./reader-tools";

const originLabels: Record<ContentOrigin, string> = {
  source_translation: "原文译述",
  source_definition: "原文定义",
  editorial_explanation: "编者解释",
  engineering_extension: "工程延伸",
  source_unspecified: "原文未说明",
  failure_analysis: "失败模式",
};

function sourceUrl(pages: string) {
  const page = Number.parseInt(pages, 10);
  return `https://arxiv.org/pdf/2606.24937#page=${Number.isFinite(page) ? page : 1}`;
}

function renderKatex(latex: string, displayMode: boolean) {
  try {
    const markup = katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: "ignore",
      output: "htmlAndMathml",
      macros: {
        "\\bm": "\\mathbf{#1}",
      },
    });
    return markup.includes("katex-error") ? "" : markup;
  } catch {
    return "";
  }
}

function InlineMathText({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (!(part.startsWith("$") && part.endsWith("$"))) {
          return part;
        }
        const latex = part.slice(1, -1);
        const markup = renderKatex(latex, false);
        return markup ? (
          <span
            className="inline-math"
            key={`${latex}-${index}`}
            dangerouslySetInnerHTML={{ __html: markup }}
          />
        ) : (
          <span className="inline-math-fallback" key={`${latex}-${index}`}>
            公式渲染待修复
          </span>
        );
      })}
    </>
  );
}

function SourceLine({ block }: { block: ReadingBlock }) {
  const source = block.source;
  return (
    <div className="reader-source-line">
      <span className={`origin-label origin-${block.origin}`}>
        {block.type === "failure" ? "失败模式" : originLabels[block.origin]}
      </span>
      {block.reviewStatus === "verified" &&
        ["source_translation", "source_definition"].includes(block.origin) && (
          <span className="review-verified">已对照原文核验</span>
        )}
      <span>Ch.{source.chapter}</span>
      {source.section && <span>§{source.section}</span>}
      {source.equation && <span>Eq.{source.equation}</span>}
      {source.figure && <span>{source.figure}</span>}
      {source.table && <span>{source.table}</span>}
      <a href={sourceUrl(source.pages)} target="_blank" rel="noreferrer">
        PDF p. {source.pages} ↗
      </a>
    </div>
  );
}

function Formula({ block }: { block: FormulaBlock }) {
  const markup = block.latex ? renderKatex(block.latex, true) : "";
  return (
    <div className="native-formula">
      {markup ? (
        <div
          className="native-formula-expression"
          dangerouslySetInnerHTML={{ __html: markup }}
        />
      ) : (
        <p className="math-render-error">该公式暂时无法渲染，已进入校订队列。</p>
      )}
      {block.reading && (
        <p>
          <InlineMathText text={block.reading} />
        </p>
      )}
      {block.symbols?.length ? (
        <dl>
          {block.symbols.map(([symbol, meaning]) => (
            <div key={symbol}>
              <dt>
                <InlineMathText text={`$${symbol}$`} />
              </dt>
              <dd>
                <InlineMathText text={meaning} />
              </dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

function BlockRenderer({ block }: { block: ReadingBlock }) {
  const showSourceLine =
    block.type !== "paragraph" || block.origin !== "source_translation";

  return (
    <section
      className={`reader-block block-${block.type} block-origin-${block.origin}`}
      id={block.id}
    >
      {showSourceLine && <SourceLine block={block} />}
      {block.title && <h4>{block.title}</h4>}

      {block.type === "paragraph" && (
        <>
          <p>
            <InlineMathText text={block.text} />
          </p>
          {block.originalExcerpt && (
            <details className="original-excerpt">
              <summary>查看关键英文原文</summary>
              <blockquote lang="en">{block.originalExcerpt}</blockquote>
            </details>
          )}
        </>
      )}

      {block.type === "list" && (
        <ul>
          {block.items.map((item) => (
            <li key={item}>
              <InlineMathText text={item} />
            </li>
          ))}
        </ul>
      )}

      {block.type === "formula" && <Formula block={block} />}

      {block.type === "code" && (
        <div className="native-code">
          <header>
            <span>{block.language}</span>
            <small>原生文本 · 可选择复制</small>
          </header>
          <pre>
            <code>{block.code}</code>
          </pre>
          {block.explanation && <p>{block.explanation}</p>}
        </div>
      )}

      {block.type === "figure" && (
        <figure className="native-figure">
          {block.src ? (
            <a
              className="native-figure-image"
              href={withBasePath(block.src)}
              target="_blank"
              rel="noreferrer"
              aria-label={`打开原图：${block.alt}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={withBasePath(block.src)} alt={block.alt} />
            </a>
          ) : (
            <div className="figure-transcript" role="img" aria-label={block.alt}>
              <span>FIGURE TRANSCRIPT</span>
              <p>{block.alt}</p>
            </div>
          )}
          <figcaption>
            {block.caption}
            <small>
              {block.adapted
                ? "本站改绘 · adapted from the source figure"
                : "原书独立图形 · 未改绘 · 点击查看原始尺寸"}
            </small>
          </figcaption>
        </figure>
      )}

      {block.type === "table" && (
        <div className="native-table">
          {block.caption && <p>{block.caption}</p>}
          <table>
            <thead>
              <tr>
                {block.columns.map((column) => (
                  <th key={column} scope="col">
                    <InlineMathText text={column} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, index) => (
                <tr key={`${block.id}-${index}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${block.id}-${index}-${cellIndex}`}>
                      <InlineMathText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {block.type === "example" && (
        <div className="native-example">
          <p>
            <InlineMathText text={block.scenario} />
          </p>
          <ol>
            {block.steps.map((step) => (
              <li key={step}>
                <InlineMathText text={step} />
              </li>
            ))}
          </ol>
          {block.result && (
            <p>
              <strong>结果：</strong>
              <InlineMathText text={block.result} />
            </p>
          )}
          {block.limitation && (
            <p>
              <strong>限制：</strong>
              <InlineMathText text={block.limitation} />
            </p>
          )}
        </div>
      )}

      {(block.type === "callout" || block.type === "failure") && (
        <p className="native-callout">
          <InlineMathText text={block.text} />
        </p>
      )}
    </section>
  );
}

function SectionHeading({
  section,
}: {
  section: ChapterContent["sections"][number];
}) {
  const HeadingTag =
    section.level >= 3 ? "h4" : section.level === 2 ? "h3" : "h2";
  const verified = section.blocks.some(
    (block) =>
      block.reviewStatus === "verified" &&
      ["source_translation", "source_definition"].includes(block.origin),
  );

  return (
    <header className="reader-section-heading">
      <div>
        <span>{section.number ? `§ ${section.number}` : "章节导读"}</span>
        <a href={sourceUrl(section.pages)} target="_blank" rel="noreferrer">
          PDF pp. {section.pages} ↗
        </a>
      </div>
      <HeadingTag>{section.zhTitle}</HeadingTag>
      {section.enTitle !== section.zhTitle && (
        <p lang="en">{section.enTitle}</p>
      )}
      {verified && <small>本节译述已对照原文核验</small>}
    </header>
  );
}

export function ChapterReader({ chapter }: { chapter: ChapterContent }) {
  const previous = chapter.chapter > 1 ? chapter.chapter - 1 : null;
  const next = chapter.chapter < 30 ? chapter.chapter + 1 : null;
  const statusLabel =
    chapter.status === "complete"
      ? "精读完成"
      : chapter.status === "guide"
        ? "章节导读"
        : "精读重建中";
  const topLevelSections = chapter.sections.filter(
    (section) => section.level === 1,
  );

  return (
    <article className="reader-page">
      <div className="reader-book-layout">
        <div className="reader-body">
          <header className="reader-hero">
            <nav className="reader-breadcrumbs" aria-label="面包屑">
              <Link href="/">首页</Link>
              <span>/</span>
              <Link href="/#chapter-directory">全书目录</Link>
              <span>/</span>
              <strong>第 {chapter.chapter} 章</strong>
            </nav>
            <div className="reader-chapter-kicker">
              <span>Chapter {String(chapter.chapter).padStart(2, "0")}</span>
              <span className={`reader-status status-${chapter.status}`}>
                {statusLabel}
              </span>
            </div>
            <h1>{chapter.zhTitle}</h1>
            <p className="reader-english-title" lang="en">
              {chapter.title}
            </p>
            <div className="reader-hero-meta">
              <span>原书 pp. {chapter.pages}</span>
              <span>约 {chapter.minutes} 分钟</span>
              <span>{chapter.metrics.sectionCount} 个结构条目</span>
              <span>{chapter.metrics.sourceCoverage}% 目录结构映射</span>
              <span>
                {new Intl.NumberFormat("zh-CN").format(
                  chapter.metrics.chineseCharacters,
                )}{" "}
                个已核验中文字符
              </span>
            </div>
            <aside className="reader-overview">
              <strong>本章导读</strong>
              <p>{chapter.overview}</p>
            </aside>
            {chapter.status === "in_progress" && (
              <aside className="reader-disclosure">
                <strong>发布状态说明</strong>
                <p>
                  目录结构已经映射，不等于正文已经完整翻译。旧版未经校订的机器翻译已下线；
                  本章正依据 arXiv LaTeX 原文逐节重建。当前发布内容属于已核验导读与部分精读，
                  不是本章完整译本。
                </p>
              </aside>
            )}
          </header>

          <details className="reader-mobile-outline">
            <summary>展开本章完整目录（{chapter.sections.length} 节）</summary>
            <nav aria-label={`第 ${chapter.chapter} 章完整目录`}>
              {chapter.sections.map((section) => (
                <a
                  href={`#${section.id}`}
                  className={`outline-level-${section.level}`}
                  key={section.id}
                >
                  <span>{section.number ?? "·"}</span>
                  {section.zhTitle}
                </a>
              ))}
            </nav>
          </details>

          <details className="reader-contract">
            <summary>如何辨认“原文译述”与编者内容</summary>
            <div>
              <section>
                <span className="origin-label origin-source_translation">
                  原文译述
                </span>
                <p>仅发布已对照 arXiv LaTeX 与 PDF 页面的译述。</p>
              </section>
              <section>
                <span className="origin-label origin-editorial_explanation">
                  编者解释
                </span>
                <p>用于补足直觉、背景或推导，不冒充原文。</p>
              </section>
              <section>
                <span className="origin-label origin-engineering_extension">
                  工程延伸
                </span>
                <p>面向实现的建议，需要结合实际系统验证。</p>
              </section>
            </div>
          </details>

          <div className="reader-content">
            {chapter.sections.map((section) => (
              <section
                className={`reader-section reader-level-${section.level}`}
                id={section.id}
                key={section.id}
              >
                <SectionHeading section={section} />
                <div className="reader-block-list">
                  {section.blocks.length ? (
                    section.blocks.map((block) => (
                      <BlockRenderer block={block} key={block.id} />
                    ))
                  ) : (
                    <aside className="reader-review-pending">
                      <strong>本节译文正在重新校订</strong>
                      <p>
                        未经核验的机器草稿已撤下，暂不以“原文译述”名义展示。
                        本节会从 LaTeX
                        源重新拆分正文、公式、代码和图表后发布。
                      </p>
                      <a
                        href={sourceUrl(section.pages)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        临时查看 PDF p. {section.pages} 来源 ↗
                      </a>
                    </aside>
                  )}
                </div>
              </section>
            ))}
          </div>

          {chapter.glossary.length > 0 && (
            <section className="reader-glossary">
              <span className="eyebrow">CHAPTER GLOSSARY</span>
              <h2>本章术语</h2>
              <dl>
                {chapter.glossary.map((term) => (
                  <div key={term.term}>
                    <dt>
                      {term.term} <small>{term.zh}</small>
                    </dt>
                    <dd>{term.meaning}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <footer className="reader-license">
            <p>
              Source: Haggai Roitman,{" "}
              <em>
                The Hitchhiker&apos;s Guide to Agentic AI: From Foundations
                to Systems
              </em>
              , arXiv v2 / book version 1.3. 原作与本站译述均依{" "}
              <a
                href="https://creativecommons.org/licenses/by-sa/4.0/"
                target="_blank"
                rel="noreferrer"
              >
                CC BY-SA 4.0
              </a>{" "}
              发布。本站进行了翻译、结构重组、网页转写、解释和工程扩展，并非作者官方版本。
            </p>
          </footer>

          <nav className="reader-pagination" aria-label="前后章节">
            {previous ? (
              <Link href={chapterHref(previous)}>
                <small>← 上一章</small>
                <strong>第 {previous} 章</strong>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={chapterHref(next)}>
                <small>下一章 →</small>
                <strong>第 {next} 章</strong>
              </Link>
            ) : (
              <Link href="/progress">
                <small>完成阅读 →</small>
                <strong>查看学习进度</strong>
              </Link>
            )}
          </nav>
        </div>

        <aside className="reader-outline">
          <div>
            <span className="eyebrow">本页目录</span>
            <strong>本章结构</strong>
            <small>
              仅列一级结构；正文包含全部 {chapter.sections.length} 个小节
            </small>
          </div>
          <nav aria-label={`第 ${chapter.chapter} 章目录`}>
            {topLevelSections.map((section) => (
              <a href={`#${section.id}`} key={section.id}>
                <span>{section.number ?? "·"}</span>
                {section.zhTitle}
              </a>
            ))}
          </nav>
          <a
            className="reader-source-button"
            href={sourceUrl(chapter.pages)}
            target="_blank"
            rel="noreferrer"
          >
            查看本章 PDF 来源 ↗
          </a>
          <small className="reader-volume-note">
            当前已核验中文约{" "}
            {new Intl.NumberFormat("zh-CN").format(
              chapter.metrics.chineseCharacters,
            )}{" "}
            字；目录映射不代表完整翻译。
          </small>
        </aside>
      </div>

      <ReaderTools
        chapter={chapter.chapter}
        chapterTitle={chapter.zhTitle}
        sections={chapter.sections.map((section) => ({
          id: section.id,
          number: section.number,
          title: section.zhTitle,
        }))}
      />
    </article>
  );
}
