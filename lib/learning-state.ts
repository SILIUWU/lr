import type { LearningState } from "./types";

export type LearningStateV1 = Omit<
  LearningState,
  | "version"
  | "lastChapter"
  | "lastSection"
  | "completedSections"
  | "readingPositions"
> & { version: 1 };

export const emptyLearningState: LearningState = {
  version: 2,
  completedLessons: [],
  lastLesson: null,
  lastChapter: null,
  lastSection: null,
  completedSections: [],
  readingPositions: {},
  attempts: [],
  cards: {},
  notes: [],
  theme: "light",
};

export function isLearningState(value: unknown): value is LearningState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LearningState>;
  return (
    candidate.version === 2 &&
    Array.isArray(candidate.completedLessons) &&
    Array.isArray(candidate.completedSections) &&
    Array.isArray(candidate.attempts) &&
    Array.isArray(candidate.notes) &&
    typeof candidate.readingPositions === "object" &&
    typeof candidate.cards === "object" &&
    (candidate.theme === "light" || candidate.theme === "dark")
  );
}

export function isLearningStateV1(value: unknown): value is LearningStateV1 {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LearningStateV1>;
  return (
    candidate.version === 1 &&
    Array.isArray(candidate.completedLessons) &&
    Array.isArray(candidate.attempts) &&
    Array.isArray(candidate.notes) &&
    typeof candidate.cards === "object" &&
    (candidate.theme === "light" || candidate.theme === "dark")
  );
}

export function migrateLearningStateV1(
  value: LearningStateV1,
): LearningState {
  return {
    ...value,
    version: 2,
    lastChapter: null,
    lastSection: null,
    completedSections: [],
    readingPositions: {},
  };
}
