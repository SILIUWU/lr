import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonView } from "@/components/lesson-view";
import { getLesson, lessons } from "@/lib/course-data";

export function generateStaticParams() {
  return lessons.map((lesson) => ({ slug: lesson.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lesson = getLesson(slug);
  return lesson
    ? {
        title: lesson.title,
        description: lesson.summary,
      }
    : {};
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = getLesson(slug);
  if (!lesson) notFound();
  return <LessonView lesson={lesson} />;
}
