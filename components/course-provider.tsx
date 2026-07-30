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
import type {
  LearningState,
  NoteItem,
  Quiz,
  ReviewCard,
} from "@/lib/types";

const STORAGE_KEY = "agentic-ai-guide-state-v1";

const emptyState: LearningState = {
  version: 1,
  completedLessons: [],
  lastLesson: null,
  attempts: [],
  cards: {},
  notes: [],
  theme: "light",
};

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
  recordQuiz: (input: RecordQuizInput) => ReviewCard;
  addNote: (note: Omit<NoteItem, "id" | "createdAt">) => void;
  deleteNote: (id: string) => void;
  toggleTheme: () => void;
  exportState: () => string;
  importState: (payload: string) => { ok: boolean; message: string };
};

const CourseContext = createContext<CourseContextValue | null>(null);

function isLearningState(value: unknown): value is LearningState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LearningState>;
  return (
    candidate.version === 1 &&
    Array.isArray(candidate.completedLessons) &&
    Array.isArray(candidate.attempts) &&
    Array.isArray(candidate.notes) &&
    typeof candidate.cards === "object" &&
    (candidate.theme === "light" || candidate.theme === "dark")
  );
}

export function CourseProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LearningState>(emptyState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Hydration intentionally restores browser-only state after the server render.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (isLearningState(parsed)) setState(parsed);
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
      if (!isLearningState(parsed)) {
        return { ok: false, message: "文件结构不符合 LearningState v1。" };
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
