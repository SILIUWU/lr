"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { lessons, searchLessons } from "@/lib/course-data";
import { readingsForLesson } from "@/lib/reading-content";
import { useCourse } from "./course-provider";

const mainNav = [
  { href: "/", label: "知识地图", icon: "⌁" },
  { href: "/review", label: "到期复习", icon: "↻" },
  { href: "/notes", label: "批注与提问包", icon: "✎" },
  { href: "/progress", label: "学习进度", icon: "◔" },
];

const readingSearchIndex = Object.fromEntries(
  lessons.map((lesson) => [
    lesson.slug,
    readingsForLesson(lesson.slug)
      .flatMap((reading) => [
        reading.title,
        reading.zhTitle,
        reading.overview,
        ...reading.sections.flatMap((section) => [
          section.title,
          section.english,
          ...section.paragraphs,
          section.checkpoint ?? "",
        ]),
      ])
      .join(" "),
  ]),
);

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, toggleTheme } = useCourse();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const results = useMemo(
    () => searchLessons(query, readingSearchIndex).slice(0, 6),
    [query],
  );
  const closeNavigation = () => {
    setDrawerOpen(false);
    setQuery("");
  };

  return (
    <div className="site-grid">
      <a className="skip-link" href="#main-content">
        跳到正文
      </a>
      <header className="mobile-header">
        <button
          className="icon-button"
          type="button"
          aria-label={drawerOpen ? "关闭目录" : "打开目录"}
          aria-expanded={drawerOpen}
          onClick={() => setDrawerOpen((value) => !value)}
        >
          {drawerOpen ? "×" : "☰"}
        </button>
        <Link className="mobile-brand" href="/">
          Agentic AI <span>全栈指南</span>
        </Link>
        <button
          className="icon-button"
          type="button"
          onClick={toggleTheme}
          aria-label="切换深浅主题"
        >
          {state.theme === "light" ? "◐" : "☀"}
        </button>
      </header>

      <aside className={`sidebar ${drawerOpen ? "is-open" : ""}`}>
        <div className="brand-lockup">
          <Link href="/" aria-label="Agentic AI 全栈指南首页" onClick={closeNavigation}>
            <span className="brand-kicker">FROM FOUNDATIONS TO SYSTEMS</span>
            <strong>Agentic AI</strong>
            <span className="brand-zh">全栈指南</span>
          </Link>
        </div>

        <div className="search-box">
          <span aria-hidden="true">⌕</span>
          <label className="sr-only" htmlFor="course-search">
            搜索课程
          </label>
          <input
            id="course-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索 RAG、MCP、GRPO…"
          />
          {query && (
            <div className="search-results" role="status">
              {results.length ? (
                results.map((lesson) => (
                  <Link key={lesson.slug} href={`/learn/${lesson.slug}`} onClick={closeNavigation}>
                    <small>{lesson.chapters}</small>
                    {lesson.title}
                  </Link>
                ))
              ) : (
                <p>没有找到相关单元</p>
              )}
            </div>
          )}
        </div>

        <nav className="main-nav" aria-label="主导航">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              className={pathname === item.href ? "active" : ""}
              href={item.href}
              onClick={closeNavigation}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
              {item.href === "/review" && (
                <em>{Object.keys(state.cards).length}</em>
              )}
            </Link>
          ))}
        </nav>

        <div className="sidebar-section-title">
          <span>12 个学习单元</span>
          <span>
            {state.completedLessons.length}/{lessons.length}
          </span>
        </div>
        <nav className="lesson-nav" aria-label="课程目录">
          {lessons.map((lesson) => {
            const current = pathname === `/learn/${lesson.slug}`;
            const completed = state.completedLessons.includes(lesson.slug);
            return (
              <Link
                href={`/learn/${lesson.slug}`}
                key={lesson.slug}
                onClick={closeNavigation}
                className={current ? "active" : ""}
                aria-current={current ? "page" : undefined}
              >
                <span className={completed ? "lesson-index done" : "lesson-index"}>
                  {completed ? "✓" : String(lesson.index + 1).padStart(2, "0")}
                </span>
                <span>
                  <small>{lesson.chapters}</small>
                  {lesson.title}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button type="button" onClick={toggleTheme}>
            <span aria-hidden="true">{state.theme === "light" ? "◐" : "☀"}</span>
            {state.theme === "light" ? "切换深色阅读" : "切换浅色阅读"}
          </button>
          <p>学习记录仅保存在此设备</p>
        </div>
      </aside>
      {drawerOpen && (
        <button
          type="button"
          className="drawer-scrim"
          aria-label="关闭目录"
          onClick={() => setDrawerOpen(false)}
        />
      )}
      <main id="main-content" className="main-content">
        {children}
      </main>
    </div>
  );
}
