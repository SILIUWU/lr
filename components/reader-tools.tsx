"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCourse } from "./course-provider";

type SectionMeta = {
  id: string;
  number?: string;
  title: string;
};

export function ReaderTools({
  chapter,
  chapterTitle,
  sections,
}: {
  chapter: number;
  chapterTitle: string;
  sections: SectionMeta[];
}) {
  const {
    state,
    addNote,
    rememberChapter,
    markSectionComplete,
    updateReadingPosition,
  } = useCourse();
  const [currentSection, setCurrentSection] = useState(sections[0]?.id ?? "");
  const [noteOpen, setNoteOpen] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [intent, setIntent] =
    useState<"不懂" | "重要" | "存疑" | "深挖">("重要");
  const lastPosition = useRef(0);
  const restoredChapter = useRef<number | null>(null);

  const currentMeta = useMemo(
    () => sections.find((section) => section.id === currentSection),
    [currentSection, sections],
  );
  const sectionStateId = `ch-${chapter}:${currentSection}`;
  const completed = state.completedSections.includes(sectionStateId);
  const chapterCompletedCount = sections.filter((section) =>
    state.completedSections.includes(`ch-${chapter}:${section.id}`),
  ).length;

  useEffect(() => {
    rememberChapter(chapter, currentSection);
  }, [chapter, currentSection, rememberChapter]);

  useEffect(() => {
    const restoreLocation = () => {
      const hashId = decodeURIComponent(window.location.hash.slice(1));
      const target = hashId ? document.getElementById(hashId) : null;
      if (target) {
        setCurrentSection(hashId);
        requestAnimationFrame(() => {
          target.scrollIntoView({ block: "start" });
        });
        window.setTimeout(() => {
          target.scrollIntoView({ block: "start" });
        }, 350);
        restoredChapter.current = chapter;
        return true;
      }
      return false;
    };

    if (restoreLocation()) return;
    if (restoredChapter.current === chapter) return;
    const savedPosition = state.readingPositions[String(chapter)];
    if (typeof savedPosition === "number" && savedPosition > 0) {
      requestAnimationFrame(() => {
        const scrollable =
          document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: scrollable * savedPosition });
      });
      lastPosition.current = savedPosition;
      restoredChapter.current = chapter;
    }
  }, [chapter, state.readingPositions]);

  useEffect(() => {
    const followHash = () => {
      const hashId = decodeURIComponent(window.location.hash.slice(1));
      const target = hashId ? document.getElementById(hashId) : null;
      if (!target) return;
      setCurrentSection(hashId);
      target.scrollIntoView({ block: "start" });
    };
    window.addEventListener("hashchange", followHash);
    return () => window.removeEventListener("hashchange", followHash);
  }, []);

  useEffect(() => {
    const nodes = sections
      .map((section) => document.getElementById(section.id))
      .filter((node): node is HTMLElement => Boolean(node));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top) -
              Math.abs(b.boundingClientRect.top),
          )[0];
        if (visible) setCurrentSection(visible.target.id);
      },
      { rootMargin: "-18% 0px -68% 0px" },
    );
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    let frame = 0;
    const rememberPosition = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scrollable =
          document.documentElement.scrollHeight - window.innerHeight;
        const position = scrollable > 0 ? window.scrollY / scrollable : 0;
        if (Math.abs(position - lastPosition.current) > 0.015) {
          lastPosition.current = position;
          updateReadingPosition(chapter, position);
        }
      });
    };
    window.addEventListener("scroll", rememberPosition, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", rememberPosition);
    };
  }, [chapter, updateReadingPosition]);

  const openNote = () => {
    setExcerpt(window.getSelection()?.toString().trim() ?? "");
    setNoteOpen(true);
  };

  const saveNote = () => {
    if (!excerpt.trim() && !body.trim()) return;
    addNote({
      lessonSlug: "",
      lessonTitle: chapterTitle,
      chapter,
      sectionId: currentSection,
      sourceHref: `/read/ch-${String(chapter).padStart(2, "0")}#${currentSection}`,
      excerpt: excerpt.trim(),
      body: body.trim(),
      intent,
    });
    setExcerpt("");
    setBody("");
    setNoteOpen(false);
  };

  return (
    <>
      <aside className="reader-progress-dock" aria-label="阅读进度与批注">
        <div>
          <small>
            {currentMeta?.number ? `§${currentMeta.number}` : "当前小节"}
          </small>
          <strong>{currentMeta?.title ?? chapterTitle}</strong>
          <span>
            {chapterCompletedCount}/{sections.length} 节已标记
          </span>
        </div>
        <button
          type="button"
          className={completed ? "is-complete" : ""}
          onClick={() => markSectionComplete(sectionStateId)}
        >
          {completed ? "本节已完成 ✓" : "标记本节读完"}
        </button>
        <button type="button" onClick={openNote}>
          批注
        </button>
      </aside>

      {noteOpen && (
        <div className="reader-note-dialog" role="dialog" aria-modal="true">
          <button
            className="reader-note-scrim"
            type="button"
            aria-label="关闭批注"
            onClick={() => setNoteOpen(false)}
          />
          <section>
            <header>
              <div>
                <small>LOCAL NOTE · CH.{chapter}</small>
                <strong>{currentMeta?.title}</strong>
              </div>
              <button type="button" onClick={() => setNoteOpen(false)}>
                ×
              </button>
            </header>
            <label>
              <span>引用摘录</span>
              <textarea
                rows={3}
                value={excerpt}
                onChange={(event) => setExcerpt(event.target.value)}
              />
            </label>
            <label>
              <span>你的批注</span>
              <textarea
                rows={5}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="写下疑问、判断或下一步…"
              />
            </label>
            <div>
              <fieldset>
                <legend className="sr-only">批注意图</legend>
                {(["不懂", "重要", "存疑", "深挖"] as const).map((item) => (
                  <button
                    type="button"
                    key={item}
                    className={intent === item ? "active" : ""}
                    onClick={() => setIntent(item)}
                  >
                    {item}
                  </button>
                ))}
              </fieldset>
              <button
                className="primary-button compact"
                type="button"
                onClick={saveNote}
              >
                保存到本地
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
