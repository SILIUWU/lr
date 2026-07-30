"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useCourse } from "./course-provider";

function download(name: string, body: string, type: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function NotesPage() {
  const { state, deleteNote, exportState, importState } = useCourse();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");

  const exportMarkdown = () => {
    const body = [
      "# Agentic AI 全栈指南 · 学习笔记",
      "",
      `导出时间：${new Date().toLocaleString("zh-CN")}`,
      "",
      ...state.notes.flatMap((note) => [
        `## ${note.lessonTitle} · ${note.intent}`,
        "",
        note.excerpt ? `> ${note.excerpt.replaceAll("\n", "\n> ")}` : "",
        "",
        note.body,
        "",
        `[返回课程](${window.location.origin}/learn/${note.lessonSlug})`,
        "",
      ]),
    ].join("\n");
    download("agentic-ai-notes.md", body, "text/markdown;charset=utf-8");
  };

  const restore = async (file: File) => {
    const result = importState(await file.text());
    setMessage(result.message);
  };

  return (
    <div className="utility-page">
      <header className="utility-hero">
        <span className="eyebrow">LOCAL NOTEBOOK</span>
        <h1>把“看懂了”变成可回查的判断</h1>
        <p>
          在任意学习页划选文字并添加批注。所有内容只保存在浏览器，不会上传到服务器。
        </p>
        <div className="utility-actions">
          <button className="primary-button" type="button" onClick={exportMarkdown} disabled={!state.notes.length}>
            导出 Markdown
          </button>
          <button className="secondary-button" type="button" onClick={() => download("agentic-ai-learning-state.json", exportState(), "application/json")}>
            备份学习状态
          </button>
          <button className="secondary-button" type="button" onClick={() => inputRef.current?.click()}>
            恢复 JSON
          </button>
          <input
            className="sr-only"
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            onChange={(event) => event.target.files?.[0] && restore(event.target.files[0])}
          />
          {message && <span role="status">{message}</span>}
        </div>
      </header>

      {!state.notes.length ? (
        <section className="empty-state">
          <span>✎</span>
          <h2>这里还没有批注</h2>
          <p>进入一个学习单元，划选一段文字，再点击页面右下角的批注按钮。</p>
          <Link className="primary-button" href="/learn/agentic-stack">打开 Agentic Stack →</Link>
        </section>
      ) : (
        <section className="note-list">
          {state.notes.map((note) => (
            <article key={note.id}>
              <header>
                <div>
                  <span className={`note-intent intent-${note.intent}`}>{note.intent}</span>
                  <Link href={`/learn/${note.lessonSlug}`}>{note.lessonTitle} ↗</Link>
                </div>
                <button type="button" onClick={() => deleteNote(note.id)} aria-label="删除批注">×</button>
              </header>
              {note.excerpt && <blockquote>{note.excerpt}</blockquote>}
              <p>{note.body}</p>
              <time dateTime={new Date(note.createdAt).toISOString()}>
                {new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(note.createdAt)}
              </time>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
