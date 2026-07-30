import type { Metadata } from "next";
import { NotesPage } from "@/components/notes-page";

export const metadata: Metadata = { title: "批注与提问包" };

export default function Page() {
  return <NotesPage />;
}
