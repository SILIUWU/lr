import type { Metadata } from "next";
import { ProgressPage } from "@/components/progress-page";

export const metadata: Metadata = { title: "学习进度" };

export default function Page() {
  return <ProgressPage />;
}
