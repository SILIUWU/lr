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
  let markup = "";
  if (block.latex) {
    try {
      markup = katex.renderToString(block.latex, {
        displayMode: true,
        throwOnError: false,
        output: "htmlAndMathml",
      });
    } catch {
      markup = "";
    }
  }
  return (
    <div className="native-formula">
      {markup ? (
        <div
          className="native-formula-expression"
          dangerouslySetInnerHTML={{ __html: markup }}
        />
      ) : (
        <pre>{block.expression}</pre>
      )}
      {block.reading && <p>{block.reading}</p>}
      {block.symbols?.length ? (
        <dl>
          {block.symbols.map(([symbol, meaning]) => (
            <div key={symbol}>
              <dt>{symbol}</dt>
              <dd>{meaning}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

function BlockRenderer({ block }: { block: ReadingBlock }) {
  return (
    <section
      className={`reader-block block-${block.type} block-origin-${block.origin}`}
      id={block.id}
    >
      <SourceLine block={block} />
      {block.title && <h4>{block.title}</h4>}

      {block.type === "paragraph" && (
        <>
          <p>{block.text}</p>
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
            <li key={item}>{item}</li>
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
            // eslint-disable-next-line @next/next/no-img-element
            <img src={withBasePath(block.src)} alt={block.alt} />
          ) : (
            <div className="figure-transcript" role="img" aria-label={block.alt}>
              <span>FIGURE TRANSCRIPT</span>
              <p>{block.alt}</p>
            </div>
          )}
          <figcaption>
            {block.caption}
            {block.adapted && <small>adapted from the source figure</small>}
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
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, index) => (
                <tr key={`${block.id}-${index}`}>
                  {row.map((cell, cellIndex) => (
                    <td key={`${block.id}-${index}-${cellIndex}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {block.type === "example" && (
        <div className="native-example">
          <p>{block.scenario}</p>
          <ol>
            {block.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          {block.result && (
            <p>
              <strong>结果：</strong>
              {block.result}
            </p>
          )}
          {block.limitation && (
            <p>
              <strong>限制：</strong>
              {block.limitation}
            </p>
          )}
        </div>
      )}

      {(block.type === "callout" || block.type === "failure") && (
        <p className="native-callout">{block.text}</p>
      )}
    </section>
  );
}

function SectionHeading({
  section,
}: {
  section: ChapterContent["sections"][number];
}) {
  const copy = (
    <>
      <span>{section.number ? `§${section.number}` : "INTRO"}</span>
      <small>
        {section.enTitle === section.zhTitle
          ? "ORIGINAL SECTION TITLE"
          : section.enTitle}
      </small>
      <strong>{section.zhTitle}</strong>
      <em>pp. {section.pages}</em>
    </>
  );
  if (section.level >= 3) return <h4 className="reader-section-heading">{copy}</h4>;
  if (section.level === 2) return <h3 className="reader-section-heading">{copy}</h3>;
  return <h2 className="reader-section-heading">{copy}</h2>;
}

export function ChapterReader({ chapter }: { chapter: ChapterContent }) {
  const previous = chapter.chapter > 1 ? chapter.chapter - 1 : null;
  const next = chapter.chapter < 30 ? chapter.chapter + 1 : null;
  const statusLabel =
    chapter.status === "complete"
      ? "精读完成"
      : chapter.status === "guide"
        ? "章节导读"
        : "逐节译读 · 校订中";
  const progressPercent = Math.round(
    (chapter.metrics.chineseCharacters / 300000) * 100,
  );

  return (
    <article className="reader-page">
      <header className="reader-hero">
        <div className="reader-hero-number">
          <span>CHAPTER</span>
          <strong>{String(chapter.chapter).padStart(2, "0")}</strong>
        </div>
        <div className="reader-hero-copy">
          <div>
            <span className={`reader-status status-${chapter.status}`}>
              {statusLabel}
            </span>
            <span>原书 pp. {chapter.pages}</span>
            <span>约 {chapter.minutes} 分钟</span>
          </div>
          <p lang="en">{chapter.title}</p>
          <h1>{chapter.zhTitle}</h1>
          <blockquote>{chapter.overview}</blockquote>
          <dl>
            <div>
              <dt>{chapter.metrics.sectionCount}</dt>
              <dd>个结构条目</dd>
            </div>
            <div>
              <dt>{chapter.metrics.blockCount}</dt>
              <dd>个已发布区块</dd>
            </div>
            <div>
              <dt>
                {new Intl.NumberFormat("zh-CN").format(
                  chapter.metrics.chineseCharacters,
                )}
              </dt>
              <dd>已核验中文字符</dd>
            </div>
            <div>
              <dt>{chapter.metrics.sourceCoverage}%</dt>
              <dd>小节核验覆盖</dd>
            </div>
          </dl>
          {chapter.status === "in_progress" && (
            <aside className="reader-disclosure">
              诚信说明：旧版未经校订的机器翻译已下线。本章目录仍在依据
              arXiv LaTeX 原文逐节重建；只有显示“已对照原文核验”的区块才属于
              可读译文，其他小节会明确标记为制作中。
            </aside>
          )}
        </div>
      </header>

      <div className="reader-layout">
        <aside className="reader-outline">
          <div>
            <span className="eyebrow">ON THIS PAGE</span>
            <strong>本章目录</strong>
            <small>
              本章已核验正文约占全书最低验收体量的 {progressPercent}%
            </small>
          </div>
          <nav aria-label={`第 ${chapter.chapter} 章目录`}>
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
          <a
            className="reader-source-button"
            href={sourceUrl(chapter.pages)}
            target="_blank"
            rel="noreferrer"
          >
            查看本章 PDF 来源 ↗
          </a>
        </aside>

        <div className="reader-body">
          <section className="reader-contract">
            <div>
              <span className="origin-label origin-source_translation">
                原文译述
              </span>
              <p>仅发布已对照 arXiv LaTeX 与 PDF 页面的译述。</p>
            </div>
            <div>
              <span className="origin-label origin-editorial_explanation">
                编者解释
              </span>
              <p>用于补足直觉、背景或推导，不冒充原文。</p>
            </div>
            <div>
              <span className="origin-label origin-engineering_extension">
                工程延伸
              </span>
              <p>面向实现的建议，需要结合实际系统验证。</p>
            </div>
          </section>

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
                      本节会从 LaTeX 源重新拆分正文、公式、代码和图表后发布。
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
              <em>The Hitchhiker&apos;s Guide to Agentic AI: From Foundations to Systems</em>,
              arXiv v2 / book version 1.3. 原作与本站译述均依{" "}
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
                <strong>CH.{String(previous).padStart(2, "0")}</strong>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={chapterHref(next)}>
                <small>下一章 →</small>
                <strong>CH.{String(next).padStart(2, "0")}</strong>
              </Link>
            ) : (
              <Link href="/progress">
                <small>完成阅读 →</small>
                <strong>查看学习进度</strong>
              </Link>
            )}
          </nav>
        </div>
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
