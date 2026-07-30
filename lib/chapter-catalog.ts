import catalog from "@/content/catalog.json";
import { chapterReadings } from "./reading-content";

export type ChapterCatalogItem = (typeof catalog)[number];

export const chapterCatalog = catalog.map((chapter) => {
  const guide = chapterReadings.find((item) => item.chapter === chapter.chapter);
  const verified = chapter.chapter === 15
    ? { chineseCharacters: 998, sourceCoverage: 100, blockCount: 14 }
    : chapter.chapter === 16
      ? { chineseCharacters: 5767, sourceCoverage: 100, blockCount: 126 }
      : { chineseCharacters: 0, sourceCoverage: 0, blockCount: 0 };
  return {
    ...chapter,
    zhTitle: guide?.zhTitle ?? chapter.zhTitle,
    status: chapter.chapter === 15 ? "complete" : "in_progress",
    metrics: {
      ...chapter.metrics,
      ...verified,
    },
  };
});

export const readerMetrics = chapterCatalog.reduce(
  (total, chapter) => ({
    chapters: total.chapters + 1,
    sections: total.sections + chapter.metrics.sectionCount,
    blocks: total.blocks + chapter.metrics.blockCount,
    chineseCharacters:
      total.chineseCharacters + chapter.metrics.chineseCharacters,
  }),
  { chapters: 0, sections: 0, blocks: 0, chineseCharacters: 0 },
);

export function catalogChapter(chapter: number) {
  return chapterCatalog.find((item) => item.chapter === chapter);
}

export function catalogHref(chapter: number, sectionId?: string | null) {
  const base = `/read/ch-${String(chapter).padStart(2, "0")}`;
  return sectionId ? `${base}#${sectionId}` : base;
}
