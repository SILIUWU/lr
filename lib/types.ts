export type EvidenceKind = "paper" | "explanation" | "practice" | "unknown";

export interface SourceRef {
  label: string;
  section: string;
  pages: string;
  url: string;
}

export interface GlossaryTerm {
  term: string;
  zh: string;
  meaning: string;
}

export interface MultipleChoiceQuiz {
  id: string;
  type: "mcq";
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  topic: string;
}

export interface OpenQuiz {
  id: string;
  type: "open";
  prompt: string;
  hints: [string, string, string];
  answer: string;
  variant: string;
  rubric: string;
  topic: string;
}

export type Quiz = MultipleChoiceQuiz | OpenQuiz;

export type LabKind =
  | "architecture"
  | "rag"
  | "memory"
  | "loop"
  | "mcp"
  | "multiagent";

export interface Lesson {
  index: number;
  slug: string;
  part: number;
  partLabel: string;
  title: string;
  subtitle: string;
  chapters: string;
  pageRange: string;
  minutes: number;
  summary: string;
  objectives: string[];
  prerequisites: string[];
  terms: GlossaryTerm[];
  facts: string[];
  explanations: string[];
  practice: string[];
  pitfalls: string[];
  formula?: {
    expression: string;
    reading: string;
    symbols: Array<[string, string]>;
  };
  takeaways: string[];
  sources: SourceRef[];
  labs: LabKind[];
  quizzes: Quiz[];
}

export interface CoursePart {
  id: number;
  roman: string;
  title: string;
  zh: string;
  chapterRange: string;
}

export interface ChapterMapItem {
  chapter: number;
  title: string;
  lessonSlug: string;
}

export interface ReviewCard {
  quizId: string;
  lessonSlug: string;
  topic: string;
  due: number;
  interval: number;
  ease: number;
  repetitions: number;
  lastScore: number;
}

export interface Attempt {
  quizId: string;
  lessonSlug: string;
  correct: boolean;
  score: number;
  at: number;
}

export interface NoteItem {
  id: string;
  lessonSlug: string;
  lessonTitle: string;
  excerpt: string;
  body: string;
  intent: "不懂" | "重要" | "存疑" | "深挖";
  createdAt: number;
}

export interface LearningState {
  version: 1;
  completedLessons: string[];
  lastLesson: string | null;
  attempts: Attempt[];
  cards: Record<string, ReviewCard>;
  notes: NoteItem[];
  theme: "light" | "dark";
}
