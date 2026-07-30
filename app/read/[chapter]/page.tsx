import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChapterReader } from "@/components/chapter-reader";
import {
  chapterSlug,
  chapters,
  getChapterContent,
} from "@/lib/chapter-content";

export function generateStaticParams() {
  return chapters.map((chapter) => ({
    chapter: chapterSlug(chapter.chapter),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chapter: string }>;
}): Promise<Metadata> {
  const { chapter: slug } = await params;
  const chapter = getChapterContent(slug);
  if (!chapter) return {};
  return {
    title: `Ch.${chapter.chapter} ${chapter.zhTitle}`,
    description: `${chapter.title} 的中文学习页；当前发布 ${chapter.metrics.blockCount} 个已核验区块，并保留 PDF 页码、英文术语与内容边界。`,
  };
}

export default async function ReadChapterPage({
  params,
}: {
  params: Promise<{ chapter: string }>;
}) {
  const { chapter: slug } = await params;
  const chapter = getChapterContent(slug);
  if (!chapter) notFound();
  return <ChapterReader chapter={chapter} />;
}
