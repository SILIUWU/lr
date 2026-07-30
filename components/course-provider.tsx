"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { scheduleReview } from "@/lib/scheduler";
import {
  emptyLearningState,
  isLearningState,
  isLearningStateV1,
  migrateLearningStateV1,
} from "@/lib/learning-state";
import type {
  LearningState,
  NoteItem,
  Quiz,
  ReviewCard,
} from "@/lib/types";

const STORAGE_KEY = "agentic-ai-guide-state-v2";
const LEGACY_STORAGE_KEY = "agentic-ai-guide-state-v1";

type RecordQuizInput = {
  quiz: Quiz;
  lessonSlug: string;
  correct: boolean;
  score: number;
};

type CourseContextValue = {
  state: LearningState;
  hydrated: boolean;
  markLessonComplete: (slug: string) => void;
  rememberLesson: (slug: string) => void;
  rememberChapter: (chapter: number, sectionId?: string) => void;
  markSectionComplete: (sectionId: string) => void;
  updateReadingPosition: (chapter: number, position: number) => void;
  recordQuiz: (input: RecordQuizInput) => ReviewCard;
  addNote: (note: Omit<NoteItem, "id" | "createdAt">) => void;
  deleteNote: (id: string) => void;
  toggleTheme: () => void;
  exportState: () => string;
  importState: (payload: string) => { ok: boolean; message: string };
};

const CourseContext = createContext<CourseContextValue | null>(null);

export function CourseProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LearningState>(emptyLearningState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY) ??
        localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        let restored: LearningState | null = null;
        if (isLearningState(parsed)) {
          restored = parsed;
        } else if (isLearningStateV1(parsed)) {
          restored = migrateLearningStateV1(parsed);
        }
        if (restored) {
          queueMicrotask(() => setState(restored));
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    document.documentElement.dataset.theme = state.theme;
    document.documentElement.style.colorScheme = state.theme;
  }, [hydrated, state]);

  const rememberLesson = useCallback((slug: string) => {
    setState((current) => ({ ...current, lastLesson: slug }));
  }, []);

  const markLessonComplete = useCallback((slug: string) => {
    setState((current) => ({
      ...current,
      lastLesson: slug,
      completedLessons: current.completedLessons.includes(slug)
        ? current.completedLessons
        : [...current.completedLessons, slug],
    }));
  }, []);

  const rememberChapter = useCallback((chapter: number, sectionId?: string) => {
    setState((current) => ({
      ...current,
      lastChapter: chapter,
      lastSection: sectionId ?? current.lastSection,
    }));
  }, []);

  const markSectionComplete = useCallback((sectionId: string) => {
    setState((current) => ({
      ...current,
      lastSection: sectionId,
      completedSections: current.completedSections.includes(sectionId)
        ? current.completedSections
        : [...current.completedSections, sectionId],
    }));
  }, []);

  const updateReadingPosition = useCallback(
    (chapter: number, position: number) => {
      setState((current) => ({
        ...current,
        lastChapter: chapter,
        readingPositions: {
          ...current.readingPositions,
          [String(chapter)]: Math.max(0, Math.min(1, position)),
        },
      }));
    },
    [],
  );

  const recordQuiz = useCallback(
    ({ quiz, lessonSlug, correct, score }: RecordQuizInput) => {
      const now = Date.now();
      const nextCard = scheduleReview(
        state.cards[quiz.id],
        score,
        now,
        { quizId: quiz.id, lessonSlug, topic: quiz.topic },
      );
      setState((current) => ({
        ...current,
        attempts: [
          ...current.attempts,
          { quizId: quiz.id, lessonSlug, correct, score, at: now },
        ].slice(-500),
        cards: {
          ...current.cards,
          [quiz.id]: scheduleReview(
            current.cards[quiz.id],
            score,
            now,
            { quizId: quiz.id, lessonSlug, topic: quiz.topic },
          ),
        },
      }));
      return nextCard;
    },
    [state.cards],
  );

  const addNote = useCallback(
    (note: Omit<NoteItem, "id" | "createdAt">) => {
      setState((current) => ({
        ...current,
        notes: [
          {
            ...note,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
          },
          ...current.notes,
        ],
      }));
    },
    [],
  );

  const deleteNote = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      notes: current.notes.filter((note) => note.id !== id),
    }));
  }, []);

  const toggleTheme = useCallback(() => {
    setState((current) => ({
      ...current,
      theme: current.theme === "light" ? "dark" : "light",
    }));
  }, []);

  const exportState = useCallback(() => JSON.stringify(state, null, 2), [state]);

  const importState = useCallback((payload: string) => {
    try {
      const parsed = JSON.parse(payload);
      if (isLearningStateV1(parsed)) {
        setState(migrateLearningStateV1(parsed));
        return { ok: true, message: "旧版学习状态已迁移并恢复。" };
      }
      if (!isLearningState(parsed)) {
        return { ok: false, message: "文件结构不符合 LearningState v1/v2。" };
      }
      setState(parsed);
      return { ok: true, message: "学习状态已恢复。" };
    } catch {
      return { ok: false, message: "无法解析这个 JSON 文件。" };
    }
  }, []);

  const value = useMemo(
    () => ({
      state,
      hydrated,
      markLessonComplete,
      rememberLesson,
      rememberChapter,
      markSectionComplete,
      updateReadingPosition,
      recordQuiz,
      addNote,
      deleteNote,
      toggleTheme,
      exportState,
      importState,
    }),
    [
      state,
      hydrated,
      markLessonComplete,
      rememberLesson,
      rememberChapter,
      markSectionComplete,
      updateReadingPosition,
      recordQuiz,
      addNote,
      deleteNote,
      toggleTheme,
      exportState,
      importState,
    ],
  );

  return (
    <CourseContext.Provider value={value}>{children}</CourseContext.Provider>
  );
}

export function useCourse() {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error("useCourse must be used inside CourseProvider");
  }
  return context;
}
