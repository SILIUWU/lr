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

export type ContentOrigin =
  | "source_translation"
  | "source_definition"
  | "editorial_explanation"
  | "engineering_extension"
  | "source_unspecified"
  | "failure_analysis";

export type ContentReviewStatus = "machine_draft" | "verified";

export interface ReadingSourceRef {
  chapter: number;
  section?: string;
  pages: string;
  equation?: string;
  figure?: string;
  table?: string;
}

interface BaseReadingBlock {
  id: string;
  origin: ContentOrigin;
  /**
   * Source-backed copy is public only after it has been checked against the
   * arXiv LaTeX/PDF. Legacy generated blocks omit this field and are treated
   * as machine drafts.
   */
  reviewStatus?: ContentReviewStatus;
  source: ReadingSourceRef;
  title?: string;
}

export interface ParagraphBlock extends BaseReadingBlock {
  type: "paragraph";
  text: string;
  originalExcerpt?: string;
}

export interface ListBlock extends BaseReadingBlock {
  type: "list";
  items: string[];
}

export interface FormulaBlock extends BaseReadingBlock {
  type: "formula";
  expression: string;
  latex?: string;
  reading?: string;
  symbols?: Array<[string, string]>;
}

export interface CodeBlock extends BaseReadingBlock {
  type: "code";
  language: string;
  code: string;
  explanation?: string;
}

export interface FigureBlock extends BaseReadingBlock {
  type: "figure";
  src?: string;
  alt: string;
  caption: string;
  adapted?: boolean;
}

export interface TableBlock extends BaseReadingBlock {
  type: "table";
  columns: string[];
  rows: string[][];
  caption?: string;
}

export interface ExampleBlock extends BaseReadingBlock {
  type: "example";
  scenario: string;
  steps: string[];
  result?: string;
  limitation?: string;
}

export interface CalloutBlock extends BaseReadingBlock {
  type: "callout" | "failure";
  text: string;
}

export type ReadingBlock =
  | ParagraphBlock
  | ListBlock
  | FormulaBlock
  | CodeBlock
  | FigureBlock
  | TableBlock
  | ExampleBlock
  | CalloutBlock;

export interface ReadingSubsection {
  id: string;
  number?: string;
  level: number;
  enTitle: string;
  zhTitle: string;
  pages: string;
  blocks: ReadingBlock[];
}

export interface ChapterContent {
  chapter: number;
  title: string;
  zhTitle: string;
  pages: string;
  minutes: number;
  overview: string;
  status: "guide" | "in_progress" | "complete";
  sections: ReadingSubsection[];
  glossary: GlossaryTerm[];
  summary: string[];
  metrics: {
    chineseCharacters: number;
    sourceCoverage: number;
    sectionCount: number;
    blockCount: number;
  };
}

/** @deprecated Kept only while old lesson copy is being displayed as a guide. */
export interface ReadingSection {
  title: string;
  english: string;
  paragraphs: string[];
  checkpoint?: string;
}

/** @deprecated The chapter reader uses ChapterContent. */
export interface ChapterReading {
  chapter: number;
  title: string;
  zhTitle: string;
  pages: string;
  minutes: number;
  overview: string;
  sections: ReadingSection[];
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
  chapter?: number;
  sectionId?: string;
  sourceHref?: string;
  excerpt: string;
  body: string;
  intent: "不懂" | "重要" | "存疑" | "深挖";
  createdAt: number;
}

export interface LearningState {
  version: 2;
  completedLessons: string[];
  lastLesson: string | null;
  lastChapter: number | null;
  lastSection: string | null;
  completedSections: string[];
  readingPositions: Record<string, number>;
  attempts: Attempt[];
  cards: Record<string, ReviewCard>;
  notes: NoteItem[];
  theme: "light" | "dark";
}
