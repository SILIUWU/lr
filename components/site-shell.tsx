"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { lessons } from "@/lib/course-data";
import { useCourse } from "./course-provider";

type SearchEntry = {
  chapter: number;
  sectionId: string;
  sectionNumber?: string | null;
  title: string;
  enTitle: string;
  search: string;
};

const mainNav = [
  { href: "/", label: "知识地图", icon: "⌁" },
  { href: "/#chapter-directory", label: "30 章阅读", icon: "¶" },
  { href: "/review", label: "到期复习", icon: "↻" },
  { href: "/notes", label: "批注与提问包", icon: "✎" },
  { href: "/progress", label: "学习进度", icon: "◔" },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, toggleTheme } = useCourse();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState<SearchEntry[]>([]);
  useEffect(() => {
    if (!query.trim() || searchIndex.length) return;
    let active = true;
    void import("@/content/search-index.json").then((module) => {
      if (active) setSearchIndex(module.default as SearchEntry[]);
    });
    return () => {
      active = false;
    };
  }, [query, searchIndex.length]);
  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("zh-CN");
    if (!normalized) return [];
    return searchIndex
      .filter((entry) => entry.search.includes(normalized))
      .sort((a, b) => {
        const aTitle =
          a.title.toLocaleLowerCase("zh-CN").includes(normalized) ||
          a.enTitle.toLocaleLowerCase("zh-CN").includes(normalized);
        const bTitle =
          b.title.toLocaleLowerCase("zh-CN").includes(normalized) ||
          b.enTitle.toLocaleLowerCase("zh-CN").includes(normalized);
        return Number(bTitle) - Number(aTitle);
      })
      .slice(0, 8);
  }, [query, searchIndex]);
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
            placeholder="搜索全文、术语或 section…"
          />
          {query && (
            <div className="search-results" role="status">
              {results.length ? (
                results.map((lesson) => (
                  <Link
                    key={`${lesson.chapter}-${lesson.sectionId}`}
                    href={`/read/ch-${String(lesson.chapter).padStart(2, "0")}#${lesson.sectionId}`}
                    onClick={closeNavigation}
                  >
                    <small>
                      CH.{String(lesson.chapter).padStart(2, "0")}
                      {lesson.sectionNumber
                        ? ` · §${lesson.sectionNumber}`
                        : ""}
                    </small>
                    {lesson.title}
                    <em>{lesson.enTitle}</em>
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
