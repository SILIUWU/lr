import type { Metadata } from "next";
import { ReviewPage } from "@/components/review-page";

export const metadata: Metadata = { title: "到期复习" };

export default function Page() {
  return <ReviewPage />;
}
