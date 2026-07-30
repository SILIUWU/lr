import type { Metadata, Viewport } from "next";
import { CourseProvider } from "@/components/course-provider";
import { SiteShell } from "@/components/site-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Agentic AI 全栈指南 · From Foundations to Systems",
    template: "%s · Agentic AI 全栈指南",
  },
  description:
    "基于 The Hitchhiker’s Guide to Agentic AI 的中英双语分层精读：12 个单元、六个交互实验与 60 道原创学习题。",
  applicationName: "Agentic AI 全栈指南",
  authors: [{ name: "Based on Guo et al." }],
  keywords: [
    "Agentic AI",
    "LLM",
    "RAG",
    "Memory",
    "MCP",
    "A2A",
    "Multi-Agent",
    "AI 学习",
  ],
  openGraph: {
    title: "Agentic AI 全栈指南",
    description: "从模型底座，到可以被信任的自主系统。",
    type: "website",
    locale: "zh_CN",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Agentic AI 全栈指南 · From Foundations to Systems",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Agentic AI 全栈指南",
    description: "从模型底座，到可以被信任的自主系统。",
    images: ["/og.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f0e8" },
    { media: "(prefers-color-scheme: dark)", color: "#111923" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <CourseProvider>
          <SiteShell>{children}</SiteShell>
        </CourseProvider>
      </body>
    </html>
  );
}
