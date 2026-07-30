import catalog from "@/content/catalog.json";
import { chapterReadings } from "./reading-content";

export type ChapterCatalogItem = (typeof catalog)[number];

export const chapterCatalog = catalog.map((chapter) => {
  const guide = chapterReadings.find((item) => item.chapter === chapter.chapter);
  const editorialCharacters =
    guide?.sections.reduce(
      (total, section) =>
        total +
        section.paragraphs.reduce(
          (paragraphTotal, paragraph) =>
            paragraphTotal +
            (paragraph.match(/[\u3400-\u9fff]/g)?.length ?? 0),
          0,
        ),
      0,
    ) ?? 0;
  const editorialBlocks =
    guide?.sections.reduce(
      (total, section) => total + section.paragraphs.length,
      0,
    ) ?? 0;
  return {
    ...chapter,
    zhTitle: guide?.zhTitle ?? chapter.zhTitle,
    metrics: {
      ...chapter.metrics,
      chineseCharacters:
        chapter.metrics.chineseCharacters + editorialCharacters,
      blockCount: chapter.metrics.blockCount + editorialBlocks,
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
